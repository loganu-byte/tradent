import { ipcMain } from 'electron'
import { safeStorage } from 'electron'
import { getDb } from '../db'
import {
  hasApiKey,
  hasOandaApiKey,
  hasTelegramBotToken,
  getOandaLastConnected,
  getProviderLastConnected,
  getTelegramLastConnected,
  clearApiKey,
  clearOandaApiKey,
  clearTelegramBotToken
} from '../store/settings'

function getSQLiteVal(key: string): string | null {
  const row = getDb()
    .prepare('SELECT value FROM settings WHERE key = ?')
    .get(key) as { value: string } | undefined
  return row !== undefined ? JSON.parse(row.value) : null
}

function maskAccountId(id: string | null): string {
  if (!id || id.length < 4) return '••••••••'
  // Show last 7 characters: "•••-•••-XXXXXXX"
  const visible = id.slice(-7)
  return `•••-•••-${visible}`
}

export function registerSecurityHandlers(): void {
  ipcMain.handle('security:status', () => {
    const accountId = getSQLiteVal('oanda.accountId')
    const environment = getSQLiteVal('oanda.environment') ?? 'practice'

    return {
      oanda: {
        connected: hasOandaApiKey(),
        lastConnected: getOandaLastConnected() ?? null,
        environment,
        maskedAccountId: maskAccountId(accountId)
      },
      providers: {
        gemini: {
          connected: hasApiKey('gemini'),
          lastConnected: getProviderLastConnected('gemini') ?? null
        },
        openai: {
          connected: hasApiKey('openai'),
          lastConnected: getProviderLastConnected('openai') ?? null
        },
        anthropic: {
          connected: hasApiKey('anthropic'),
          lastConnected: getProviderLastConnected('anthropic') ?? null
        },
        openrouter: {
          connected: hasApiKey('openrouter'),
          lastConnected: getProviderLastConnected('openrouter') ?? null
        }
      },
      telegram: {
        connected: hasTelegramBotToken(),
        lastConnected: getTelegramLastConnected() ?? null
      },
      keyStorageVerified: safeStorage.isEncryptionAvailable(),
      rendererIsolated: true
    }
  })

  ipcMain.handle(
    'security:disconnect',
    (_event, { integration }: { integration: string }) => {
      switch (integration) {
        case 'oanda':
          clearOandaApiKey()
          break
        case 'gemini':
        case 'openai':
        case 'anthropic':
        case 'openrouter':
          clearApiKey(integration)
          break
        case 'telegram':
          clearTelegramBotToken()
          getDb().prepare('UPDATE telegram_config SET enabled = 0 WHERE id = 1').run()
          break
        default:
          return { success: false }
      }
      return { success: true }
    }
  )
}
