import { ipcMain } from 'electron'
import { getDb } from '../db'

export function registerChatHandlers(): void {
  ipcMain.handle('chat:history', () => {
    return getDb()
      .prepare('SELECT * FROM chat_messages ORDER BY timestamp ASC LIMIT 200')
      .all()
  })

  ipcMain.handle('chat:send', async (_event, message: string) => {
    const db = getDb()
    const insert = db.prepare('INSERT INTO chat_messages (role, content) VALUES (?, ?)')

    insert.run('user', message)

    // TODO: Route to active AI provider
    const response = 'Agent response — configure an AI provider in Settings to enable chat.'

    insert.run('assistant', response)

    return {
      role: 'assistant' as const,
      content: response,
      timestamp: new Date().toISOString()
    }
  })

  ipcMain.handle('chat:clear', () => {
    getDb().prepare('DELETE FROM chat_messages').run()
    return { success: true }
  })
}
