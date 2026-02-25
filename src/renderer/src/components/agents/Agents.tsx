import { useState, useEffect } from 'react'
import { Pencil, Trash2, Plus, ChevronLeft, X } from 'lucide-react'
import { useAppStore } from '../../store'
import { Toggle } from '../ui/Toggle'
import type { Agent, AgentFormDraft, SubAgentType } from '../../types'

const SUB_AGENT_TYPES: { type: SubAgentType; label: string; description: string }[] = [
  { type: 'risk_manager', label: 'Risk Manager', description: 'Monitors position sizing, drawdown, and exposure limits.' },
  { type: 'news_scanner', label: 'News Scanner', description: 'Scans economic news and event calendars for trading signals.' },
  { type: 'technical_analyst', label: 'Technical Analyst', description: 'Analyzes price action, indicators, and chart patterns.' },
  { type: 'sentiment_analyzer', label: 'Sentiment Analyzer', description: 'Evaluates market sentiment from social and news data.' }
]

const DEFAULT_SUB_AGENT_ENTRY = { enabled: false, prompt: '', name: '', role_desc: '', model: '', system_prompt: '', strategy_prompt: '' }

const DEFAULT_DRAFT: AgentFormDraft = {
  name: '',
  role_desc: '',
  system_prompt: '',
  strategy_prompt: '',
  model: '',
  brokerage: 'oanda',
  account_number: '',
  brokerageApiKey: '',
  sub_agents: {
    risk_manager: { ...DEFAULT_SUB_AGENT_ENTRY },
    news_scanner: { ...DEFAULT_SUB_AGENT_ENTRY },
    technical_analyst: { ...DEFAULT_SUB_AGENT_ENTRY },
    sentiment_analyzer: { ...DEFAULT_SUB_AGENT_ENTRY }
  }
}

// ─── View state machine ────────────────────────────────────────────────────────

type View = { mode: 'list' } | { mode: 'create' } | { mode: 'edit'; agentId: string }

// ─── Root component ────────────────────────────────────────────────────────────

export function Agents(): React.JSX.Element {
  const [view, setView] = useState<View>({ mode: 'list' })

  if (view.mode === 'list') {
    return (
      <AgentList
        onNew={() => setView({ mode: 'create' })}
        onEdit={(id) => setView({ mode: 'edit', agentId: id })}
      />
    )
  }

  return (
    <AgentForm
      agentId={view.mode === 'edit' ? view.agentId : undefined}
      onSaved={() => setView({ mode: 'list' })}
      onCancel={() => setView({ mode: 'list' })}
    />
  )
}

// ─── Agent list ────────────────────────────────────────────────────────────────

function AgentList({
  onNew,
  onEdit
}: {
  onNew: () => void
  onEdit: (id: string) => void
}): React.JSX.Element {
  const agents = useAppStore((s) => s.agents)
  const setAgents = useAppStore((s) => s.setAgents)
  const removeAgent = useAppStore((s) => s.removeAgent)
  const upsertAgent = useAppStore((s) => s.upsertAgent)

  useEffect(() => {
    if (!window.api) return
    window.api.listAgents().then(setAgents).catch(console.error)
  }, [setAgents])

  const handleDelete = async (id: string, name: string): Promise<void> => {
    if (!window.api) return
    if (!confirm(`Delete agent "${name}"? This cannot be undone.`)) return
    await window.api.deleteAgent(id).catch(console.error)
    removeAgent(id)
  }

  const handleToggle = async (agent: Agent): Promise<void> => {
    if (!window.api) return
    const next = !agent.enabled
    await window.api.toggleAgent(agent.id, next).catch(console.error)
    upsertAgent({ ...agent, enabled: next })
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 shrink-0">
        <h1 className="text-sm font-semibold text-neutral-100">Agents</h1>
        <button onClick={onNew} className="btn-primary flex items-center gap-1.5 !py-1.5 !px-3 !text-xs">
          <Plus size={13} />
          New Agent
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {agents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <Cpu32 />
            <div>
              <p className="text-sm text-neutral-500 mb-1">No agents yet</p>
              <p className="text-xs text-neutral-700">
                Create an agent to define its role, strategy, and sub-agent configuration.
              </p>
            </div>
          </div>
        ) : (
          agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onEdit={() => onEdit(agent.id)}
              onDelete={() => handleDelete(agent.id, agent.name)}
              onToggle={() => handleToggle(agent)}
            />
          ))
        )}
      </div>
    </div>
  )
}

// ─── Agent card ────────────────────────────────────────────────────────────────

function AgentCard({
  agent,
  onEdit,
  onDelete,
  onToggle
}: {
  agent: Agent
  onEdit: () => void
  onDelete: () => void
  onToggle: () => void
}): React.JSX.Element {
  const statusColors: Record<string, string> = {
    active: 'bg-emerald-400 animate-pulse',
    idle: 'bg-neutral-600',
    stopped: 'bg-red-500'
  }
  const statusLabel: Record<string, string> = {
    active: 'Active',
    idle: 'Idle',
    stopped: 'Stopped'
  }

  const modelLabel = agent.model || 'No model set'
  const enabledSubAgents = agent.sub_agents?.filter((s) => s.enabled).length ?? 0

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 flex items-center gap-4 hover:border-neutral-700 transition-colors">
      <span className={`w-2 h-2 rounded-full shrink-0 ${statusColors[agent.status] ?? 'bg-neutral-600'}`} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-medium text-neutral-100 truncate">{agent.name}</span>
          <span className="text-xs text-neutral-600 shrink-0">
            {statusLabel[agent.status] ?? agent.status}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-600 bg-neutral-800 border border-neutral-700 rounded px-1.5 py-px shrink-0">
            {modelLabel}
          </span>
          {agent.role_desc && (
            <span className="text-xs text-neutral-600 truncate">{agent.role_desc}</span>
          )}
          {enabledSubAgents > 0 && (
            <span className="text-xs text-neutral-600 shrink-0">
              {enabledSubAgents} sub-agent{enabledSubAgents !== 1 ? 's' : ''}
            </span>
          )}
          {agent.hasBrokerageKey && (
            <span className="text-xs text-emerald-600 shrink-0">Broker connected</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Toggle checked={agent.enabled} onChange={() => onToggle()} />

        <button onClick={onEdit} className="btn-ghost !py-1 !px-2 flex items-center gap-1">
          <Pencil size={12} />
          <span>Edit</span>
        </button>
        <button onClick={onDelete} className="btn-danger !py-1 !px-2 flex items-center gap-1">
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  )
}

// ─── Agent form ────────────────────────────────────────────────────────────────

function AgentForm({
  agentId,
  onSaved,
  onCancel
}: {
  agentId?: string
  onSaved: () => void
  onCancel: () => void
}): React.JSX.Element {
  const upsertAgent = useAppStore((s) => s.upsertAgent)
  const [draft, setDraft] = useState<AgentFormDraft>(DEFAULT_DRAFT)
  const [hasBrokerageKey, setHasBrokerageKey] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSubAgentPicker, setShowSubAgentPicker] = useState(false)

  useEffect(() => {
    if (!agentId || !window.api) return
    window.api.getAgent(agentId).then((agent) => {
      if (!agent) return
      const subMap: AgentFormDraft['sub_agents'] = {
        risk_manager: { ...DEFAULT_SUB_AGENT_ENTRY },
        news_scanner: { ...DEFAULT_SUB_AGENT_ENTRY },
        technical_analyst: { ...DEFAULT_SUB_AGENT_ENTRY },
        sentiment_analyzer: { ...DEFAULT_SUB_AGENT_ENTRY }
      }
      for (const sub of agent.sub_agents ?? []) {
        subMap[sub.type] = {
          enabled: sub.enabled,
          prompt: sub.prompt,
          name: sub.name ?? '',
          role_desc: sub.role_desc ?? '',
          model: sub.model ?? '',
          system_prompt: sub.system_prompt ?? '',
          strategy_prompt: sub.strategy_prompt ?? ''
        }
      }
      setDraft({
        name: agent.name,
        role_desc: agent.role_desc,
        system_prompt: agent.system_prompt,
        strategy_prompt: agent.strategy_prompt,
        model: agent.model,
        brokerage: agent.brokerage ?? 'oanda',
        account_number: agent.account_number ?? '',
        brokerageApiKey: '',
        sub_agents: subMap
      })
      setHasBrokerageKey(agent.hasBrokerageKey)
    }).catch(console.error)
  }, [agentId])

  const setField = <K extends keyof AgentFormDraft>(key: K, value: AgentFormDraft[K]): void => {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  const setSubAgent = (type: SubAgentType, field: string, value: boolean | string): void => {
    setDraft((prev) => ({
      ...prev,
      sub_agents: { ...prev.sub_agents, [type]: { ...prev.sub_agents[type], [field]: value } }
    }))
  }

  const addSubAgent = (type: SubAgentType): void => {
    setSubAgent(type, 'enabled', true)
    setShowSubAgentPicker(false)
  }

  const removeSubAgent = (type: SubAgentType): void => {
    setDraft((prev) => ({
      ...prev,
      sub_agents: { ...prev.sub_agents, [type]: { ...DEFAULT_SUB_AGENT_ENTRY } }
    }))
  }

  const handleSave = async (): Promise<void> => {
    if (!window.api) return
    if (!draft.name.trim()) { setError('Agent name is required.'); return }
    setError(null)
    setSaving(true)

    const subAgentsPayload = SUB_AGENT_TYPES.map(({ type }) => ({
      type,
      enabled: draft.sub_agents[type].enabled,
      prompt: draft.sub_agents[type].prompt,
      name: draft.sub_agents[type].name,
      role_desc: draft.sub_agents[type].role_desc,
      model: draft.sub_agents[type].model,
      system_prompt: draft.sub_agents[type].system_prompt,
      strategy_prompt: draft.sub_agents[type].strategy_prompt
    }))

    const payload = {
      name: draft.name.trim(),
      role_desc: draft.role_desc,
      system_prompt: draft.system_prompt,
      strategy_prompt: draft.strategy_prompt,
      model: draft.model,
      brokerage: draft.brokerage,
      account_number: draft.account_number,
      sub_agents: subAgentsPayload,
      ...(draft.brokerageApiKey ? { brokerageApiKey: draft.brokerageApiKey } : {})
    }

    try {
      let saved: Agent
      if (agentId) {
        saved = await window.api.updateAgent({ id: agentId, ...payload })
      } else {
        saved = await window.api.createAgent(payload)
      }
      upsertAgent(saved)
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  const enabledSubAgentTypes = SUB_AGENT_TYPES.filter(({ type }) => draft.sub_agents[type].enabled)
  const disabledSubAgentTypes = SUB_AGENT_TYPES.filter(({ type }) => !draft.sub_agents[type].enabled)

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onCancel} className="btn-ghost flex items-center gap-1">
            <ChevronLeft size={13} />
            Back
          </button>
          <h1 className="text-base font-semibold text-neutral-100">
            {agentId ? 'Edit Agent' : 'New Agent'}
          </h1>
        </div>

        {/* Identity */}
        <FormSection title="Identity">
          <FormField label="Name">
            <input
              type="text"
              value={draft.name}
              onChange={(e) => setField('name', e.target.value)}
              placeholder="e.g. Main Trader"
              className="input-field"
            />
          </FormField>
          <FormField label="Role">
            <input
              type="text"
              value={draft.role_desc}
              onChange={(e) => setField('role_desc', e.target.value)}
              placeholder="Short description of this agent's role"
              className="input-field"
            />
          </FormField>
          <FormField label="Model">
            <input
              type="text"
              value={draft.model}
              onChange={(e) => setField('model', e.target.value)}
              placeholder="e.g. anthropic/claude-haiku-4.5 or openrouter/anthropic/claude-sonnet-4-6"
              className="input-field"
            />
            <p className="text-xs text-neutral-600 mt-1">Format: provider/model — use /models in Chat to see available options</p>
          </FormField>
        </FormSection>

        {/* System prompt */}
        <FormSection title="System Prompt">
          <p className="text-xs text-neutral-600 mb-2">
            Core instructions that define the agent's behaviour and constraints.
          </p>
          <textarea
            value={draft.system_prompt}
            onChange={(e) => setField('system_prompt', e.target.value)}
            placeholder="You are a disciplined forex trading agent operating on the OANDA platform..."
            className="input-field min-h-[140px] resize-y font-mono text-xs leading-relaxed"
          />
        </FormSection>

        {/* Strategy prompt */}
        <FormSection title="Strategy Prompt">
          <p className="text-xs text-neutral-600 mb-2">
            Trading logic, entry/exit rules, and risk parameters for this agent.
          </p>
          <textarea
            value={draft.strategy_prompt}
            onChange={(e) => setField('strategy_prompt', e.target.value)}
            placeholder="Focus on EUR/USD during London and New York session overlap. Enter on momentum breakouts..."
            className="input-field min-h-[140px] resize-y font-mono text-xs leading-relaxed"
          />
        </FormSection>

        {/* Brokerage */}
        <FormSection title="Brokerage">
          <div className="space-y-3">
            <FormField label="Broker">
              <select value={draft.brokerage} onChange={(e) => setField('brokerage', e.target.value)} className="input-field">
                <option value="oanda">OANDA</option>
              </select>
            </FormField>
            <FormField label="API Key">
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={draft.brokerageApiKey}
                  onChange={(e) => setField('brokerageApiKey', e.target.value)}
                  placeholder={hasBrokerageKey ? '••••••••  (key set — enter new to replace)' : 'Your OANDA API key'}
                  className="input-field flex-1"
                />
                <BrokerDot configured={hasBrokerageKey} />
              </div>
            </FormField>
            <FormField label="Account #">
              <input
                type="text"
                value={draft.account_number}
                onChange={(e) => setField('account_number', e.target.value)}
                placeholder="001-001-XXXXXXX-001"
                className="input-field"
              />
              <p className="text-xs text-neutral-600 mt-1">Use your practice account number for paper trading, live account number for real trading. Tradent cannot determine which is which — double check before starting.</p>
            </FormField>
          </div>
        </FormSection>

        {/* Sub-agents */}
        <FormSection title="Sub-Agents">
          <p className="text-xs text-neutral-600 mb-3">
            Enable specialised sub-agents to assist this agent's decision making.
          </p>

          {enabledSubAgentTypes.length > 0 && (
            <div className="space-y-3 mb-3">
              {enabledSubAgentTypes.map(({ type, label, description }) => (
                <div key={type} className="bg-neutral-900 border border-neutral-800 rounded-lg p-3">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-neutral-200">{label}</p>
                      <p className="text-xs text-neutral-600 mt-0.5">{description}</p>
                    </div>
                    <button
                      onClick={() => removeSubAgent(type)}
                      className="text-neutral-600 hover:text-neutral-400 transition-colors shrink-0 mt-0.5"
                      title={`Remove ${label}`}
                    >
                      <X size={13} />
                    </button>
                  </div>
                  <div className="space-y-2 mt-2">
                    <input
                      type="text"
                      value={draft.sub_agents[type].name}
                      onChange={(e) => setSubAgent(type, 'name', e.target.value)}
                      placeholder="Name"
                      className="input-field"
                    />
                    <input
                      type="text"
                      value={draft.sub_agents[type].role_desc}
                      onChange={(e) => setSubAgent(type, 'role_desc', e.target.value)}
                      placeholder="Role description"
                      className="input-field"
                    />
                    <input
                      type="text"
                      value={draft.sub_agents[type].model}
                      onChange={(e) => setSubAgent(type, 'model', e.target.value)}
                      placeholder="e.g. anthropic/claude-haiku-4.5 or openrouter/anthropic/claude-sonnet-4-6"
                      className="input-field"
                    />
                    <textarea
                      value={draft.sub_agents[type].system_prompt}
                      onChange={(e) => setSubAgent(type, 'system_prompt', e.target.value)}
                      placeholder="System prompt…"
                      className="input-field min-h-[90px] resize-y font-mono text-xs leading-relaxed"
                    />
                    <textarea
                      value={draft.sub_agents[type].strategy_prompt}
                      onChange={(e) => setSubAgent(type, 'strategy_prompt', e.target.value)}
                      placeholder="Strategy prompt…"
                      className="input-field min-h-[90px] resize-y font-mono text-xs leading-relaxed"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {disabledSubAgentTypes.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowSubAgentPicker((v) => !v)}
                className="btn-ghost flex items-center gap-1.5 text-xs"
              >
                <Plus size={13} />
                Add Sub-Agent
              </button>

              {showSubAgentPicker && (
                <div className="absolute top-full mt-1 left-0 z-10 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl py-1 min-w-[200px]">
                  {disabledSubAgentTypes.map(({ type, label }) => (
                    <button
                      key={type}
                      onClick={() => addSubAgent(type)}
                      className="w-full text-left px-3 py-2 text-xs text-neutral-300 hover:bg-neutral-800 hover:text-neutral-100 transition-colors"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </FormSection>

        {/* Actions */}
        {error && <p className="text-xs text-red-400 mb-3">{error}</p>}
        <div className="flex items-center gap-3">
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : agentId ? 'Save Changes' : 'Create Agent'}
          </button>
          <button onClick={onCancel} className="btn-ghost">Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function BrokerDot({ configured }: { configured: boolean }): React.JSX.Element {
  return configured ? (
    <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 shrink-0" title="Key configured" />
  ) : (
    <span className="w-3.5 h-3.5 rounded-full bg-neutral-700 border border-neutral-600 shrink-0" title="No key" />
  )
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="mb-7">
      <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">{title}</h2>
      {children}
    </div>
  )
}

function FormField({ label, children }: { label: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="flex items-center gap-4 mb-3 last:mb-0">
      <span className="text-xs text-neutral-400 w-20 shrink-0">{label}</span>
      <div className="flex-1">{children}</div>
    </div>
  )
}

function Cpu32(): React.JSX.Element {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-800">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <line x1="9" y1="1" x2="9" y2="4" /><line x1="15" y1="1" x2="15" y2="4" />
      <line x1="9" y1="20" x2="9" y2="23" /><line x1="15" y1="20" x2="15" y2="23" />
      <line x1="20" y1="9" x2="23" y2="9" /><line x1="20" y1="14" x2="23" y2="14" />
      <line x1="1" y1="9" x2="4" y2="9" /><line x1="1" y1="14" x2="4" y2="14" />
    </svg>
  )
}
