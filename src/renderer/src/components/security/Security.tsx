import { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, Shield, Lock, Monitor } from 'lucide-react'
import { useAppStore } from '../../store'
import type { SecurityStatus, AIProvider } from '../../types'

const PROVIDER_LABELS: Record<AIProvider, string> = {
  gemini: 'Google Gemini',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  openrouter: 'OpenRouter'
}

export function Security(): React.JSX.Element {
  const securityStatus = useAppStore((s) => s.securityStatus)
  const setSecurityStatus = useAppStore((s) => s.setSecurityStatus)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)

  const load = (): void => {
    if (!window.api) return
    window.api.getSecurityStatus().then(setSecurityStatus).catch(console.error)
  }

  useEffect(() => { load() }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  const handleDisconnect = async (integration: string): Promise<void> => {
    if (!window.api) return
    setDisconnecting(integration)
    await window.api.disconnectIntegration(integration).catch(console.error)
    const refreshed = await window.api.getSecurityStatus().catch(() => null)
    if (refreshed) setSecurityStatus(refreshed)
    setDisconnecting(null)
  }

  if (!securityStatus) {
    return (
      <div className="flex items-center justify-center h-full text-neutral-700 text-sm">
        Loading…
      </div>
    )
  }

  const s = securityStatus

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-2xl space-y-6">
        <h1 className="text-base font-semibold text-neutral-100">Security</h1>

        {/* Connection Status */}
        <Section title="Connection Status">
          <div className="space-y-2">
            {/* OANDA */}
            <ConnectionCard
              title="OANDA Broker"
              status={s.oanda}
              meta={
                s.oanda.connected
                  ? `${s.oanda.environment === 'live' ? 'Live' : 'Practice'} · ${s.oanda.maskedAccountId}`
                  : 'Not configured'
              }
              integration="oanda"
              disconnecting={disconnecting}
              onDisconnect={handleDisconnect}
            />

            {/* AI Providers */}
            {(Object.entries(s.providers) as [AIProvider, SecurityStatus['providers'][AIProvider]][]).map(
              ([id, status]) => (
                <ConnectionCard
                  key={id}
                  title={PROVIDER_LABELS[id]}
                  status={status}
                  meta={status.connected ? 'API key configured' : 'Not configured'}
                  integration={id}
                  disconnecting={disconnecting}
                  onDisconnect={handleDisconnect}
                />
              )
            )}

            {/* Telegram */}
            <ConnectionCard
              title="Telegram Bot"
              status={s.telegram}
              meta={s.telegram.connected ? 'Bot token configured' : 'Not configured'}
              integration="telegram"
              disconnecting={disconnecting}
              onDisconnect={handleDisconnect}
            />
          </div>
        </Section>

        {/* Key Storage */}
        <Section title="Key Storage">
          <div className="space-y-3">
            <VerificationRow
              icon={Lock}
              verified={s.keyStorageVerified}
              label={s.keyStorageVerified ? 'OS Keychain (safeStorage)' : 'OS Keychain unavailable'}
              description={
                s.keyStorageVerified
                  ? 'All API keys are encrypted by the OS credential store (Keychain on macOS, DPAPI on Windows, libsecret on Linux). Keys are tied to this machine and user account.'
                  : 'OS-level encryption is not available. Keys may be stored less securely.'
              }
            />
            <VerificationRow
              icon={Monitor}
              verified={s.rendererIsolated}
              label="Renderer Process Isolated"
              description="contextIsolation is active and nodeIntegration is disabled. The renderer has no direct access to Node.js APIs or the file system. All data flows through the typed IPC bridge."
            />
            <VerificationRow
              icon={Shield}
              verified={true}
              label="Keys Never Sent to Renderer"
              description="The IPC settings:get handler returns only boolean flags (key configured: yes/no). Raw key values remain in the main process and are passed directly to SDK clients."
            />
          </div>
        </Section>
      </div>
    </div>
  )
}

// ─── Connection card ───────────────────────────────────────────────────────────

interface IntegrationStatus {
  connected: boolean
  lastConnected: string | null
}

function ConnectionCard({
  title,
  status,
  meta,
  integration,
  disconnecting,
  onDisconnect
}: {
  title: string
  status: IntegrationStatus
  meta: string
  integration: string
  disconnecting: string | null
  onDisconnect: (integration: string) => void
}): React.JSX.Element {
  const isDisconnecting = disconnecting === integration

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 flex items-center gap-4">
      {/* Status indicator */}
      <div className="shrink-0">
        {status.connected ? (
          <CheckCircle2 size={15} className="text-emerald-500" />
        ) : (
          <XCircle size={15} className="text-neutral-700" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-neutral-200">{title}</p>
        <p className="text-xs text-neutral-600 mt-0.5">{meta}</p>
        {status.lastConnected && (
          <p className="text-xs text-neutral-700 mt-0.5">
            Last connected {formatRelative(status.lastConnected)}
          </p>
        )}
      </div>

      {/* Badge + disconnect */}
      <div className="flex items-center gap-2 shrink-0">
        <span
          className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
            status.connected
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-neutral-800 text-neutral-600 border-neutral-700'
          }`}
        >
          {status.connected ? 'Connected' : 'Disconnected'}
        </span>
        {status.connected && (
          <button
            onClick={() => onDisconnect(integration)}
            disabled={isDisconnecting}
            className="btn-danger !py-0.5 !px-2 !text-xs disabled:opacity-50"
          >
            {isDisconnecting ? '…' : 'Disconnect'}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Verification row ─────────────────────────────────────────────────────────

function VerificationRow({
  icon: Icon,
  verified,
  label,
  description
}: {
  icon: React.ElementType
  verified: boolean
  label: string
  description: string
}): React.JSX.Element {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 flex gap-3">
      <div className="shrink-0 mt-0.5">
        {verified ? (
          <CheckCircle2 size={15} className="text-emerald-500" />
        ) : (
          <XCircle size={15} className="text-red-500" />
        )}
      </div>
      <div>
        <div className="flex items-center gap-2">
          <Icon size={13} className="text-neutral-500" />
          <p className="text-sm font-medium text-neutral-200">{label}</p>
        </div>
        <p className="text-xs text-neutral-600 mt-1 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <div>
      <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">{title}</h2>
      {children}
    </div>
  )
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60_000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'just now'
}
