import { useAppStore } from '../../store'

export function Dashboard(): React.JSX.Element {
  const agentRunning = useAppStore((s) => s.agentRunning)
  const logs = useAppStore((s) => s.logs)
  const positions = useAppStore((s) => s.positions)

  const handleToggleAgent = async (): Promise<void> => {
    if (agentRunning) {
      await window.api.stopAgent()
    } else {
      await window.api.startAgent()
    }
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-base font-semibold text-neutral-100">Dashboard</h1>
        <button
          onClick={handleToggleAgent}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            agentRunning
              ? 'bg-red-500/15 text-red-400 hover:bg-red-500/25'
              : 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'
          }`}
        >
          {agentRunning ? 'Stop Agent' : 'Start Agent'}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <Stat label="Agent Status" value={agentRunning ? 'Running' : 'Stopped'} accent={agentRunning ? 'green' : 'neutral'} />
        <Stat label="Open Positions" value={String(positions.length)} />
        <Stat label="Log Entries" value={String(logs.length)} />
      </div>

      <p className="text-xs text-neutral-600">
        Configure OANDA and an AI provider in Settings to begin trading.
      </p>
    </div>
  )
}

function Stat({
  label,
  value,
  accent = 'neutral'
}: {
  label: string
  value: string
  accent?: 'green' | 'neutral'
}): React.JSX.Element {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
      <p className="text-xs text-neutral-500 mb-1">{label}</p>
      <p
        className={`text-lg font-semibold ${
          accent === 'green' ? 'text-emerald-400' : 'text-neutral-100'
        }`}
      >
        {value}
      </p>
    </div>
  )
}
