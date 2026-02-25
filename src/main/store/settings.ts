import { safeStorage } from 'electron'
import Store from 'electron-store'

// Stores base64-encoded safeStorage-encrypted blobs.
// safeStorage delegates to the OS credential store:
//   macOS  → Keychain Services
//   Windows → DPAPI
//   Linux  → libsecret / kwallet
// The file on disk is plain JSON; the values are opaque encrypted blobs
// tied to the OS user account — unreadable without this machine's credentials.
interface StoredKeys {
  apiKeys: Partial<Record<string, string>>
  oanda: { apiKey?: string; lastConnected?: string }
  telegram: { botToken?: string; lastConnected?: string }
  tailscale: {
    mode?: 'authkey' | 'oauth'
    authKey?: string
    oauthClientId?: string
    oauthClientSecret?: string
    enabled?: boolean
  }
  providers: Partial<Record<string, { lastConnected?: string }>>
  activeProvider?: string
  activeModel?: string
}

const store = new Store<StoredKeys>({
  name: 'secure-settings',
  defaults: { apiKeys: {}, oanda: {}, telegram: {}, tailscale: {}, providers: {} }
})

function encrypt(value: string): string {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('OS-level encryption is unavailable on this system.')
  }
  return safeStorage.encryptString(value).toString('base64')
}

function decrypt(blob: string): string {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('OS-level encryption is unavailable on this system.')
  }
  return safeStorage.decryptString(Buffer.from(blob, 'base64'))
}

// --- AI provider keys ---

export function setApiKey(provider: string, key: string): void {
  store.set('apiKeys', { ...store.get('apiKeys'), [provider]: encrypt(key) })
}

export function setApiKeyWithTimestamp(provider: string, key: string): void {
  store.set('apiKeys', { ...store.get('apiKeys'), [provider]: encrypt(key) })
  const providers = store.get('providers') ?? {}
  store.set('providers', { ...providers, [provider]: { lastConnected: new Date().toISOString() } })
}

export function getApiKey(provider: string): string | undefined {
  const blob = store.get('apiKeys')[provider]
  return blob ? decrypt(blob) : undefined
}

export function hasApiKey(provider: string): boolean {
  return Boolean(store.get('apiKeys')[provider])
}

export function clearApiKey(provider: string): void {
  const keys = { ...store.get('apiKeys') }
  delete keys[provider]
  store.set('apiKeys', keys)
  const providers = { ...(store.get('providers') ?? {}) }
  delete providers[provider]
  store.set('providers', providers)
}

export function getProviderLastConnected(provider: string): string | undefined {
  return store.get('providers')?.[provider]?.lastConnected
}

// --- OANDA API key ---

export function setOandaApiKey(key: string): void {
  store.set('oanda', { ...store.get('oanda'), apiKey: encrypt(key) })
}

export function setOandaApiKeyWithTimestamp(key: string): void {
  store.set('oanda', {
    ...store.get('oanda'),
    apiKey: encrypt(key),
    lastConnected: new Date().toISOString()
  })
}

export function getOandaApiKey(): string | undefined {
  const blob = store.get('oanda').apiKey
  return blob ? decrypt(blob) : undefined
}

export function hasOandaApiKey(): boolean {
  return Boolean(store.get('oanda').apiKey)
}

export function clearOandaApiKey(): void {
  const current = { ...store.get('oanda') }
  delete current.apiKey
  delete current.lastConnected
  store.set('oanda', current)
}

export function getOandaLastConnected(): string | undefined {
  return store.get('oanda').lastConnected
}

// --- Telegram bot token ---

export function setTelegramBotToken(token: string): void {
  store.set('telegram', {
    ...store.get('telegram'),
    botToken: encrypt(token),
    lastConnected: new Date().toISOString()
  })
}

export function getTelegramBotToken(): string | undefined {
  const blob = store.get('telegram').botToken
  return blob ? decrypt(blob) : undefined
}

export function hasTelegramBotToken(): boolean {
  return Boolean(store.get('telegram').botToken)
}

export function clearTelegramBotToken(): void {
  const current = { ...store.get('telegram') }
  delete current.botToken
  delete current.lastConnected
  store.set('telegram', current)
}

export function getTelegramLastConnected(): string | undefined {
  return store.get('telegram').lastConnected
}

// --- Per-agent brokerage keys (stored in apiKeys as `oanda_agent_{agentId}`) ---

export function setAgentBrokerageKey(agentId: string, key: string): void {
  store.set('apiKeys', { ...store.get('apiKeys'), [`oanda_agent_${agentId}`]: encrypt(key) })
}

export function getAgentBrokerageKey(agentId: string): string | undefined {
  const blob = store.get('apiKeys')[`oanda_agent_${agentId}`]
  return blob ? decrypt(blob) : undefined
}

export function hasAgentBrokerageKey(agentId: string): boolean {
  return Boolean(store.get('apiKeys')[`oanda_agent_${agentId}`])
}

export function clearAgentBrokerageKey(agentId: string): void {
  const keys = { ...store.get('apiKeys') }
  delete keys[`oanda_agent_${agentId}`]
  store.set('apiKeys', keys)
}

// --- Tailscale config ---

export function saveTailscaleConfig(cfg: {
  mode?: 'authkey' | 'oauth'
  authKey?: string
  oauthClientId?: string
  oauthClientSecret?: string
  enabled?: boolean
}): void {
  const current = store.get('tailscale')
  const updated = { ...current }
  if (cfg.mode !== undefined) updated.mode = cfg.mode
  if (cfg.enabled !== undefined) updated.enabled = cfg.enabled
  if (cfg.authKey !== undefined) updated.authKey = encrypt(cfg.authKey)
  if (cfg.oauthClientId !== undefined) updated.oauthClientId = encrypt(cfg.oauthClientId)
  if (cfg.oauthClientSecret !== undefined) updated.oauthClientSecret = encrypt(cfg.oauthClientSecret)
  store.set('tailscale', updated)
}

export function getTailscalePublicConfig(): {
  mode: 'authkey' | 'oauth'
  enabled: boolean
  hasAuthKey: boolean
  hasOAuthCredentials: boolean
} {
  const t = store.get('tailscale')
  return {
    mode: t.mode ?? 'authkey',
    enabled: t.enabled ?? false,
    hasAuthKey: Boolean(t.authKey),
    hasOAuthCredentials: Boolean(t.oauthClientId) && Boolean(t.oauthClientSecret)
  }
}

export function getTailscaleSecrets(): {
  authKey?: string
  oauthClientId?: string
  oauthClientSecret?: string
} {
  const t = store.get('tailscale')
  return {
    authKey: t.authKey ? decrypt(t.authKey) : undefined,
    oauthClientId: t.oauthClientId ? decrypt(t.oauthClientId) : undefined,
    oauthClientSecret: t.oauthClientSecret ? decrypt(t.oauthClientSecret) : undefined
  }
}

export function clearTailscaleConfig(): void {
  store.set('tailscale', {})
}
