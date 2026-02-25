import { useState, useEffect, useRef, useCallback } from 'react'
import { Trash2 } from 'lucide-react'
import { useAppStore } from '../../store'
import type { LogLevel } from '../../types'

const LEVELS: Array<LogLevel | 'all'> = ['all', 'info', 'warn', 'error', 'trade', 'agent', 'debug']

const LEVEL_STYLES: Record<LogLevel, string> = {
  info:  'text-neutral-400',
  debug: 'text-neutral-600',
  warn:  'text-yellow-400',
  error: 'text-red-400',
  trade: 'text-emerald-400',
  agent: 'text-sky-400'
}

const LEVEL_FILTER_ACTIVE: Record<string, string> = {
  all:   'bg-neutral-700 text-neutral-200 border-neutral-600',
  info:  'bg-neutral-700 text-neutral-200 border-neutral-600',
  debug: 'bg-neutral-800 text-neutral-500 border-neutral-700',
  warn:  'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  error: 'bg-red-500/15 text-red-400 border-red-500/30',
  trade: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  agent: 'bg-sky-500/15 text-sky-400 border-sky-500/30'
}

export function LiveLogs(): React.JSX.Element {
  const logs = useAppStore((s) => s.logs)
  const setLogs = useAppStore((s) => s.setLogs)
  const [filter, setFilter] = useState<LogLevel | 'all'>('all')
  const containerRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const userScrolledUp = useRef(false)

  useEffect(() => {
    if (!window.api) return
    window.api.getLogs(500).then(setLogs).catch(console.error)
  }, [setLogs])

  // Auto-scroll when new logs arrive, unless user scrolled up
  useEffect(() => {
    if (!userScrolledUp.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs.length])

  const handleScroll = useCallback((): void => {
    const el = containerRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60
    userScrolledUp.current = !atBottom
  }, [])

  const handleClear = async (): Promise<void> => {
    if (!window.api) return
    await window.api.clearLogs().catch(console.error)
    setLogs([])
  }

  const displayed = filter === 'all'
    ? [...logs].reverse()
    : [...logs].filter((l) => l.level === filter).reverse()

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-neutral-800 shrink-0">
        <div className="flex items-center gap-1 flex-1 flex-wrap">
          {LEVELS.map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilter(lvl)}
              className={`px-2 py-0.5 rounded text-xs font-medium border transition-colors ${
                filter === lvl
                  ? LEVEL_FILTER_ACTIVE[lvl]
                  : 'bg-transparent border-transparent text-neutral-600 hover:text-neutral-400'
              }`}
            >
              {lvl === 'all' ? 'All' : lvl.toUpperCase()}
            </button>
          ))}
        </div>
        <span className="text-xs text-neutral-700 tabular-nums shrink-0">{displayed.length}</span>
        <button
          onClick={handleClear}
          title="Clear logs"
          className="p-1 rounded text-neutral-700 hover:text-neutral-400 hover:bg-neutral-800 transition-colors shrink-0"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Log list */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto font-mono text-xs px-4 py-2 space-y-0.5"
      >
        {displayed.length === 0 ? (
          <p className="text-neutral-700 mt-4">
            {filter === 'all'
              ? 'No logs yet. Start the agent to see activity.'
              : `No ${filter.toUpperCase()} logs.`}
          </p>
        ) : (
          displayed.map((log) => (
            <div key={log.id} className="flex gap-3 leading-5 hover:bg-neutral-900 rounded px-1 py-px">
              <span className="text-neutral-700 shrink-0 tabular-nums">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              <span className={`shrink-0 w-10 ${LEVEL_STYLES[log.level]}`}>
                {log.level.toUpperCase().slice(0, 5)}
              </span>
              <span className="text-neutral-600 shrink-0">[{log.source}]</span>
              <span className="text-neutral-300 break-all">{log.message}</span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
