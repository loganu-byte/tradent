import axios, { type AxiosInstance } from 'axios'

export interface OandaConfig {
  accountId: string
  apiKey: string
  environment: 'practice' | 'live'
}

export class OandaClient {
  private http: AxiosInstance
  private accountId: string

  constructor(config: OandaConfig) {
    this.accountId = config.accountId
    const baseURL =
      config.environment === 'practice'
        ? 'https://api-fxpractice.oanda.com/v3'
        : 'https://api-fxtrade.oanda.com/v3'

    this.http = axios.create({
      baseURL,
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    })
  }

  async getAccount(): Promise<unknown> {
    const { data } = await this.http.get(`/accounts/${this.accountId}`)
    return data
  }

  async getOpenPositions(): Promise<unknown> {
    const { data } = await this.http.get(`/accounts/${this.accountId}/openPositions`)
    return data
  }

  async getOpenTrades(): Promise<unknown> {
    const { data } = await this.http.get(`/accounts/${this.accountId}/openTrades`)
    return data
  }

  async getPricing(instruments: string[]): Promise<unknown> {
    const { data } = await this.http.get(`/accounts/${this.accountId}/pricing`, {
      params: { instruments: instruments.join(',') }
    })
    return data
  }

  async placeTrade(instrument: string, units: number): Promise<unknown> {
    const { data } = await this.http.post(`/accounts/${this.accountId}/orders`, {
      order: {
        type: 'MARKET',
        instrument,
        units: String(units)
      }
    })
    return data
  }

  async closeTrade(tradeId: string): Promise<unknown> {
    const { data } = await this.http.put(
      `/accounts/${this.accountId}/trades/${tradeId}/close`,
      {}
    )
    return data
  }
}
