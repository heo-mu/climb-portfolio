import { CaretDownIcon } from '@phosphor-icons/react/dist/csr/CaretDown'
import { useId, useRef, useState } from 'react'
import { EyeIcon } from '@phosphor-icons/react/dist/csr/Eye'
import { EyeSlashIcon } from '@phosphor-icons/react/dist/csr/EyeSlash'
import { XIcon } from '@phosphor-icons/react/dist/csr/X'
import { InfoIcon } from '@phosphor-icons/react/dist/csr/Info'
import { CheckCircleIcon } from '@phosphor-icons/react/dist/csr/CheckCircle'
import { XCircleIcon } from '@phosphor-icons/react/dist/csr/XCircle'
import { specimenData } from './designSystemSpecimenData'
import { specimenTokenGraph } from './specimenTokenGraph'
import { inputSizes, inputVariantNodes } from './inputPropertyData'
import './DesignSystemSpecimen.css'

const inputNodes = { Default: '76:2944', Hover: '76:2959', Focus: '76:2973', Completed: '83:2682', Error: '76:2984', Disabled: '76:2996', 'Read-only': '76:3002' } as const
type InputState = keyof typeof inputNodes

function color(node: string, part: string) {
  const token = Object.entries(specimenData[node].tokens).find(([path]) => path.includes('/' + part + '/'))
  return token ? specimenTokenGraph[token[0]]?.value ?? token[1] : undefined
}

export function Choices({ label, hint, index, value, options, onChange }: { label: string; hint?: string; index?: string; value: string; options: readonly string[]; onChange: (value: string) => void }) {
  const name = useId()
  return <fieldset className="specimen-choices"><legend>{index && <small>{index}</small>}{label}{hint && <span>{hint}</span>}</legend><div>{options.map(option => <label key={option}><input type="radio" name={name} value={option} checked={value === option} onChange={() => onChange(option)} /><span>{option === 'Live' ? '직접 조작' : option}</span></label>)}</div></fieldset>
}
export function InputSpecimen() {
  const [type, setType] = useState<'Outline'>('Outline')
  const [size, setSize] = useState<keyof typeof inputSizes>('md')
  const [state, setState] = useState<InputState>('Focus')
  const [labelText, setLabelText] = useState('라벨명')
  const [value, setValue] = useState('내용 입력')
  const [label, setLabel] = useState(true)
  const [eye, setEye] = useState(true)
  const [alert, setAlert] = useState(true)
  const [revealed, setRevealed] = useState(true)
  const input = useRef<HTMLInputElement>(null)
  const id = useId()
  const metrics = inputSizes[size]
  const node = inputNodes[state]
  const HelperIcon = state === 'Focus' ? InfoIcon : state === 'Completed' ? CheckCircleIcon : state === 'Error' ? XCircleIcon : null
  const VisibilityIcon = revealed ? EyeIcon : EyeSlashIcon
  const showAlert = alert && HelperIcon
  const booleanControls = [
    { name: 'Label', value: label, set: setLabel },
    { name: 'Icon-eye', value: eye, set: setEye },
    { name: 'Alert', value: alert, set: setAlert },
  ]
  return <div className="system-specimen input-inspector" data-specimen="Input">
    <div className="specimen-workspace input-workspace">
      <div className="input-properties property-variant"><h3 className="property-group-heading">형태</h3>
        <Choices label="Type" value={type} options={['Outline']} onChange={next => setType(next as 'Outline')} />
        <Choices label="Size" value={size} options={Object.keys(inputSizes)} onChange={next => setSize(next as keyof typeof inputSizes)} />
        <label className="property-select"><span>State</span><span className="property-select-control"><select value={state} onChange={event => setState(event.target.value as InputState)}>{Object.keys(inputNodes).map(value => <option key={value}>{value}</option>)}</select><CaretDownIcon size={16} aria-hidden="true" /></span></label>
      </div>
      <div className="specimen-example input-preview">
        <div className="specimen-stage input-stage">
          <div className="input-preview-body"><div className="input-preview-paper"><div className="ds-field" data-figma-node={inputVariantNodes[size][state]} data-state={state} data-size={size} style={{ gap: metrics.gap }}>
            {label && <label htmlFor={id} style={{ fontSize: metrics.labelFont, lineHeight: metrics.labelLine + 'px', color: 'color-mix(in srgb, ' + specimenData[node].tokens['colors/text/secondary'] + ' 30%, #e4edeb)'  }}>{labelText}</label>}
            <div className="ds-input-shell" style={{ background: color(node, 'background'), color: color(node, 'label'), height: metrics.height, padding: metrics.padY + 'px ' + metrics.padX + 'px', border: 0, boxShadow: 'inset 0 0 0 ' + (state === 'Error' ? 2 : 1) + 'px ' + color(node, 'border') }}>
              <input ref={input} id={id} aria-label={labelText || 'Input'} type={revealed ? 'text' : 'password'} autoComplete="off" value={value} disabled={state === 'Disabled'} readOnly={state === 'Read-only'} aria-invalid={state === 'Error'} aria-describedby={showAlert ? id + '-helper' : undefined} onChange={event => setValue(event.target.value)} style={{ fontSize: metrics.font, lineHeight: metrics.line + 'px' }} />
              {eye && state !== 'Default' && <button type="button" className="ds-field-action" style={{ width: metrics.icon, height: metrics.icon }} disabled={state === 'Disabled'} aria-label={revealed ? '입력 내용 숨기기' : '입력 내용 보기'} aria-pressed={!revealed} onClick={() => setRevealed(current => !current)}><VisibilityIcon size={metrics.icon} weight="regular" color={color(node, 'icon')} aria-hidden="true" /></button>}
              {(state === 'Hover' || state === 'Focus') && <button type="button" className="ds-field-action" style={{ width: metrics.icon, height: metrics.icon }} aria-label="입력 내용 지우기" onMouseDown={event => event.preventDefault()} onClick={() => { setValue(''); input.current?.focus() }}><XIcon size={metrics.icon} weight="regular" color={color(node, 'icon')} aria-hidden="true" /></button>}
            </div>
            {showAlert && <span id={id + '-helper'} className="ds-input-helper" style={{ color: 'color-mix(in srgb, ' + color(node, 'helper') + ' 45%, #e4edeb)' }}><HelperIcon size={16} weight="fill" aria-hidden="true" />Alert 내용</span>}
          </div></div></div>
        </div>
      </div>
      <div className="input-properties property-content"><h3 className="property-group-heading">내용</h3>
        <label className="property-text"><span>Label Text</span><input value={labelText} onChange={event => setLabelText(event.target.value)} /></label>
        <label className="property-text"><span>Input Text</span><input value={value} onChange={event => setValue(event.target.value)} /></label>
      </div>
      <div className="input-properties property-visibility"><h3 className="property-group-heading">표시</h3>
        <div className="property-booleans">{booleanControls.map(control => <button key={control.name} type="button" role="switch" aria-checked={control.value} onClick={() => control.set(!control.value)}><span>{control.name}</span><span className="property-switch-state" aria-hidden="true"><span>{control.value ? 'ON' : 'OFF'}</span><i /></span></button>)}</div>
      </div>
    </div>
  </div>
}
