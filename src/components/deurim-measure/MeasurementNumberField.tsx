/**
 * The one measurement input every field uses (F-022).
 *
 * WHY THIS EXISTS AS A SHARED COMPONENT: the previous field parsed and clamped
 * on every keystroke, so typing "2400" into a min-300 box became "300" after
 * the first character. Fixing that in three places would have left the next
 * measurement field to reintroduce it. There is now one implementation and one
 * contract:
 *
 *   - `draft` retains intermediate edits, including out-of-range numbers
 *   - "" is a valid editing state, not zero and not the default
 *   - invalid drafts show an error and never replace confirmed space
 *   - Escape abandons the edit and restores the committed value
 *   - keyboard, paste and the spinner all land on the same committed value
 *
 * Styling comes entirely from `ds-measure` tokens; nothing is invented here.
 */
import { formatCmWithUnit, keepCmDraftCharacters, mmToCm, parseCmToMm } from './consumerUnits';
import type { SpecValue } from './demoContract';
import { isManufacturerBacked } from './demoContract';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { MeasurementDefinition } from './demoContract';
import { MeasurementSlider } from './MeasurementSlider';
import { SpatialMeasurementGlyph } from './SpatialMeasurementGlyph';
import { MEASUREMENT_AXIS } from './measurementAxis';
import { CONSUMER_UI } from './demoContract';
import { setupMeasurementError } from './demoContract';

/**
 * What counts as a control, for the row's focus-redirect guard.
 *
 * The definition of "focusable", not a list of tags we happen to have used. A
 * new control type is covered by this the day it is added.
 */
const FOCUSABLE = 'input, button, select, textarea, a[href], [tabindex]:not([tabindex="-1"])';

/*
 * These three lived here as a hard-coded map, and two of them called the
 * space a 자리 - which in this product's vocabulary is where the appliance
 * STANDS, not the space being measured (PROJECT_SPEC 19). A shopper reading
 * `자리의 좌우 길이` under a label that says 설치 공간 너비 is being given two
 * names for one thing. They are consumer copy, so they now live with the rest
 * of it and say 설치 공간.
 */

interface MeasurementNumberFieldProps {
  definition: MeasurementDefinition;
  productDimension: SpecValue;
  /** Editing state. Owned by the store, never rewritten mid-edit. */
  draft: string;
  /** True once the shopper has given this measurement themselves. */
  confirmed: boolean;
  onDraftChange: (draft: string) => void;
  onCommit: () => void;
  onFocus: () => void;
  onBlur: () => void;
  /** One nudge up or down. Shared by the arrow keys and the mouse wheel. */
  onStep: (direction: 1 | -1) => void;
  /** The committed millimetres, for the contextual slider's thumb. */
  valueMm: number;
  /** Dragging the slider. Intentional input, so it confirms like typing does. */
  onSlide: (valueMm: number) => void;
  active: boolean;
}

export function MeasurementNumberField({
  definition,
  productDimension,
  draft,
  confirmed,
  onDraftChange,
  onCommit,
  onFocus,
  onBlur,
  onStep,
  valueMm,
  onSlide,
  active,
}: MeasurementNumberFieldProps) {
  const axis = MEASUREMENT_AXIS[definition.id] ?? 'width';
  const inputId = `measure-${definition.id}`;
  const referenceId = `${inputId}-product`;
  const inputRef = useRef<HTMLInputElement>(null);
  const draftMm = parseCmToMm(draft);
  const error = setupMeasurementError(definition.field, draft);
  const sliderValueMm = draftMm !== null && draftMm >= definition.minMm && draftMm <= definition.maxMm
    ? draftMm : valueMm;
  const stepFromDraft = useCallback((direction: 1 | -1) => {
    // A nudge follows the number being edited, using the existing commit/clamp.
    if (sliderValueMm !== valueMm) onCommit();
    onStep(direction);
  }, [sliderValueMm, valueMm, onCommit, onStep]);

  // Remembered so Escape can put back what was there before the edit started.
  const [draftAtFocus, setDraftAtFocus] = useState(draft);

  // A committed change from elsewhere - a preset, a reset - should show up, but
  // only while the shopper is not mid-edit in this very field.
  useEffect(() => {
    if ((inputRef.current?.getRootNode() as Document | ShadowRoot)?.activeElement === inputRef.current) return;
    setDraftAtFocus(draft);
  }, [draft]);

  /**
   * Mouse wheel stepping.
   *
   * ONLY while this field actually has focus. A wheel over a panel the shopper
   * is merely reading must scroll the page, never silently change a
   * measurement - changing a value someone did not mean to touch is worse than
   * not offering the shortcut at all.
   *
   * Bound with `addEventListener` rather than `onWheel` because React attaches
   * wheel listeners passively, and a passive listener cannot call
   * `preventDefault()` - so the page would scroll at the same time.
   */
  useEffect(() => {
    const input = inputRef.current;
    if (input === null) return undefined;

    const onWheel = (event: WheelEvent) => {
      if ((inputRef.current?.getRootNode() as Document | ShadowRoot)?.activeElement !== input) return;
      if (event.deltaY === 0) return;
      event.preventDefault();
      stepFromDraft(event.deltaY < 0 ? 1 : -1);
    };

    input.addEventListener('wheel', onWheel, { passive: false });
    return () => input.removeEventListener('wheel', onWheel);
  }, [stepFromDraft]);

  return (
    // THE WHOLE ROW IS THE CONTROL.
    //
    // The row already showed a hover surface across its full width, but only
    // the digits themselves took focus - so the interface offered a target it
    // did not honour. Clicking anywhere in the row now focuses the field.
//
    // The guard matters: without it a click that landed on the input would
    // focus it, bubble to the row, and focus it a second time - harmless for
    // focus, but it would also re-select the text under a shopper's cursor
    // mid-edit.
    <div
      className={[
        'ds-measure',
        active ? 'is-active' : '',
        confirmed ? 'is-confirmed' : '',
      ].filter(Boolean).join(' ')}
      onPointerDown={(event) => {
        // ANYTHING THAT TAKES FOCUS HANDLES ITS OWN GESTURE.
        //
        // This used to be `closest('input, button, a')` - a list of tag names
        // that had to grow every time a control was added, and which had
        // already been grown once after the slider was swallowed by it. The
        // test is not "which tags do we know about" but "is this thing a
        // control", and a control is precisely something the browser will focus
        // on its own. That needs no extending for the next one.
        if (event.target instanceof HTMLElement && event.target.closest(FOCUSABLE)) {
          return;
        }
        // Everywhere else in the row: keep the browser from moving focus to
        // whatever was clicked, and put it where the row promised it would go.
        event.preventDefault();
        inputRef.current?.focus();
      }}
      /**
       * THE EDITOR CLOSES WHEN FOCUS LEAVES THE EDITOR - NOT THE INPUT.
       *
       * This handler is the whole fix for a bug that survived the previous
       * cycle. Pressing the slider moves DOM focus off the number field, which
       * is a perfectly ordinary thing to do INSIDE one editor - and the number
       * field's own `onBlur` was reading that as "the shopper has finished
       * here" and closing the row. The slider then unmounted underneath the
       * pointer, mid-gesture, before it had even taken focus.
       *
       * `focusout` carries `relatedTarget`: where focus is going. If that is
       * still inside this row, nothing has been left. This is the semantic
       * boundary the tag whitelist was standing in for - the row IS the
       * measurement editor, and any control added inside it is covered without
       * being named.
       */
      onBlur={(event) => {
        const next = event.relatedTarget;
        if (next instanceof Node && event.currentTarget.contains(next)) return;
        onBlur();
      }}
    >
      <div className="ds-measure__body">
        <div className="ds-measure__header">
        <label className="ds-measure__label" htmlFor={inputId}>
          {definition.label}
        </label>
        </div>
        <div className="ds-measure__row">
          <span className="ds-measure__number">
          <span className="ds-measure__number-size" aria-hidden="true">{draft || CONSUMER_UI.measurementEmpty}</span>
          <input
            ref={inputRef}
            id={inputId}
            className="ds-measure__input"
            aria-label={`${definition.label} (${definition.unit})`}
            /* `inputMode` gives a numeric keypad without the type=number
               parsing quirks; the value is validated on commit anyway. */
            type="text"
            /* `decimal` rather than `numeric`: the box is centimetres now, so
               a phone keypad has to offer the point that 140.5 needs. */
            inputMode="decimal"
            autoComplete="off"
            value={draft}
            /* An untouched field shows a dash, not a plausible-looking number:
               a default presented as a value reads as "already measured". */
            placeholder={CONSUMER_UI.measurementEmpty}
            aria-describedby={`${referenceId}${error ? ` ${inputId}-error` : ''}`}
            aria-invalid={Boolean(error)}
            aria-description={`${mmToCm(definition.minMm)}~${mmToCm(definition.maxMm)}cm 범위로 입력해 주세요.`}
            onFocus={() => {
              setDraftAtFocus(draft);
              onFocus();
            }}
            onChange={(event) => {
              const next = keepCmDraftCharacters(event.target.value);
              onDraftChange(next);
            }}
            onKeyDown={(event) => {
              // The 3D controls listen on the canvas, so arrows and editing keys
              // reach the field untouched; these two are the field's own.
              if (event.key === 'ArrowUp') {
                event.preventDefault();
                stepFromDraft(1);
              } else if (event.key === 'ArrowDown') {
                event.preventDefault();
                stepFromDraft(-1);
              } else if (event.key === 'Enter') {
                event.preventDefault();
                onCommit();
                inputRef.current?.blur();
              } else if (event.key === 'Escape') {
                event.preventDefault();
                onDraftChange(draftAtFocus);
                inputRef.current?.blur();
              }
            }}
            /**
             * Commits this field's own value, and nothing else. Whether the
             * EDITOR should close is the row's decision, not the input's - see
             * the row's `onBlur` above.
             */
            onBlur={() => {
              onCommit();
            }}
          />
          </span>
          <span className="ds-measure__unit" aria-hidden="true">
            {definition.unit}
          </span>
        </div>
        <span className="ds-measure__visual"><SpatialMeasurementGlyph axis={axis} /></span>
        <div className="ds-measure__reference" id={referenceId}>
          {CONSUMER_UI.productDimensionByAxis[axis]}{' '}{isManufacturerBacked(productDimension)
            ? formatCmWithUnit(productDimension.value!)
            : CONSUMER_UI.productDimensionUnavailable}
        </div>
        {error && <p className="ds-measure__error" id={`${inputId}-error`} role="status">{error}</p>}
        {/*
          Revealed while the field is active, in step with the 3D guide - and
          with the slider, so exactly one measurement is adjustable at a time.
          Keep the disclosure mounted for interruptible intrinsic-height motion.
          Collapsed sliders are inert and absent from the accessibility tree.
        */}
        <div className="ds-measure__hint" inert={!active} aria-hidden={!active}>
          <span><MeasurementSlider definition={definition} valueMm={sliderValueMm} onChange={onSlide}
            productValueMm={isManufacturerBacked(productDimension) ? productDimension.value! : undefined}
            referenceId={referenceId} /></span>
        </div>
      </div>
    </div>
  );
}
