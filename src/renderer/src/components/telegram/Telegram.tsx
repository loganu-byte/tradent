import { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, Send } from 'lucide-react'
import { useAppStore } from '../../store'
import { Toggle } from '../ui/Toggle'
import type { TelegramUpdatePayload } from '../../types'

interface NotifState {
  trade_opened: boolean
  trade_closed: boolean
  daily_summary: boolean
  agent_stopped: boolean
  loss_limit: boolean
}

export function Telegram(): React.JSX.Element {
  const telegramConfig = useAppStore((s) => s.telegramConfig)
  const setTelegramConfig = useAppStore((s) => s.setTelegramConfig)

  const [botToken, setBotToken] = useState('')
  const [chatId, setChatId] = useState('')
  const [enabled, setEnabled] = useState(false)
  const [notifications, setNotifications] = useState<NotifState>({
    trade_opened: true,
    trade_closed: true,
    daily_summary: true,
    agent_stopped: true,
    loss_limit: true
  })
  const [customEnabled, setCustomEnabled] = useState(false)
  const [customText, setCustomText] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [disconnecting, setDisconnecting] = useState(false)

  const loadConfig = (): void => {
    if (!window.api) return
    window.api.getTelegram().then((cfg) => {
      setTelegramConfig(cfg)
      setChatId(cfg.chat_id)
      setEnabled(cfg.enabled)
      setNotifications({
        trade_opened: cfg.notify_trade_opened,
        trade_closed: cfg.notify_trade_closed,
        daily_summary: cfg.notify_daily_summary,
        agent_stopped: cfg.notify_agent_stopped,
        loss_limit: cfg.notify_loss_limit
      })
      setCustomEnabled(cfg.notify_custom)
      setCustomText(cfg.custom_notification_text)
    }).catch(console.error)
  }

  useEffect(() => { loadConfig() }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async (): Promise<void> => {
    if (!window.api) return
    setSaving(true)
    const payload: TelegramUpdatePayload = {
      chat_id: chatId,
      enabled,
      notify_trade_opened: notifications.trade_opened,
      notify_trade_closed: notifications.trade_closed,
      notify_daily_summary: notifications.daily_summary,
      notify_agent_stopped: notifications.agent_stopped,
      notify_loss_limit: notifications.loss_limit,
      notify_custom: customEnabled,
      custom_notification_text: customText
    }
    if (botToken) payload.botToken = botToken

    await window.api.updateTelegram(payload).catch(console.error)
    setBotToken('')
    const refreshed = await window.api.getTelegram().catch(() => null)
    if (refreshed) setTelegramConfig(refreshed)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleTest = async (): Promise<void> => {
    if (!window.api) return
    setTesting(true)
    setTestResult(null)
    const result = await window.api.testTelegram().catch(() => ({
      success: false,
      message: 'Test failed — check your configuration.'
    }))
    setTestResult(result)
    setTesting(false)
  }

  const handleDisconnect = async (): Promise<void> => {
    if (!window.api) return
    setDisconnecting(true)
    await window.api.disconnectTelegram().catch(console.error)
    setBotToken('')
    const refreshed = await window.api.getTelegram().catch(() => null)
    if (refreshed) {
      setTelegramConfig(refreshed)
      setEnabled(refreshed.enabled)
    }
    setDisconnecting(false)
  }

  const hasBotToken = telegramConfig?.hasBotToken ?? false
  const isConfigured = hasBotToken && chatId.trim().length > 0

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-2xl">
        <h1 className="text-base font-semibold text-neutral-100 mb-6">Telegram</h1>

        {/* Bot configuration */}
        <Section title="Bot Configuration">
          <div className="space-y-3">
            <Field label="Bot Token">
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  placeholder={hasBotToken ? '••••••••  (token configured — enter new to replace)' : '123456789:ABCdef...'}
                  className="input-field flex-1"
                />
                <StatusDot configured={hasBotToken} />
              </div>
            </Field>
            <Field label="Chat ID">
              <input
                type="text"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                placeholder="-1001234567890 or @channelname"
                className="input-field"
              />
            </Field>
          </div>
          <p className="mt-2 text-xs text-neutral-600">
            Create a bot via <span className="text-neutral-500">@BotFather</span> on Telegram.
            Use <span className="text-neutral-500">@userinfobot</span> to find your Chat ID.
          </p>
        </Section>

        {/* Status & test */}
        <Section title="Status">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isConfigured ? (
                <CheckCircle2 size={14} className="text-emerald-500" />
              ) : (
                <XCircle size={14} className="text-neutral-700" />
              )}
              <div>
                <p className="text-sm text-neutral-200">
                  {isConfigured ? 'Ready to send' : 'Not configured'}
                </p>
                {telegramConfig?.lastConnected && (
                  <p className="text-xs text-neutral-600 mt-0.5">
                    Token set {new Date(telegramConfig.lastConnected).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {testResult && (
                <span className={`text-xs ${testResult.success ? 'text-emerald-400' : 'text-red-400'}`}>
                  {testResult.message}
                </span>
              )}
              <button
                onClick={handleTest}
                disabled={testing || !isConfigured}
                className="btn-ghost flex items-center gap-1.5 disabled:opacity-40"
              >
                <Send size={12} />
                {testing ? 'Testing…' : 'Test'}
              </button>
            </div>
          </div>
        </Section>

        {/* Enable toggle */}
        <Section title="Notifications">
          <div className="flex items-center justify-between mb-4 bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3">
            <div>
              <p className="text-sm font-medium text-neutral-200">Enable Telegram Notifications</p>
              <p className="text-xs text-neutral-600 mt-0.5">Send alerts to your Telegram bot.</p>
            </div>
            <Toggle checked={enabled} onChange={setEnabled} />
          </div>

          <div className="space-y-2 bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3">
            <NotifRow
              label="Trade opened"
              checked={notifications.trade_opened}
              onChange={(v) => setNotifications((n) => ({ ...n, trade_opened: v }))}
              disabled={!enabled}
            />
            <NotifRow
              label="Trade closed"
              checked={notifications.trade_closed}
              onChange={(v) => setNotifications((n) => ({ ...n, trade_closed: v }))}
              disabled={!enabled}
            />
            <NotifRow
              label="Daily summary"
              checked={notifications.daily_summary}
              onChange={(v) => setNotifications((n) => ({ ...n, daily_summary: v }))}
              disabled={!enabled}
            />
            <NotifRow
              label="Agent stopped unexpectedly"
              checked={notifications.agent_stopped}
              onChange={(v) => setNotifications((n) => ({ ...n, agent_stopped: v }))}
              disabled={!enabled}
            />
            <NotifRow
              label="Daily loss limit hit"
              checked={notifications.loss_limit}
              onChange={(v) => setNotifications((n) => ({ ...n, loss_limit: v }))}
              disabled={!enabled}
            />
            <NotifRow
              label="Custom notification"
              checked={customEnabled}
              onChange={setCustomEnabled}
              disabled={!enabled}
            />
            {customEnabled && (
              <input
                type="text"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Describe the trigger or message for this notification"
                className="input-field mt-1 ml-6 text-xs"
                disabled={!enabled}
              />
            )}
          </div>
        </Section>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
          {saved && (
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <CheckCircle2 size={13} />
              Saved
            </span>
          )}
          {hasBotToken && (
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="btn-danger disabled:opacity-50 ml-auto"
            >
              {disconnecting ? 'Disconnecting…' : 'Disconnect Bot'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatusDot({ configured }: { configured: boolean }): React.JSX.Element {
  return configured ? (
    <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
  ) : (
    <XCircle size={14} className="text-neutral-700 shrink-0" />
  )
}

function NotifRow({
  label,
  checked,
  onChange,
  disabled
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled: boolean
}): React.JSX.Element {
  return (
    <label className={`flex items-center gap-3 py-1 cursor-pointer ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="w-3.5 h-3.5 rounded border-neutral-600 accent-emerald-500"
      />
      <span className="text-xs text-neutral-300">{label}</span>
    </label>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="mb-7">
      <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">{title}</h2>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="flex items-center gap-4">
      <span className="text-xs text-neutral-400 w-24 shrink-0">{label}</span>
      <div className="flex-1">{children}</div>
    </div>
  )
}
