import { ipcMain, BrowserWindow } from 'electron'
import { getDb } from '../db'
import { processUserMessage } from './chat'

export function registerScheduleHandlers(): void {
  ipcMain.handle(
    'schedule:add',
    (
      _event,
      payload: { thread_id?: string; scheduled_at: string; message: string }
    ) => {
      const result = getDb()
        .prepare(
          'INSERT INTO scheduled_messages (thread_id, scheduled_at, message) VALUES (?, ?, ?)'
        )
        .run(payload.thread_id ?? 'default', payload.scheduled_at, payload.message)
      return { id: result.lastInsertRowid as number, success: true }
    }
  )
}

export function startSchedulePoller(): void {
  setInterval(() => {
    const db = getDb()
    const now = new Date().toISOString()
    const pending = db
      .prepare(
        "SELECT * FROM scheduled_messages WHERE status = 'pending' AND scheduled_at <= ?"
      )
      .all(now) as { id: number; message: string }[]

    for (const row of pending) {
      try {
        const response = processUserMessage(row.message)
        db.prepare("UPDATE scheduled_messages SET status = 'sent' WHERE id = ?").run(row.id)
        for (const win of BrowserWindow.getAllWindows()) {
          win.webContents.send('schedule:fired', {
            id: row.id,
            message: row.message,
            response
          })
        }
      } catch {
        // leave as pending if something fails
      }
    }
  }, 60_000)
}
