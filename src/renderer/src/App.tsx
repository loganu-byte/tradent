import { useEffect } from 'react'
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Sidebar } from './components/layout/Sidebar'
import { TitleBar } from './components/layout/TitleBar'
import { Dashboard } from './components/dashboard/Dashboard'
import { LiveLogs } from './components/logs/LiveLogs'
import { OpenPositions } from './components/positions/OpenPositions'
import { Chat } from './components/chat/Chat'
import { Settings } from './components/settings/Settings'
import { useAppStore } from './store'
import { useTheme } from './hooks/useTheme'

export default function App(): React.JSX.Element {
  const theme = useAppStore((s) => s.theme)
  const setAgentRunning = useAppStore((s) => s.setAgentRunning)
  const prependLog = useAppStore((s) => s.prependLog)

  useTheme(theme)

  // Subscribe to real-time events from main process
  useEffect(() => {
    if (!window.api) return
    const unsubLog = window.api.onNewLog((log) => prependLog(log as Parameters<typeof prependLog>[0]))
    const unsubStatus = window.api.onAgentStatus((s) =>
      setAgentRunning((s as { isRunning: boolean }).isRunning)
    )
    return () => {
      unsubLog()
      unsubStatus()
    }
  }, [prependLog, setAgentRunning])

  return (
    <MemoryRouter>
      <div className="flex flex-col h-screen bg-neutral-950 text-neutral-100 overflow-hidden select-none">
        <TitleBar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-hidden">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/logs" element={<LiveLogs />} />
              <Route path="/positions" element={<OpenPositions />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>
      </div>
    </MemoryRouter>
  )
}
