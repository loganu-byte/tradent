import { getDb } from './db'
import { sendTelegramNotification } from './ipc/telegram'

export function checkDailyLossLimit(): {
  exceeded: boolean
  dailyLoss: number
  limit: number | null
} {
  const db = getDb()
  const limitRow = db
    .prepare("SELECT value FROM settings WHERE key = 'dailyLossLimit'")
    .get() as { value: string } | undefined
  const limit = limitRow ? (JSON.parse(limitRow.value) as number | null) : null
  if (!limit) return { exceeded: false, dailyLoss: 0, limit: null }

  const today = new Date().toISOString().slice(0, 10) + 'T00:00:00.000Z'
  const row = db
    .prepare(
      "SELECT COALESCE(SUM(realized_pl), 0) as total FROM positions WHERE status = 'closed' AND close_time >= ?"
    )
    .get(today) as { total: number }

  const dailyLoss = row.total < 0 ? Math.abs(row.total) : 0
  const exceeded = dailyLoss >= limit

  if (exceeded) {
    sendTelegramNotification(
      `⚠️ Daily loss limit reached: $${dailyLoss.toFixed(2)} of $${limit.toFixed(2)} limit`
    )
  }

  return { exceeded, dailyLoss, limit }
}
