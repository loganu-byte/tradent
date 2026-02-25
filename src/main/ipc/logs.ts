import { ipcMain } from 'electron'
import { getDb } from '../db'

export function registerLogsHandlers(): void {
  ipcMain.handle('logs:get', (_event, limit: number = 500) => {
    return getDb()
      .prepare('SELECT * FROM logs ORDER BY timestamp DESC LIMIT ?')
      .all(limit)
  })

  ipcMain.handle('logs:clear', () => {
    getDb().prepare('DELETE FROM logs').run()
    return { success: true }
  })
}
