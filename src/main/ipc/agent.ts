import { ipcMain, BrowserWindow } from 'electron'
import { TradingAgent } from '../agent'

let agent: TradingAgent | null = null

export function registerAgentHandlers(): void {
  ipcMain.handle('agent:start', async () => {
    if (agent?.isRunning) return { success: false, reason: 'Already running' }
    agent = new TradingAgent()
    await agent.start()
    return { success: true }
  })

  ipcMain.handle('agent:stop', async () => {
    await agent?.stop()
    agent = null
    return { success: true }
  })

  ipcMain.handle('agent:status', () => ({
    isRunning: agent?.isRunning ?? false
  }))
}

export function broadcastToRenderer(channel: string, data: unknown): void {
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send(channel, data)
  }
}
