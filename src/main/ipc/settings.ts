import { ipcMain } from 'electron'
import { getDb } from '../db'
import {
  setApiKey,
  hasApiKey,
  setOandaApiKey,
  hasOandaApiKey
} from '../store/settings'

function getVal(key: string, fallback: unknown = null): unknown {
  const row = getDb()
    .prepare('SELECT value FROM settings WHERE key = ?')
    .get(key) as { value: string } | undefined
  return row !== undefined ? JSON.parse(row.value) : fallback
}

function setVal(key: string, value: unknown): void {
  getDb()
    .prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
    .run(key, JSON.stringify(value))
}

export function registerSettingsHandlers(): void {
  ipcMain.handle('settings:get', () => {
    return {
      theme: getVal('theme', 'dark'),
      oanda: {
        accountId: getVal('oanda.accountId', '') as string,
        environment: getVal('oanda.environment', 'practice') as string,
        hasApiKey: hasOandaApiKey()
      },
      providers: {
        gemini: hasApiKey('gemini'),
        openai: hasApiKey('openai'),
        anthropic: hasApiKey('anthropic'),
        openrouter: hasApiKey('openrouter')
      },
      dailyLossLimit: getVal('dailyLossLimit', null) as number | null
    }
  })

  ipcMain.handle(
    'settings:update',
    (
      _event,
      payload: {
        theme?: string
        oanda?: { accountId?: string; environment?: string; apiKey?: string }
        apiKeys?: Record<string, string>
        dailyLossLimit?: number | null
      }
    ) => {
      if (payload.theme != null) setVal('theme', payload.theme)
      if (payload.dailyLossLimit !== undefined) setVal('dailyLossLimit', payload.dailyLossLimit)

      if (payload.oanda) {
        const { accountId, environment, apiKey } = payload.oanda
        if (accountId != null) setVal('oanda.accountId', accountId)
        if (environment != null) setVal('oanda.environment', environment)
        if (apiKey) setOandaApiKey(apiKey)
      }

      if (payload.apiKeys) {
        for (const [provider, key] of Object.entries(payload.apiKeys)) {
          if (key) setApiKey(provider, key)
        }
      }

      return { success: true }
    }
  )
}
