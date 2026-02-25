import { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'
import { useAppStore } from '../../store'
import type { Theme, AIProvider, SettingsUpdatePayload } from '../../types'

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
  const [dailyLossLimit, setDailyLossLimit] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Populate form from persisted settings
  useEffect(() => {
    if (!settings) return
    setOandaAccount(settings.oanda.accountId)
    setOandaEnv(settings.oanda.environment)
    setDailyLossLimit(settings.dailyLossLimit !== null ? String(settings.dailyLossLimit) : '')
  }, [settings])

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
      oanda: {
        accountId: oandaAccount,
        environment: oandaEnv,
        ...(oandaKey ? { apiKey: oandaKey } : {})
      },
      dailyLossLimit: dailyLossLimit !== '' ? parseFloat(dailyLossLimit) : null
    }

    const filteredKeys = Object.fromEntries(
      Object.entries(apiKeys).filter(([, v]) => v !== '')
    ) as Partial<Record<AIProvider, string>>
    if (Object.keys(filteredKeys).length > 0) payload.apiKeys = filteredKeys

    await window.api.updateSettings(payload).catch(console.error)

    // Reload to refresh provider status badges
    const refreshed = await window.api.getSettings().catch(() => null)
    if (refreshed) setSettings(refreshed)

    setOandaKey('')
    setApiKeys({})
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

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

        {/* OANDA */}
        <Section title="OANDA Broker">
          <div className="space-y-3">
            <Field label="API Key">
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={oandaKey}
                  onChange={(e) => setOandaKey(e.target.value)}
                  placeholder={settings?.oanda?.hasApiKey ? '••••••••  (key configured — enter new to replace)' : 'Your OANDA API key'}
                  className="input-field flex-1"
                />
                <StatusDot configured={settings?.oanda?.hasApiKey ?? false} />
              </div>
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
              <div className="flex gap-2 items-center">
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
                {oandaEnv === 'live' && (
                  <span className="flex items-center gap-1 text-xs text-amber-400">
                    <AlertTriangle size={12} />
                    Live trading — real funds at risk
                  </span>
                )}
              </div>
            </Field>
          </div>
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

        <div className="flex items-center gap-3">
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
