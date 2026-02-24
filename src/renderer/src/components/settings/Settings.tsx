import { useState, useEffect } from 'react'
import { useAppStore } from '../../store'
import type { Theme, AIProvider } from '../../types'

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

  const [apiKeys, setApiKeys] = useState<Partial<Record<AIProvider, string>>>({})
  const [oandaKey, setOandaKey] = useState('')
  const [oandaAccount, setOandaAccount] = useState('')
  const [oandaEnv, setOandaEnv] = useState<'practice' | 'live'>('practice')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!window.api) return
    window.api.getSettings().then(setSettings).catch(console.error)
  }, [setSettings])

  const handleSave = async (): Promise<void> => {
    setSaving(true)
    const updates: Record<string, unknown> = { theme }
    if (Object.keys(apiKeys).length > 0) updates.apiKeys = apiKeys
    if (oandaKey || oandaAccount) {
      updates['oanda.apiKey'] = oandaKey
      updates['oanda.accountId'] = oandaAccount
      updates['oanda.environment'] = oandaEnv
    }
    await window.api.updateSettings(updates)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="h-full overflow-y-auto p-6 max-w-2xl">
      <h1 className="text-base font-semibold text-neutral-100 mb-6">Settings</h1>

      {/* Theme */}
      <Section title="Appearance">
        <div className="flex gap-2">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
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
      </Section>

      {/* OANDA */}
      <Section title="OANDA Broker">
        <div className="space-y-3">
          <Field label="API Key">
            <input
              type="password"
              value={oandaKey}
              onChange={(e) => setOandaKey(e.target.value)}
              placeholder={settings?.apiKeysMasked ? '••••••••••••' : 'Your OANDA API key'}
              className="input-field"
            />
          </Field>
          <Field label="Account ID">
            <input
              type="text"
              value={oandaAccount}
              onChange={(e) => setOandaAccount(e.target.value)}
              placeholder="001-001-XXXXXXX-001"
              className="input-field"
            />
          </Field>
          <Field label="Environment">
            <div className="flex gap-2">
              {(['practice', 'live'] as const).map((env) => (
                <button
                  key={env}
                  onClick={() => setOandaEnv(env)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                    oandaEnv === env
                      ? env === 'live'
                        ? 'bg-red-500/20 border-red-500/40 text-red-400'
                        : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                      : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:border-neutral-600'
                  }`}
                >
                  {env.charAt(0).toUpperCase() + env.slice(1)}
                </button>
              ))}
            </div>
          </Field>
        </div>
      </Section>

      {/* AI Providers */}
      <Section title="AI Providers">
        <div className="space-y-3">
          {PROVIDERS.map((p) => (
            <Field key={p.id} label={p.label}>
              <input
                type="password"
                value={apiKeys[p.id] ?? ''}
                onChange={(e) => setApiKeys((prev) => ({ ...prev, [p.id]: e.target.value }))}
                placeholder={p.placeholder}
                className="input-field"
              />
            </Field>
          ))}
        </div>
      </Section>

      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
      >
        {saved ? 'Saved!' : saving ? 'Saving…' : 'Save Settings'}
      </button>
    </div>
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
