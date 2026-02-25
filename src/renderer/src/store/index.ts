import { create } from 'zustand'
import type {
  Theme,
  LogEntry,
  Position,
  ChatMessage,
  SettingsResponse,
  Agent,
  TelegramConfig,
  SecurityStatus,
  TailscaleConfig,
  UpdateInfo
} from '../types'

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

  activeProvider: string | null
  setActiveProvider: (provider: string | null) => void

  activeModel: string | null
  setActiveModel: (model: string | null) => void

  agents: Agent[]
  setAgents: (agents: Agent[]) => void
  upsertAgent: (agent: Agent) => void
  removeAgent: (id: string) => void

  telegramConfig: TelegramConfig | null
  setTelegramConfig: (config: TelegramConfig) => void

  securityStatus: SecurityStatus | null
  setSecurityStatus: (status: SecurityStatus) => void

  tailscaleConfig: TailscaleConfig | null
  setTailscaleConfig: (config: TailscaleConfig) => void

  updateInfo: UpdateInfo | null
  setUpdateInfo: (info: UpdateInfo) => void
  dismissUpdate: () => void
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
  setSettings: (settings) => set({ settings }),

  activeProvider: null,
  setActiveProvider: (activeProvider) => set({ activeProvider }),

  activeModel: null,
  setActiveModel: (activeModel) => set({ activeModel }),

  agents: [],
  setAgents: (agents) => set({ agents }),
  upsertAgent: (agent) =>
    set((state) => ({
      agents: state.agents.some((a) => a.id === agent.id)
        ? state.agents.map((a) => (a.id === agent.id ? agent : a))
        : [...state.agents, agent]
    })),
  removeAgent: (id) => set((state) => ({ agents: state.agents.filter((a) => a.id !== id) })),

  telegramConfig: null,
  setTelegramConfig: (telegramConfig) => set({ telegramConfig }),

  securityStatus: null,
  setSecurityStatus: (securityStatus) => set({ securityStatus }),

  tailscaleConfig: null,
  setTailscaleConfig: (tailscaleConfig) => set({ tailscaleConfig }),

  updateInfo: null,
  setUpdateInfo: (updateInfo) => set({ updateInfo }),
  dismissUpdate: () => set({ updateInfo: null })
}))
