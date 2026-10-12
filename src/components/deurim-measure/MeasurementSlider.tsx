/**
 * MEASUREMENT SLIDER (F-042).
 *
 * The third direct-manipulation axis. Product drag moves the appliance, door
 * drag swings a leaf, and this changes the ROOM - the walls move, the clearances
 * follow, the verdict follows.
 *
 * WHAT IT IS NOT
 *
 * It is not the way a measurement is entered. This is an installation tool: the
 * number is a tape-measure reading, and a shopper who drags a slider until it
 * "looks about right" has measured nothing. The numeric field remains the exact
 * input; the slider is for exploring - "what if the alcove were 50 mm wider" -
 * and for feeling that these three numbers are that room.
 *
 * ONE STATE, TWO CONTROLS
 *
 *     slider  -> commitSpaceDimension -> space -> layout -> report -> 3D
 *     input   -> commitMeasurement    -> space -> layout -> report -> 3D
 *
 * Both write the same field through the same clamp. There is no slider value
 * kept anywhere; the parent derives the visible value from its valid draft,
 * falling back to committed space while input is empty or outside the range.
 *
 * RANGE AND STEP come from `data/measurements.ts` - the same `minMm`, `maxMm`
 * and `stepMm` the keyboard and the wheel already use. No second set of limits,
 * and nothing here implies that a manufacturer's requirement is a limit on how
 * big a room may be.
 */
import { formatCm, mmToCm } from './consumerUnits';
import { useLayoutEffect, useRef, useState } from 'react';
import { measurementRulerTicks } from './measurementRuler';
import type { MeasurementDefinition } from './demoContract';

interface MeasurementSliderProps {
  definition: MeasurementDefinition;
  /** Millimetres derived from the shared draft/space, never a local value. */
  valueMm: number;
  productValueMm?: number;
  referenceId?: string;
  /**
   * Fires while dragging. Dragging IS intentional input, so this confirms the
   * measurement exactly as typing does - but merely revealing the slider does
   * not, which is why nothing happens on focus alone.
   */
  onChange: (valueMm: number) => void;
}

export function MeasurementSlider({ definition, valueMm, onChange, productValueMm, referenceId }: MeasurementSliderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const [rulerWidth, setRulerWidth] = useState(0);
  useLayoutEffect(() => {
    const rail = railRef.current!;
    // Measure the actual inset scale, including rem-based thumb sizing.
    const scale = rail.querySelector<HTMLElement>('.measurement-ruler__scale')!;
    const measure = () => setRulerWidth(scale.getBoundingClientRect().width);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(scale);
    return () => observer.disconnect();
  }, []);
  const { minMm, maxMm, stepMm } = definition;
  const fraction = (Math.min(Math.max(valueMm, minMm), maxMm) - minMm) / (maxMm - minMm);
  // Do not misrepresent unavailable or out-of-range specifications at an endpoint.
  const productFraction = productValueMm !== undefined && Number.isFinite(productValueMm)
    && productValueMm >= minMm && productValueMm <= maxMm
    ? (productValueMm - minMm) / (maxMm - minMm) : undefined;

  return (
    <div className="ds-slider measurement-ruler">
      {/*
        A native range input, kept invisible over the drawn track. It brings
        pointer capture, arrow keys, Home/End, Page Up/Down and the correct
        screen-reader semantics with it - all of which would otherwise have to
        be rebuilt, and rebuilt worse.
      */}
      {/*
        The whole ruler is the pointer surface. Decorative ticks and labels
        share the native input's inset coordinates without extra hit targets.
      */}
      <div className="ds-slider__rail" ref={railRef}>
      <input
        ref={inputRef}
        type="range"
        className="ds-slider__input"
        min={minMm}
        max={maxMm}
        /* A typed tenth of a cm must survive the native range's step grid. */
        step={1}
        value={Math.min(Math.max(valueMm, minMm), maxMm)}
        aria-label={`${definition.label} (${definition.unit})`}
        aria-describedby={referenceId}
        aria-valuemin={mmToCm(minMm)}
        aria-valuemax={mmToCm(maxMm)}
        aria-valuenow={mmToCm(valueMm)}
        aria-valuetext={`${formatCm(valueMm)}${definition.unit}`}
        onChange={(event) => onChange(Number(event.target.value))}
        onKeyDown={(event) => {
          const direction = event.key === 'ArrowRight' || event.key === 'ArrowUp' ? 1
            : event.key === 'ArrowLeft' || event.key === 'ArrowDown' ? -1 : 0;
          if (!direction) return;
          event.preventDefault();
          // Preserve the existing keyboard nudge while accepting 1mm precision.
          onChange(Math.min(maxMm, Math.max(minMm, valueMm + direction * stepMm)));
        }}
      />
      <div className="ds-slider__track" aria-hidden="true">
        <span className="measurement-ruler__zone" style={{ ['--slider-fraction' as string]: fraction }} />
        <div className="measurement-ruler__scale">
          {measurementRulerTicks(minMm, maxMm, rulerWidth).map(tick => (
            <span key={tick.valueMm} className="measurement-ruler__tick" data-level={tick.level}
              data-value-mm={tick.valueMm} style={{ insetInlineStart: `${tick.fraction * 100}%` }}>
              {tick.label && <span className="measurement-ruler__label"
                data-edge={tick.valueMm === minMm ? 'start' : tick.valueMm === maxMm ? 'end' : undefined}>
                {formatCm(tick.valueMm)}
              </span>}
            </span>
          ))}
        </div>
        {productFraction !== undefined && <span className="ds-slider__reference"
          style={{ ['--slider-fraction' as string]: productFraction }} />}
        <div
          className="ds-slider__thumb"
          /* The primitive turns this into a position; see `.ds-slider__thumb`. */
          style={{ ["--slider-fraction" as string]: fraction }}
        />
      </div>
      </div>
    </div>
  );
}
