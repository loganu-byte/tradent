import Store from 'electron-store'

interface SecureSettings {
  apiKeys: {
    gemini?: string
    openai?: string
    anthropic?: string
    openrouter?: string
  }
  oanda: {
    accountId?: string
    apiKey?: string
    environment?: 'practice' | 'live'
  }
  activeProvider?: 'gemini' | 'openai' | 'anthropic' | 'openrouter'
  activeModel?: string
}

// TODO: Replace hardcoded key with a machine-derived key before Phase 3 open source release
export const secureStore = new Store<SecureSettings>({
  name: 'secure-settings',
  encryptionKey: 'tradent-local-v1',
  defaults: {
    apiKeys: {},
    oanda: {}
  }
})
