import { modelKey, parseModelKey, type ModelOption, type ModelRef } from '@/lib/chat/models'

interface ModelPickerProps {
  options: ModelOption[]
  value: ModelRef | undefined
  onChange: (value: ModelRef | undefined) => void
}

/** Chooses the LLM for the next messages. "Default" leaves the choice to the server (opencode.json). */
export function ModelPicker({ options, value, onChange }: ModelPickerProps) {
  const providers = [...new Set(options.map((o) => o.provider))]
  return (
    <select
      aria-label="Model"
      value={value ? modelKey(value) : ''}
      onChange={(e) => onChange(parseModelKey(e.target.value))}
      className="h-7 max-w-[11rem] truncate rounded-sm bg-transparent px-1.5 text-[13px] text-muted-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rwe-focus"
    >
      <option value="">Default</option>
      {providers.map((provider) => (
        <optgroup key={provider} label={provider}>
          {options
            .filter((o) => o.provider === provider)
            .map((o) => (
              <option key={modelKey(o)} value={modelKey(o)}>
                {o.label}
              </option>
            ))}
        </optgroup>
      ))}
    </select>
  )
}
