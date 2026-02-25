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

// Renamed from AgentStatus to avoid collision with the new AgentStatus union below
export interface AgentRunStatus {
  isRunning: boolean
}

export interface SettingsResponse {
  theme: Theme
  providers: {
    gemini: boolean
    openai: boolean
    anthropic: boolean
    openrouter: boolean
  }
  dailyLossLimit: number | null
  activeProvider: string | null
  activeModel: string | null
}

export interface SettingsUpdatePayload {
  theme?: Theme
  apiKeys?: Partial<Record<AIProvider, string>>
  dailyLossLimit?: number | null
  activeProvider?: string | null
  activeModel?: string | null
}

// --- Tailscale types ---

export interface TailscaleConfig {
  mode: 'authkey' | 'oauth'
  enabled: boolean
  hasAuthKey: boolean
  hasOAuthCredentials: boolean
}

export interface TailscaleSavePayload {
  mode?: 'authkey' | 'oauth'
  authKey?: string
  oauthClientId?: string
  oauthClientSecret?: string
  enabled?: boolean
}

// --- Model types ---

export interface ModelInfo {
  id: string
  name: string
  provider: AIProvider
}

export interface ModelsResponse {
  models: ModelInfo[]
  errors: Partial<Record<AIProvider, string>>
}

// --- Agent / Sub-Agent types ---

export type SubAgentType =
  | 'risk_manager'
  | 'news_scanner'
  | 'technical_analyst'
  | 'sentiment_analyzer'

export type AgentModel = string

export type AgentStatus = 'active' | 'idle' | 'stopped'

export interface SubAgent {
  id?: number
  agent_id: string
  type: SubAgentType
  enabled: boolean
  prompt: string
  name: string
  role_desc: string
  model: string
  system_prompt: string
  strategy_prompt: string
}

export interface Agent {
  id: string
  name: string
  status: AgentStatus
  model: AgentModel
  role_desc: string
  system_prompt: string
  strategy_prompt: string
  enabled: boolean
  created_at: string
  updated_at: string
  brokerage: string
  account_number: string
  brokerage_environment: 'practice' | 'live'
  hasBrokerageKey: boolean
  sub_agents?: SubAgent[]
}

export interface AgentFormDraft {
  name: string
  role_desc: string
  system_prompt: string
  strategy_prompt: string
  model: AgentModel
  brokerage: string
  account_number: string
  brokerageApiKey: string
  sub_agents: Record<SubAgentType, { enabled: boolean; prompt: string; name: string; role_desc: string; model: string; system_prompt: string; strategy_prompt: string }>
}

// --- Telegram types ---

export interface TelegramConfig {
  hasBotToken: boolean
  lastConnected: string | null
  chat_id: string
  enabled: boolean
  notify_trade_opened: boolean
  notify_trade_closed: boolean
  notify_daily_summary: boolean
  notify_agent_stopped: boolean
  notify_loss_limit: boolean
  notify_custom: boolean
  custom_notification_text: string
}

export interface TelegramUpdatePayload {
  botToken?: string
  chat_id?: string
  enabled?: boolean
  notify_trade_opened?: boolean
  notify_trade_closed?: boolean
  notify_daily_summary?: boolean
  notify_agent_stopped?: boolean
  notify_loss_limit?: boolean
  notify_custom?: boolean
  custom_notification_text?: string
}

// --- Security types ---

export interface IntegrationStatus {
  connected: boolean
  lastConnected: string | null
}

export interface SecurityStatus {
  oanda: IntegrationStatus & { environment: string; maskedAccountId: string }
  providers: Record<AIProvider, IntegrationStatus>
  telegram: IntegrationStatus
  keyStorageVerified: boolean
  rendererIsolated: boolean
}

// --- Update types ---

export interface UpdateInfo {
  currentVersion: string
  latestVersion: string
  releaseUrl: string
  releaseNotes: string
}

// --- IPC API surface ---

export interface IElectronAPI {
  // Logs
  getLogs: (limit?: number) => Promise<LogEntry[]>
  clearLogs: () => Promise<{ success: boolean }>
  onNewLog: (cb: (log: LogEntry) => void) => () => void

  // Positions
  getPositions: () => Promise<unknown>
  getTrades: () => Promise<unknown>
  onPositionsUpdate: (cb: (positions: unknown) => void) => () => void

  // Broker account
  getAccount: () => Promise<unknown>

  // Chat
  sendMessage: (message: string) => Promise<ChatMessage>
  getChatHistory: () => Promise<ChatMessage[]>
  clearChat: () => Promise<{ success: boolean }>

  // Settings
  getSettings: () => Promise<SettingsResponse>
  updateSettings: (payload: SettingsUpdatePayload) => Promise<{ success: boolean }>

  // Running agent lifecycle
  startAgent: () => Promise<{ success: boolean; reason?: string }>
  stopAgent: () => Promise<{ success: boolean }>
  getAgentStatus: () => Promise<AgentRunStatus>
  onAgentStatus: (cb: (status: AgentRunStatus) => void) => () => void

  // Agent config CRUD
  listAgents: () => Promise<Agent[]>
  getAgent: (id: string) => Promise<Agent | null>
  createAgent: (payload: unknown) => Promise<Agent>
  updateAgent: (payload: unknown) => Promise<Agent>
  deleteAgent: (id: string) => Promise<{ success: boolean }>
  toggleAgent: (id: string, enabled: boolean) => Promise<{ success: boolean }>

  // Telegram
  getTelegram: () => Promise<TelegramConfig>
  updateTelegram: (payload: TelegramUpdatePayload) => Promise<{ success: boolean }>
  disconnectTelegram: () => Promise<{ success: boolean }>
  testTelegram: () => Promise<{ success: boolean; message: string }>

  // Security
  getSecurityStatus: () => Promise<SecurityStatus>
  disconnectIntegration: (integration: string) => Promise<{ success: boolean }>

  // Tailscale
  getTailscaleConfig: () => Promise<TailscaleConfig>
  saveTailscaleConfig: (payload: TailscaleSavePayload) => Promise<{ success: boolean }>
  disconnectTailscale: () => Promise<{ success: boolean }>

  // Models
  listModels: (provider?: string) => Promise<ModelsResponse>
  setActiveModel: (provider: string, model: string) => Promise<{ success: boolean }>
  getActiveModel: () => Promise<{ provider: string | null; model: string | null }>

  // Memory
  readPermanentMemory: () => Promise<{ content: string; path: string }>
  writePermanentMemory: (content: string) => Promise<{ success: boolean }>
  listThreads: () => Promise<{ ids: string[]; count: number }>
  clearThreads: () => Promise<{ success: boolean; count: number }>

  // Schedule
  addSchedule: (payload: { thread_id?: string; scheduled_at: string; message: string }) => Promise<{ id: number; success: boolean }>
  onScheduleFired: (cb: (payload: unknown) => void) => () => void

  // Updates
  onUpdateAvailable: (cb: (info: UpdateInfo) => void) => () => void
  openReleaseUrl: (url: string) => Promise<void>
}
