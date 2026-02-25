import { ipcMain } from 'electron'
import { OandaClient } from '../agent/broker/oanda'
import { getOandaApiKey } from '../store/settings'
import { getDb } from '../db'

function getSQLiteVal(key: string): string | null {
  const row = getDb()
    .prepare('SELECT value FROM settings WHERE key = ?')
    .get(key) as { value: string } | undefined
  return row !== undefined ? JSON.parse(row.value) : null
}

function getOandaClient(): OandaClient {
  const apiKey = getOandaApiKey()
  const accountId = getSQLiteVal('oanda.accountId')
  const environment = (getSQLiteVal('oanda.environment') ?? 'practice') as 'practice' | 'live'

  if (!apiKey || !accountId) {
    throw new Error('OANDA is not configured. Set credentials in Settings.')
  }

  return new OandaClient({ accountId, apiKey, environment })
}

export function registerBrokerHandlers(): void {
  ipcMain.handle('broker:account', async () => {
    return getOandaClient().getAccount()
  })

  ipcMain.handle('broker:positions', async () => {
    return getOandaClient().getOpenPositions()
  })

  ipcMain.handle('broker:trades', async () => {
    return getOandaClient().getOpenTrades()
  })
}
