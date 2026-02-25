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
  oanda: { apiKey?: string }
  activeProvider?: string
  activeModel?: string
}

const store = new Store<StoredKeys>({
  name: 'secure-settings',
  defaults: { apiKeys: {}, oanda: {} }
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

export function getApiKey(provider: string): string | undefined {
  const blob = store.get('apiKeys')[provider]
  return blob ? decrypt(blob) : undefined
}

export function hasApiKey(provider: string): boolean {
  return Boolean(store.get('apiKeys')[provider])
}

// --- OANDA API key ---

export function setOandaApiKey(key: string): void {
  store.set('oanda', { ...store.get('oanda'), apiKey: encrypt(key) })
}

export function getOandaApiKey(): string | undefined {
  const blob = store.get('oanda').apiKey
  return blob ? decrypt(blob) : undefined
}

export function hasOandaApiKey(): boolean {
  return Boolean(store.get('oanda').apiKey)
}
