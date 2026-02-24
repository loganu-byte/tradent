import { ipcMain } from 'electron'
import { getDb } from '../db'
import { secureStore } from '../store/settings'

export function registerSettingsHandlers(): void {
  ipcMain.handle('settings:get', () => {
    // Non-sensitive settings from SQLite
    const rows = getDb()
      .prepare('SELECT key, value FROM settings')
      .all() as { key: string; value: string }[]
    const sqliteSettings = Object.fromEntries(rows.map((r) => [r.key, JSON.parse(r.value)]))

    // Merge with secure store (return masked API keys — never raw values to renderer)
    const apiKeys = secureStore.get('apiKeys')
    const masked = Object.fromEntries(
      Object.entries(apiKeys).map(([provider, key]) => [
        provider,
        key ? `${key.slice(0, 4)}${'•'.repeat(12)}` : null
      ])
    )

    return { ...sqliteSettings, apiKeysMasked: masked }
  })

  ipcMain.handle('settings:update', (_event, updates: Record<string, unknown>) => {
    const db = getDb()
    const upsert = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
    const upsertMany = db.transaction((entries: [string, unknown][]) => {
      for (const [key, value] of entries) {
        upsert.run(key, JSON.stringify(value))
      }
    })

    // Separate API keys (go to secure store) from other settings (go to SQLite)
    const { apiKeys, ...rest } = updates
    if (apiKeys && typeof apiKeys === 'object') {
      const current = secureStore.get('apiKeys')
      secureStore.set('apiKeys', { ...current, ...(apiKeys as Record<string, string>) })
    }
    if (Object.keys(rest).length > 0) {
      upsertMany(Object.entries(rest))
    }

    return { success: true }
  })
}
