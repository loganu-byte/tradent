import { contextBridge, ipcRenderer } from 'electron'

const api = {
  // Logs
  getLogs: (limit?: number) => ipcRenderer.invoke('logs:get', limit),
  clearLogs: () => ipcRenderer.invoke('logs:clear'),
  onNewLog: (callback: (log: unknown) => void) => {
    const handler = (_: Electron.IpcRendererEvent, log: unknown): void => callback(log)
    ipcRenderer.on('logs:new', handler)
    return () => ipcRenderer.removeListener('logs:new', handler)
  },

  // Positions
  getPositions: () => ipcRenderer.invoke('broker:positions'),
  getTrades: () => ipcRenderer.invoke('broker:trades'),
  onPositionsUpdate: (callback: (positions: unknown) => void) => {
    const handler = (_: Electron.IpcRendererEvent, positions: unknown): void =>
      callback(positions)
    ipcRenderer.on('positions:update', handler)
    return () => ipcRenderer.removeListener('positions:update', handler)
  },

  // Broker account
  getAccount: () => ipcRenderer.invoke('broker:account'),

  // Chat
  sendMessage: (message: string) => ipcRenderer.invoke('chat:send', message),
  getChatHistory: () => ipcRenderer.invoke('chat:history'),
  clearChat: () => ipcRenderer.invoke('chat:clear'),

  // Settings
  getSettings: () => ipcRenderer.invoke('settings:get'),
  updateSettings: (payload: unknown) => ipcRenderer.invoke('settings:update', payload),

  // Running agent lifecycle
  startAgent: () => ipcRenderer.invoke('agent:start'),
  stopAgent: () => ipcRenderer.invoke('agent:stop'),
  getAgentStatus: () => ipcRenderer.invoke('agent:status'),
  onAgentStatus: (callback: (status: unknown) => void) => {
    const handler = (_: Electron.IpcRendererEvent, status: unknown): void => callback(status)
    ipcRenderer.on('agent:status', handler)
    return () => ipcRenderer.removeListener('agent:status', handler)
  },

  // Agent config CRUD
  listAgents: () => ipcRenderer.invoke('agents:list'),
  getAgent: (id: string) => ipcRenderer.invoke('agents:get', id),
  createAgent: (payload: unknown) => ipcRenderer.invoke('agents:create', payload),
  updateAgent: (payload: unknown) => ipcRenderer.invoke('agents:update', payload),
  deleteAgent: (id: string) => ipcRenderer.invoke('agents:delete', id),
  toggleAgent: (id: string, enabled: boolean) =>
    ipcRenderer.invoke('agents:toggle', { id, enabled }),

  // Telegram
  getTelegram: () => ipcRenderer.invoke('telegram:get'),
  updateTelegram: (payload: unknown) => ipcRenderer.invoke('telegram:update', payload),
  disconnectTelegram: () => ipcRenderer.invoke('telegram:disconnect'),
  testTelegram: () => ipcRenderer.invoke('telegram:test'),

  // Security
  getSecurityStatus: () => ipcRenderer.invoke('security:status'),
  disconnectIntegration: (integration: string) =>
    ipcRenderer.invoke('security:disconnect', { integration }),

  // Tailscale
  getTailscaleConfig: () => ipcRenderer.invoke('tailscale:get-config'),
  saveTailscaleConfig: (payload: unknown) => ipcRenderer.invoke('tailscale:save-config', payload),
  disconnectTailscale: () => ipcRenderer.invoke('tailscale:disconnect'),

  // Models
  listModels: (provider?: string) => ipcRenderer.invoke('models:list', provider),
  setActiveModel: (provider: string, model: string) =>
    ipcRenderer.invoke('models:set-active', { provider, model }),
  getActiveModel: () => ipcRenderer.invoke('models:get-active'),

  // Memory
  readPermanentMemory: () => ipcRenderer.invoke('memory:read-permanent'),
  writePermanentMemory: (content: string) =>
    ipcRenderer.invoke('memory:write-permanent', content),
  listThreads: () => ipcRenderer.invoke('memory:list-threads'),
  clearThreads: () => ipcRenderer.invoke('memory:clear-threads'),

  // Schedule
  addSchedule: (payload: unknown) => ipcRenderer.invoke('schedule:add', payload),
  onScheduleFired: (callback: (payload: unknown) => void) => {
    const handler = (_: Electron.IpcRendererEvent, payload: unknown): void => callback(payload)
    ipcRenderer.on('schedule:fired', handler)
    return () => ipcRenderer.removeListener('schedule:fired', handler)
  }
}

contextBridge.exposeInMainWorld('api', api)

export type ElectronAPI = typeof api
