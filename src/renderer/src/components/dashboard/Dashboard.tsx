import { NavLink } from 'react-router-dom'
import { CheckCircle2, Circle, AlertTriangle, Activity } from 'lucide-react'
import { useAppStore } from '../../store'
import type { LogEntry } from '../../types'

const LOG_LEVEL_COLOR: Record<string, string> = {
  info: 'text-neutral-400',
  debug: 'text-neutral-600',
  warn: 'text-yellow-400',
  error: 'text-red-400',
  trade: 'text-emerald-400',
  agent: 'text-sky-400'
}

export function Dashboard(): React.JSX.Element {
  const agentRunning = useAppStore((s) => s.agentRunning)
  const logs = useAppStore((s) => s.logs)
  const positions = useAppStore((s) => s.positions)
  const settings = useAppStore((s) => s.settings)
  const agents = useAppStore((s) => s.agents)

  const providerConfigured = settings
    ? Object.values(settings.providers).some(Boolean)
    : false
  const hasAgents = agents.length > 0
  const ready = providerConfigured && hasAgents

  const recentLogs = logs.slice(0, 5)

  const handleToggleAgent = async (): Promise<void> => {
    if (!window.api) return
    if (agentRunning) {
      await window.api.stopAgent().catch(console.error)
    } else {
      await window.api.startAgent().catch(console.error)
    }
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-3xl space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-base font-semibold text-neutral-100">Dashboard</h1>
          <button
            onClick={handleToggleAgent}
            disabled={!ready}
            title={!ready ? 'Configure an AI provider and create an agent first' : undefined}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              agentRunning
                ? 'bg-red-500/15 text-red-400 hover:bg-red-500/25'
                : 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'
            }`}
          >
            {agentRunning ? 'Stop Agent' : 'Start Agent'}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            label="Agent"
            value={agentRunning ? 'Running' : 'Stopped'}
            accent={agentRunning ? 'green' : 'neutral'}
            dot={agentRunning}
          />
          <StatCard label="Open Positions" value={String(positions.length)} />
          <StatCard label="Log Entries" value={String(logs.length)} />
        </div>

        {/* Setup checklist */}
        {!ready && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={13} className="text-amber-400" />
              <h2 className="text-xs font-semibold text-neutral-300">Setup required</h2>
            </div>
            <div className="space-y-2">
              <ChecklistItem
                done={providerConfigured}
                label="At least one AI provider key (Gemini, OpenAI, Anthropic, or OpenRouter)"
                linkTo="/settings"
              />
              <ChecklistItem
                done={hasAgents}
                label="At least one agent created"
                linkTo="/agents"
              />
            </div>
          </div>
        )}

        {/* Recent activity */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg">
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <Activity size={13} className="text-neutral-500" />
              <h2 className="text-xs font-semibold text-neutral-400">Recent Activity</h2>
            </div>
            <NavLink to="/logs" className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors">
              View all →
            </NavLink>
          </div>
          <div className="px-4 py-2 font-mono text-xs">
            {recentLogs.length === 0 ? (
              <p className="py-4 text-neutral-700">No activity yet. Start the agent to see logs here.</p>
            ) : (
              <div className="space-y-0.5">
                {recentLogs.map((log) => (
                  <RecentLogRow key={log.id} log={log} />
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  accent = 'neutral',
  dot = false
}: {
  label: string
  value: string
  accent?: 'green' | 'neutral'
  dot?: boolean
}): React.JSX.Element {
  return (
    <div className="stat-card">
      <p className="text-xs text-neutral-500 mb-1">{label}</p>
      <div className="flex items-center gap-2">
        {dot && (
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
        )}
        <p className={`text-lg font-semibold ${accent === 'green' ? 'text-emerald-400' : 'text-neutral-100'}`}>
          {value}
        </p>
      </div>
    </div>
  )
}

function ChecklistItem({
  done,
  label,
  linkTo
}: {
  done: boolean
  label: string
  linkTo: string
}): React.JSX.Element {
  return (
    <div className="flex items-center gap-2">
      {done ? (
        <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
      ) : (
        <Circle size={13} className="text-neutral-700 shrink-0" />
      )}
      <span className={`text-xs ${done ? 'text-neutral-500 line-through' : 'text-neutral-300'}`}>
        {label}
      </span>
      {!done && (
        <NavLink to={linkTo} className="text-xs text-emerald-500 hover:text-emerald-400 ml-auto">
          Configure →
        </NavLink>
      )}
    </div>
  )
}

function RecentLogRow({ log }: { log: LogEntry }): React.JSX.Element {
  return (
    <div className="flex gap-3 leading-5 py-0.5">
      <span className="text-neutral-700 shrink-0 tabular-nums">
        {new Date(log.timestamp).toLocaleTimeString()}
      </span>
      <span className={`shrink-0 w-10 ${LOG_LEVEL_COLOR[log.level] ?? 'text-neutral-400'}`}>
        {log.level.toUpperCase().slice(0, 5)}
      </span>
      <span className="text-neutral-400 truncate">{log.message}</span>
    </div>
  )
}
