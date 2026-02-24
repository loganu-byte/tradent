import { contextBridge, ipcRenderer } from 'electron'

const api = {
  // Logs
  getLogs: (limit?: number) => ipcRenderer.invoke('logs:get', limit),
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
  updateSettings: (settings: Record<string, unknown>) =>
    ipcRenderer.invoke('settings:update', settings),

  // Agent
  startAgent: () => ipcRenderer.invoke('agent:start'),
  stopAgent: () => ipcRenderer.invoke('agent:stop'),
  getAgentStatus: () => ipcRenderer.invoke('agent:status'),
  onAgentStatus: (callback: (status: unknown) => void) => {
    const handler = (_: Electron.IpcRendererEvent, status: unknown): void => callback(status)
    ipcRenderer.on('agent:status', handler)
    return () => ipcRenderer.removeListener('agent:status', handler)
  }
}

contextBridge.exposeInMainWorld('api', api)

export type ElectronAPI = typeof api
