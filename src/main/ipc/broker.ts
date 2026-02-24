import { ipcMain } from 'electron'
import { OandaClient } from '../agent/broker/oanda'
import { secureStore } from '../store/settings'

function getOandaClient(): OandaClient {
  const { accountId, apiKey, environment } = secureStore.get('oanda')
  if (!accountId || !apiKey || !environment) {
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
