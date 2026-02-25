import { useAppStore } from '../../store'

export function TitleBar(): React.JSX.Element {
  const agentRunning = useAppStore((s) => s.agentRunning)

  return (
    <div className="drag titlebar-gradient h-9 flex items-center justify-between px-4 shrink-0">
      <span className="text-xs font-semibold tracking-widest text-neutral-400 uppercase">
        Tradent
      </span>
      <div className="no-drag flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium ${
            agentRunning
              ? 'bg-emerald-500/15 text-emerald-400'
              : 'bg-neutral-800 text-neutral-500'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              agentRunning ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-600'
            }`}
          />
          {agentRunning ? 'Agent running' : 'Agent stopped'}
        </span>
      </div>
    </div>
  )
}
