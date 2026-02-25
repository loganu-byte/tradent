export function Toggle({
  checked,
  onChange,
  disabled
}: {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}): React.JSX.Element {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex w-10 h-5 shrink-0 rounded-full transition-colors duration-200
        focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed
        ${checked ? 'bg-emerald-600' : 'bg-neutral-700'}`}
    >
      <span
        className={`absolute top-0.5 left-0 w-4 h-4 rounded-full bg-white shadow-sm
          transition-transform duration-200
          ${checked ? 'translate-x-5' : 'translate-x-0.5'}`}
      />
    </button>
  )
}
