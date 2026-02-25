import { create } from 'zustand'
import type { Theme, LogEntry, Position, ChatMessage, SettingsResponse } from '../types'

interface AppState {
  theme: Theme
  setTheme: (theme: Theme) => void

  logs: LogEntry[]
  setLogs: (logs: LogEntry[]) => void
  prependLog: (log: LogEntry) => void

  positions: Position[]
  setPositions: (positions: Position[]) => void

  chatMessages: ChatMessage[]
  setChatMessages: (messages: ChatMessage[]) => void
  addChatMessage: (message: ChatMessage) => void

  agentRunning: boolean
  setAgentRunning: (running: boolean) => void

  settings: SettingsResponse | null
  setSettings: (settings: SettingsResponse) => void
}

export const useAppStore = create<AppState>((set) => ({
  theme: 'dark',
  setTheme: (theme) => set({ theme }),

  logs: [],
  setLogs: (logs) => set({ logs }),
  prependLog: (log) => set((state) => ({ logs: [log, ...state.logs].slice(0, 2000) })),

  positions: [],
  setPositions: (positions) => set({ positions }),

  chatMessages: [],
  setChatMessages: (chatMessages) => set({ chatMessages }),
  addChatMessage: (message) =>
    set((state) => ({ chatMessages: [...state.chatMessages, message] })),

  agentRunning: false,
  setAgentRunning: (agentRunning) => set({ agentRunning }),

  settings: null,
  setSettings: (settings) => set({ settings })
}))
