import { ipcMain } from 'electron'
import { getDb } from '../db'
import { setApiKeyWithTimestamp, hasApiKey } from '../store/settings'

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

export { getVal, setVal }

export function registerSettingsHandlers(): void {
  ipcMain.handle('settings:get', () => {
    return {
      theme: getVal('theme', 'dark'),
      providers: {
        gemini: hasApiKey('gemini'),
        openai: hasApiKey('openai'),
        anthropic: hasApiKey('anthropic'),
        openrouter: hasApiKey('openrouter')
      },
      dailyLossLimit: getVal('dailyLossLimit', null) as number | null,
      activeProvider: getVal('activeProvider', null) as string | null,
      activeModel: getVal('activeModel', null) as string | null
    }
  })

  ipcMain.handle(
    'settings:update',
    (
      _event,
      payload: {
        theme?: string
        apiKeys?: Record<string, string>
        dailyLossLimit?: number | null
        activeProvider?: string | null
        activeModel?: string | null
      }
    ) => {
      if (payload.theme != null) setVal('theme', payload.theme)
      if (payload.dailyLossLimit !== undefined) setVal('dailyLossLimit', payload.dailyLossLimit)
      if (payload.activeProvider !== undefined) setVal('activeProvider', payload.activeProvider)
      if (payload.activeModel !== undefined) setVal('activeModel', payload.activeModel)

      if (payload.apiKeys) {
        for (const [provider, key] of Object.entries(payload.apiKeys)) {
          if (key) setApiKeyWithTimestamp(provider, key)
        }
      }

      return { success: true }
    }
  )
}
