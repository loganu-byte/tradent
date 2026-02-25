import { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, ExternalLink } from 'lucide-react'
import { useAppStore } from '../../store'
import { Toggle } from '../ui/Toggle'
import type { Theme, AIProvider, SettingsUpdatePayload, TailscaleSavePayload } from '../../types'

const PROVIDERS: { id: AIProvider; label: string; placeholder: string }[] = [
  { id: 'gemini', label: 'Google Gemini', placeholder: 'AIza...' },
  { id: 'openai', label: 'OpenAI', placeholder: 'sk-...' },
  { id: 'anthropic', label: 'Anthropic', placeholder: 'sk-ant-...' },
  { id: 'openrouter', label: 'OpenRouter', placeholder: 'sk-or-...' }
]

const THEMES: { id: Theme; label: string }[] = [
  { id: 'dark', label: 'Dark' },
  { id: 'light', label: 'Light' },
  { id: 'system', label: 'System' }
]

export function Settings(): React.JSX.Element {
  const theme = useAppStore((s) => s.theme)
  const setTheme = useAppStore((s) => s.setTheme)
  const settings = useAppStore((s) => s.settings)
  const setSettings = useAppStore((s) => s.setSettings)
  const activeProvider = useAppStore((s) => s.activeProvider)
  const activeModel = useAppStore((s) => s.activeModel)
  const setActiveProvider = useAppStore((s) => s.setActiveProvider)
  const setActiveModel = useAppStore((s) => s.setActiveModel)
  const tailscaleConfig = useAppStore((s) => s.tailscaleConfig)
  const setTailscaleConfig = useAppStore((s) => s.setTailscaleConfig)

  // Main settings state
  const [apiKeys, setApiKeys] = useState<Partial<Record<AIProvider, string>>>({})
  const [dailyLossLimit, setDailyLossLimit] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Chat / model state
  const [selectedProvider, setSelectedProvider] = useState('')
  const [selectedModel, setSelectedModel] = useState('')

  // Memory state
  const [memoryContent, setMemoryContent] = useState('')
  const [memoryPath, setMemoryPath] = useState('')
  const [threadCount, setThreadCount] = useState(0)
  const [clearingThreads, setClearingThreads] = useState(false)
  const [savingMemory, setSavingMemory] = useState(false)

  // Tailscale state
  const [tsMode, setTsMode] = useState<'authkey' | 'oauth'>('authkey')
  const [tsAuthKey, setTsAuthKey] = useState('')
  const [tsClientId, setTsClientId] = useState('')
  const [tsClientSecret, setTsClientSecret] = useState('')
  const [tsEnabled, setTsEnabled] = useState(false)
  const [savingTs, setSavingTs] = useState(false)
  const [savedTs, setSavedTs] = useState(false)
  const [disconnectingTs, setDisconnectingTs] = useState(false)

  // Populate form from persisted settings
  useEffect(() => {
    if (!settings) return
    setDailyLossLimit(settings.dailyLossLimit !== null ? String(settings.dailyLossLimit) : '')
  }, [settings])

  // Sync active provider/model into local state
  useEffect(() => {
    setSelectedProvider(activeProvider ?? '')
    setSelectedModel(activeModel ?? '')
  }, [activeProvider, activeModel])

  // Load tailscale config on mount
  useEffect(() => {
    if (!window.api) return
    window.api.getTailscaleConfig().then((cfg) => {
      setTailscaleConfig(cfg)
      setTsMode(cfg.mode)
      setTsEnabled(cfg.enabled)
    }).catch(console.error)
  }, [setTailscaleConfig])

  // Load thread count on mount
  useEffect(() => {
    if (!window.api) return
    window.api.listThreads().then((r) => setThreadCount(r.count)).catch(console.error)
  }, [])

  // Auto-load permanent memory on mount
  useEffect(() => {
    if (!window.api) return
    window.api.readPermanentMemory().then((mem) => {
      setMemoryContent(mem.content)
      setMemoryPath(mem.path)
    }).catch(console.error)
  }, [])

  const handleThemeChange = async (t: Theme): Promise<void> => {
    setTheme(t)
    if (!window.api) return
    await window.api.updateSettings({ theme: t }).catch(console.error)
    const refreshed = await window.api.getSettings().catch(() => null)
    if (refreshed) setSettings(refreshed)
  }

  const handleSave = async (): Promise<void> => {
    if (!window.api) return
    setSaving(true)

    const payload: SettingsUpdatePayload = {
      dailyLossLimit: dailyLossLimit !== '' ? parseFloat(dailyLossLimit) : null
    }

    const filteredKeys = Object.fromEntries(
      Object.entries(apiKeys).filter(([, v]) => v !== '')
    ) as Partial<Record<AIProvider, string>>
    if (Object.keys(filteredKeys).length > 0) payload.apiKeys = filteredKeys

    if (selectedProvider) {
      payload.activeProvider = selectedProvider
      payload.activeModel = selectedModel || null
    }

    await window.api.updateSettings(payload).catch(console.error)

    const refreshed = await window.api.getSettings().catch(() => null)
    if (refreshed) {
      setSettings(refreshed)
      setActiveProvider(refreshed.activeProvider)
      setActiveModel(refreshed.activeModel)
    }

    setApiKeys({})
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleSaveMemory = async (): Promise<void> => {
    if (!window.api) return
    setSavingMemory(true)
    await window.api.writePermanentMemory(memoryContent).catch(console.error)
    setSavingMemory(false)
  }

  const handleClearThreads = async (): Promise<void> => {
    if (!window.api) return
    if (!confirm('Delete all chat thread files? This cannot be undone.')) return
    setClearingThreads(true)
    const result = await window.api.clearThreads().catch(() => null)
    if (result) setThreadCount(0)
    setClearingThreads(false)
  }

  const handleSaveTailscale = async (): Promise<void> => {
    if (!window.api) return
    setSavingTs(true)
    const payload: TailscaleSavePayload = { mode: tsMode, enabled: tsEnabled }
    if (tsMode === 'authkey' && tsAuthKey) payload.authKey = tsAuthKey
    if (tsMode === 'oauth' && tsClientId) payload.oauthClientId = tsClientId
    if (tsMode === 'oauth' && tsClientSecret) payload.oauthClientSecret = tsClientSecret
    await window.api.saveTailscaleConfig(payload).catch(console.error)
    const refreshed = await window.api.getTailscaleConfig().catch(() => null)
    if (refreshed) {
      setTailscaleConfig(refreshed)
      setTsMode(refreshed.mode)
      setTsEnabled(refreshed.enabled)
    }
    setTsAuthKey('')
    setTsClientId('')
    setTsClientSecret('')
    setSavingTs(false)
    setSavedTs(true)
    setTimeout(() => setSavedTs(false), 2000)
  }

  const handleDisconnectTailscale = async (): Promise<void> => {
    if (!window.api) return
    if (!confirm('Disconnect Tailscale and clear all credentials?')) return
    setDisconnectingTs(true)
    await window.api.disconnectTailscale().catch(console.error)
    const refreshed = await window.api.getTailscaleConfig().catch(() => null)
    if (refreshed) {
      setTailscaleConfig(refreshed)
      setTsMode(refreshed.mode)
      setTsEnabled(refreshed.enabled)
    }
    setDisconnectingTs(false)
  }

  const configuredProviders = PROVIDERS.filter((p) => settings?.providers?.[p.id])
  const tsHasCredentials = tailscaleConfig
    ? (tailscaleConfig.mode === 'authkey' ? tailscaleConfig.hasAuthKey : tailscaleConfig.hasOAuthCredentials)
    : false

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-2xl">
        <h1 className="text-base font-semibold text-neutral-100 mb-6">Settings</h1>

        {/* Appearance */}
        <Section title="Appearance">
          <div className="flex gap-2">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => handleThemeChange(t.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                  theme === t.id
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                    : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:border-neutral-600'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-neutral-600">Theme saves immediately.</p>
        </Section>

        {/* AI Providers */}
        <Section title="AI Providers">
          <div className="space-y-3">
            {PROVIDERS.map((p) => {
              const isConfigured = settings?.providers?.[p.id] ?? false
              return (
                <Field key={p.id} label={p.label}>
                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      value={apiKeys[p.id] ?? ''}
                      onChange={(e) =>
                        setApiKeys((prev) => ({ ...prev, [p.id]: e.target.value }))
                      }
                      placeholder={isConfigured ? '••••••••  (key configured — enter new to replace)' : p.placeholder}
                      className="input-field flex-1"
                    />
                    <StatusDot configured={isConfigured} />
                  </div>
                </Field>
              )
            })}
          </div>
        </Section>

        {/* Risk */}
        <Section title="Risk Management">
          <Field label="Daily Loss Limit">
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-500">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={dailyLossLimit}
                onChange={(e) => setDailyLossLimit(e.target.value)}
                placeholder="e.g. 100.00 — leave blank to disable"
                className="input-field flex-1"
              />
            </div>
          </Field>
          <p className="mt-2 text-xs text-neutral-600">
            Agent will stop trading if cumulative daily loss exceeds this amount.
          </p>
        </Section>

        {/* Chat / Model */}
        <Section title="Chat">
          <div className="space-y-3 mb-4">
            <Field label="Active Provider">
              <select
                value={selectedProvider}
                onChange={(e) => {
                  setSelectedProvider(e.target.value)
                  setSelectedModel('')
                }}
                className="input-field"
              >
                <option value="">— none selected —</option>
                {configuredProviders.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Active Model">
              <input
                type="text"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                placeholder={selectedProvider ? 'e.g. gemini-2.0-flash or use /models in chat' : 'Select a provider first'}
                disabled={!selectedProvider}
                className="input-field disabled:opacity-40"
              />
            </Field>
          </div>
          <p className="text-xs text-neutral-600 mb-5">
            Use <kbd className="font-mono text-neutral-500">/models</kbd> in chat to list available models for configured providers.
          </p>

          <h3 className="text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-3">Memory</h3>
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-neutral-300">Permanent Memory</p>
                {memoryPath && (
                  <p className="text-xs text-neutral-600 mt-0.5 font-mono truncate max-w-xs">{memoryPath}</p>
                )}
              </div>
              <button onClick={handleSaveMemory} disabled={savingMemory} className="btn-ghost text-xs !py-1 !px-2">
                {savingMemory ? 'Saving…' : 'Save'}
              </button>
            </div>
            <textarea
              value={memoryContent}
              onChange={(e) => setMemoryContent(e.target.value)}
              placeholder="Permanent memory is empty. Add notes for your agent here."
              className="input-field min-h-[120px] resize-y font-mono text-xs leading-relaxed w-full"
            />
            <div className="flex items-center justify-between pt-1 border-t border-neutral-800">
              <p className="text-xs text-neutral-600">
                {threadCount} thread file{threadCount !== 1 ? 's' : ''}
              </p>
              <button
                onClick={handleClearThreads}
                disabled={clearingThreads || threadCount === 0}
                className="btn-danger !py-1 !px-2 text-xs disabled:opacity-40"
              >
                {clearingThreads ? 'Clearing…' : 'Clear threads'}
              </button>
            </div>
          </div>
        </Section>

        {/* Remote Access / Tailscale */}
        <Section title="Remote Access">
          <p className="text-xs text-neutral-500 mb-3">
            Tradent is local-only. Use Tailscale to securely access your trading agent remotely without exposing ports.
          </p>
          <a
            href="https://tailscale.com/kb/1085/auth-keys"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-emerald-500 hover:text-emerald-400 mb-4"
          >
            <ExternalLink size={11} />
            How to set up Tailscale
          </a>

          {/* Mode toggle */}
          <div className="flex gap-2 mb-4">
            {(['authkey', 'oauth'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setTsMode(m)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                  tsMode === m
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                    : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:border-neutral-600'
                }`}
              >
                {m === 'authkey' ? 'Auth Key' : 'OAuth Client'}
              </button>
            ))}
          </div>

          <div className="space-y-3 mb-4">
            {tsMode === 'authkey' ? (
              <Field label="Auth Key">
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    value={tsAuthKey}
                    onChange={(e) => setTsAuthKey(e.target.value)}
                    placeholder={tailscaleConfig?.hasAuthKey ? '••••••••  (key set — enter new to replace)' : 'tskey-auth-...'}
                    className="input-field flex-1"
                  />
                  <StatusDot configured={tailscaleConfig?.hasAuthKey ?? false} />
                </div>
              </Field>
            ) : (
              <>
                <Field label="Client ID">
                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      value={tsClientId}
                      onChange={(e) => setTsClientId(e.target.value)}
                      placeholder={tailscaleConfig?.hasOAuthCredentials ? '••••••••  (set — enter new to replace)' : 'OAuth Client ID'}
                      className="input-field flex-1"
                    />
                    <StatusDot configured={tailscaleConfig?.hasOAuthCredentials ?? false} />
                  </div>
                </Field>
                <Field label="Client Secret">
                  <input
                    type="password"
                    value={tsClientSecret}
                    onChange={(e) => setTsClientSecret(e.target.value)}
                    placeholder={tailscaleConfig?.hasOAuthCredentials ? '••••••••  (set — enter new to replace)' : 'OAuth Client Secret'}
                    className="input-field"
                  />
                </Field>
              </>
            )}
          </div>

          {/* Enable toggle */}
          <div className="flex items-center justify-between bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 mb-4">
            <div>
              <p className="text-sm font-medium text-neutral-200">Enable Tailscale</p>
              <p className="text-xs text-neutral-600 mt-0.5">
                {tsHasCredentials
                  ? (tsEnabled ? 'Connected via Tailscale' : 'Credentials configured but not enabled')
                  : 'Configure credentials above to enable'}
              </p>
            </div>
            <Toggle checked={tsEnabled} onChange={setTsEnabled} disabled={!tsHasCredentials} />
          </div>

          <div className="flex items-center gap-3">
            <button onClick={handleSaveTailscale} disabled={savingTs} className="btn-ghost">
              {savingTs ? 'Saving…' : 'Save Remote Access'}
            </button>
            {savedTs && (
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <CheckCircle2 size={13} /> Saved
              </span>
            )}
            {tsHasCredentials && (
              <button
                onClick={handleDisconnectTailscale}
                disabled={disconnectingTs}
                className="btn-danger disabled:opacity-50 ml-auto"
              >
                {disconnectingTs ? 'Disconnecting…' : 'Disconnect'}
              </button>
            )}
          </div>
        </Section>

        {/* Main save */}
        <div className="flex items-center gap-3 pt-2 border-t border-neutral-800 mt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
          {saved && (
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <CheckCircle2 size={13} />
              Saved
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function StatusDot({ configured }: { configured: boolean }): React.JSX.Element {
  return configured ? (
    <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
  ) : (
    <XCircle size={14} className="text-neutral-700 shrink-0" />
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="mb-7">
      <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
        {title}
      </h2>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="flex items-center gap-4">
      <span className="text-xs text-neutral-400 w-28 shrink-0">{label}</span>
      <div className="flex-1">{children}</div>
    </div>
  )
}
