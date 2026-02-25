import { ipcMain } from 'electron'
import { getDb } from '../db'
import {
  setTelegramBotToken,
  hasTelegramBotToken,
  getTelegramLastConnected,
  clearTelegramBotToken
} from '../store/settings'

const toBool = (v: number | null | undefined): boolean => v === 1

interface TelegramRow {
  id: number
  chat_id: string
  enabled: number
  notify_trade_opened: number
  notify_trade_closed: number
  notify_daily_summary: number
  notify_agent_stopped: number
  notify_loss_limit: number
  notify_custom: number
  custom_notification_text: string
}

interface TelegramUpdatePayload {
  botToken?: string
  chat_id?: string
  enabled?: boolean
  notify_trade_opened?: boolean
  notify_trade_closed?: boolean
  notify_daily_summary?: boolean
  notify_agent_stopped?: boolean
  notify_loss_limit?: boolean
  notify_custom?: boolean
  custom_notification_text?: string
}

function getRow(): TelegramRow | undefined {
  return getDb()
    .prepare('SELECT * FROM telegram_config WHERE id = 1')
    .get() as TelegramRow | undefined
}

export function sendTelegramNotification(message: string): void {
  const row = getRow()
  if (!row?.enabled || !hasTelegramBotToken()) return
  // Phase 1 stub — actual HTTP send via Telegram Bot API in Phase 2
  console.log('[Telegram] Notification (stub):', message)
}

export function registerTelegramHandlers(): void {
  ipcMain.handle('telegram:get', () => {
    const row = getRow()
    return {
      hasBotToken: hasTelegramBotToken(),
      lastConnected: getTelegramLastConnected() ?? null,
      chat_id: row?.chat_id ?? '',
      enabled: toBool(row?.enabled),
      notify_trade_opened: row ? toBool(row.notify_trade_opened) : true,
      notify_trade_closed: row ? toBool(row.notify_trade_closed) : true,
      notify_daily_summary: row ? toBool(row.notify_daily_summary) : true,
      notify_agent_stopped: row ? toBool(row.notify_agent_stopped) : true,
      notify_loss_limit: row ? toBool(row.notify_loss_limit) : true,
      notify_custom: row ? toBool(row.notify_custom) : false,
      custom_notification_text: row?.custom_notification_text ?? ''
    }
  })

  ipcMain.handle('telegram:update', (_event, payload: TelegramUpdatePayload) => {
    if (payload.botToken) {
      setTelegramBotToken(payload.botToken)
    }

    const current = getRow()
    getDb()
      .prepare(
        `INSERT OR REPLACE INTO telegram_config
          (id, chat_id, enabled, notify_trade_opened, notify_trade_closed,
           notify_daily_summary, notify_agent_stopped, notify_loss_limit,
           notify_custom, custom_notification_text)
         VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        payload.chat_id ?? current?.chat_id ?? '',
        payload.enabled !== undefined ? (payload.enabled ? 1 : 0) : (current?.enabled ?? 0),
        payload.notify_trade_opened !== undefined
          ? (payload.notify_trade_opened ? 1 : 0)
          : (current?.notify_trade_opened ?? 1),
        payload.notify_trade_closed !== undefined
          ? (payload.notify_trade_closed ? 1 : 0)
          : (current?.notify_trade_closed ?? 1),
        payload.notify_daily_summary !== undefined
          ? (payload.notify_daily_summary ? 1 : 0)
          : (current?.notify_daily_summary ?? 1),
        payload.notify_agent_stopped !== undefined
          ? (payload.notify_agent_stopped ? 1 : 0)
          : (current?.notify_agent_stopped ?? 1),
        payload.notify_loss_limit !== undefined
          ? (payload.notify_loss_limit ? 1 : 0)
          : (current?.notify_loss_limit ?? 1),
        payload.notify_custom !== undefined
          ? (payload.notify_custom ? 1 : 0)
          : (current?.notify_custom ?? 0),
        payload.custom_notification_text !== undefined
          ? payload.custom_notification_text
          : (current?.custom_notification_text ?? '')
      )

    return { success: true }
  })

  ipcMain.handle('telegram:disconnect', () => {
    clearTelegramBotToken()
    getDb()
      .prepare('UPDATE telegram_config SET enabled = 0 WHERE id = 1')
      .run()
    return { success: true }
  })

  ipcMain.handle('telegram:test', () => {
    if (!hasTelegramBotToken()) {
      return { success: false, message: 'No bot token configured.' }
    }
    const row = getRow()
    if (!row?.chat_id) {
      return { success: false, message: 'No chat ID configured.' }
    }
    // Phase 1 stub — Telegram HTTP API integration coming in Phase 2
    return { success: false, message: 'Telegram test connection not yet implemented.' }
  })
}
