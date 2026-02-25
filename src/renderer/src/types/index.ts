export type Theme = 'dark' | 'light' | 'system'

export type LogLevel = 'info' | 'warn' | 'error' | 'debug' | 'trade' | 'agent'

export interface LogEntry {
  id: number
  timestamp: string
  level: LogLevel
  source: string
  message: string
  metadata?: Record<string, unknown>
}

export type PositionSide = 'long' | 'short'

export interface Position {
  id: string
  instrument: string
  side: PositionSide
  units: number
  open_price: number
  open_time: string
  stop_loss?: number
  take_profit?: number
  agent_id: string
  reasoning?: string
  status: 'open' | 'closed'
}

export type ChatRole = 'user' | 'assistant'

export interface ChatMessage {
  id?: number
  role: ChatRole
  content: string
  timestamp: string
}

export type AIProvider = 'gemini' | 'openai' | 'anthropic' | 'openrouter'

export interface AgentStatus {
  isRunning: boolean
}

export interface SettingsResponse {
  theme: Theme
  oanda: {
    accountId: string
    environment: 'practice' | 'live'
    hasApiKey: boolean
  }
  providers: {
    gemini: boolean
    openai: boolean
    anthropic: boolean
    openrouter: boolean
  }
  dailyLossLimit: number | null
}

export interface SettingsUpdatePayload {
  theme?: Theme
  oanda?: {
    accountId?: string
    environment?: 'practice' | 'live'
    apiKey?: string
  }
  apiKeys?: Partial<Record<AIProvider, string>>
  dailyLossLimit?: number | null
}

export interface IElectronAPI {
  getLogs: (limit?: number) => Promise<LogEntry[]>
  clearLogs: () => Promise<{ success: boolean }>
  onNewLog: (cb: (log: LogEntry) => void) => () => void
  getPositions: () => Promise<unknown>
  getTrades: () => Promise<unknown>
  onPositionsUpdate: (cb: (positions: unknown) => void) => () => void
  getAccount: () => Promise<unknown>
  sendMessage: (message: string) => Promise<ChatMessage>
  getChatHistory: () => Promise<ChatMessage[]>
  clearChat: () => Promise<{ success: boolean }>
  getSettings: () => Promise<SettingsResponse>
  updateSettings: (payload: SettingsUpdatePayload) => Promise<{ success: boolean }>
  startAgent: () => Promise<{ success: boolean; reason?: string }>
  stopAgent: () => Promise<{ success: boolean }>
  getAgentStatus: () => Promise<AgentStatus>
  onAgentStatus: (cb: (status: AgentStatus) => void) => () => void
}
