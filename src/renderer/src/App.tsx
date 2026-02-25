import { useEffect } from 'react'
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Sidebar } from './components/layout/Sidebar'
import { TitleBar } from './components/layout/TitleBar'
import { UpdateBanner } from './components/layout/UpdateBanner'
import { Dashboard } from './components/dashboard/Dashboard'
import { LiveLogs } from './components/logs/LiveLogs'
import { OpenPositions } from './components/positions/OpenPositions'
import { Chat } from './components/chat/Chat'
import { Settings } from './components/settings/Settings'
import { Agents } from './components/agents/Agents'
import { Security } from './components/security/Security'
import { Telegram } from './components/telegram/Telegram'
import { useAppStore } from './store'
import { useTheme } from './hooks/useTheme'
import type { UpdateInfo } from './types'

export default function App(): React.JSX.Element {
  const theme = useAppStore((s) => s.theme)
  const setTheme = useAppStore((s) => s.setTheme)
  const setSettings = useAppStore((s) => s.setSettings)
  const setAgentRunning = useAppStore((s) => s.setAgentRunning)
  const prependLog = useAppStore((s) => s.prependLog)
  const setActiveProvider = useAppStore((s) => s.setActiveProvider)
  const setActiveModel = useAppStore((s) => s.setActiveModel)
  const setAgents = useAppStore((s) => s.setAgents)
  const setUpdateInfo = useAppStore((s) => s.setUpdateInfo)

  useTheme(theme)

  // Load settings on startup — applies persisted theme and populates store
  useEffect(() => {
    if (!window.api) return
    window.api.getSettings().then((s) => {
      setTheme(s.theme)
      setSettings(s)
      setActiveProvider(s.activeProvider)
      setActiveModel(s.activeModel)
    }).catch(console.error)
  }, [setTheme, setSettings, setActiveProvider, setActiveModel])

  // Load agents on startup so Dashboard checklist works immediately
  useEffect(() => {
    if (!window.api) return
    window.api.listAgents().then(setAgents).catch(console.error)
  }, [setAgents])

  // Subscribe to update notifications
  useEffect(() => {
    if (!window.api) return
    return window.api.onUpdateAvailable((info) => setUpdateInfo(info as UpdateInfo))
  }, [setUpdateInfo])

  // Subscribe to real-time main-process events
  useEffect(() => {
    if (!window.api) return
    const unsubLog = window.api.onNewLog((log) =>
      prependLog(log as Parameters<typeof prependLog>[0])
    )
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
        <UpdateBanner />
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
              <Route path="/agents" element={<Agents />} />
              <Route path="/security" element={<Security />} />
              <Route path="/telegram" element={<Telegram />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>
      </div>
    </MemoryRouter>
  )
}
