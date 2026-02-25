import { ipcMain } from 'electron'
import {
  saveTailscaleConfig,
  getTailscalePublicConfig,
  clearTailscaleConfig
} from '../store/settings'

export function registerTailscaleHandlers(): void {
  ipcMain.handle('tailscale:get-config', () => {
    return getTailscalePublicConfig()
  })

  ipcMain.handle('tailscale:save-config', (_event, payload: {
    mode?: 'authkey' | 'oauth'
    authKey?: string
    oauthClientId?: string
    oauthClientSecret?: string
    enabled?: boolean
  }) => {
    saveTailscaleConfig(payload)
    return { success: true }
  })

  ipcMain.handle('tailscale:disconnect', () => {
    clearTailscaleConfig()
    return { success: true }
  })
}
