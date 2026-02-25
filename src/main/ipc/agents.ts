import { ipcMain } from 'electron'
import { randomUUID } from 'crypto'
import { getDb } from '../db'
import {
  setAgentBrokerageKey,
  hasAgentBrokerageKey,
  clearAgentBrokerageKey
} from '../store/settings'

const toBool = (v: number | null | undefined): boolean => v === 1

const SUB_AGENT_TYPES = [
  'risk_manager',
  'news_scanner',
  'technical_analyst',
  'sentiment_analyzer'
] as const

interface RawAgent {
  id: string
  name: string
  status: string
  model: string
  role_desc: string
  system_prompt: string
  strategy_prompt: string
  enabled: number
  brokerage: string
  account_number: string
  brokerage_environment: string
  created_at: string
  updated_at: string
}

interface RawSubAgent {
  id: number
  agent_id: string
  type: string
  enabled: number
  prompt: string
  name: string
  role_desc: string
  model: string
  system_prompt: string
  strategy_prompt: string
}

function getAgentFull(id: string): unknown {
  const db = getDb()
  const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(id) as RawAgent | undefined
  if (!agent) return null
  const sub_agents = (
    db.prepare('SELECT * FROM sub_agents WHERE agent_id = ? ORDER BY id ASC').all(id) as RawSubAgent[]
  ).map((s) => ({ ...s, enabled: toBool(s.enabled) }))
  return {
    ...agent,
    enabled: toBool(agent.enabled),
    brokerage: agent.brokerage ?? 'oanda',
    account_number: agent.account_number ?? '',
    brokerage_environment: agent.brokerage_environment ?? 'practice',
    hasBrokerageKey: hasAgentBrokerageKey(id),
    sub_agents
  }
}

interface SubAgentPayload {
  type: string
  enabled: boolean
  prompt: string
  name?: string
  role_desc?: string
  model?: string
  system_prompt?: string
  strategy_prompt?: string
}

interface CreatePayload {
  name: string
  role_desc: string
  system_prompt: string
  strategy_prompt: string
  model: string
  enabled?: boolean
  brokerage?: string
  account_number?: string
  brokerage_environment?: string
  brokerageApiKey?: string
  sub_agents?: SubAgentPayload[]
}

interface UpdatePayload extends Partial<CreatePayload> {
  id: string
}

export function registerAgentsHandlers(): void {
  ipcMain.handle('agents:list', () => {
    const db = getDb()
    const agents = db
      .prepare('SELECT * FROM agents ORDER BY created_at DESC')
      .all() as RawAgent[]
    return agents.map((a) => {
      const sub_agents = (
        db
          .prepare('SELECT * FROM sub_agents WHERE agent_id = ? ORDER BY id ASC')
          .all(a.id) as RawSubAgent[]
      ).map((s) => ({ ...s, enabled: toBool(s.enabled) }))
      return {
        ...a,
        enabled: toBool(a.enabled),
        brokerage: a.brokerage ?? 'oanda',
        account_number: a.account_number ?? '',
        brokerage_environment: a.brokerage_environment ?? 'practice',
        hasBrokerageKey: hasAgentBrokerageKey(a.id),
        sub_agents
      }
    })
  })

  ipcMain.handle('agents:get', (_event, id: string) => {
    return getAgentFull(id)
  })

  ipcMain.handle('agents:create', (_event, payload: CreatePayload) => {
    const db = getDb()
    const id = randomUUID()
    const now = new Date().toISOString()

    db.prepare(
      `INSERT INTO agents (id, name, status, model, role_desc, system_prompt, strategy_prompt, enabled, brokerage, account_number, brokerage_environment, created_at, updated_at)
       VALUES (?, ?, 'idle', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      payload.name,
      payload.model ?? 'gemini-pro',
      payload.role_desc ?? '',
      payload.system_prompt ?? '',
      payload.strategy_prompt ?? '',
      payload.enabled !== false ? 1 : 0,
      payload.brokerage ?? 'oanda',
      payload.account_number ?? '',
      payload.brokerage_environment ?? 'practice',
      now,
      now
    )

    if (payload.brokerageApiKey) {
      setAgentBrokerageKey(id, payload.brokerageApiKey)
    }

    const insertSub = db.prepare(
      'INSERT INTO sub_agents (agent_id, type, enabled, prompt, name, role_desc, model, system_prompt, strategy_prompt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )

    const subMap = new Map<string, SubAgentPayload>(
      (payload.sub_agents ?? []).map((s) => [s.type, s])
    )

    for (const type of SUB_AGENT_TYPES) {
      const sub = subMap.get(type)
      insertSub.run(
        id, type, sub?.enabled ? 1 : 0, sub?.prompt ?? '',
        sub?.name ?? '', sub?.role_desc ?? '', sub?.model ?? '',
        sub?.system_prompt ?? '', sub?.strategy_prompt ?? ''
      )
    }

    return getAgentFull(id)
  })

  ipcMain.handle('agents:update', (_event, payload: UpdatePayload) => {
    const db = getDb()
    const now = new Date().toISOString()

    db.prepare(
      `UPDATE agents SET
        name = COALESCE(?, name),
        model = COALESCE(?, model),
        role_desc = COALESCE(?, role_desc),
        system_prompt = COALESCE(?, system_prompt),
        strategy_prompt = COALESCE(?, strategy_prompt),
        brokerage = COALESCE(?, brokerage),
        account_number = COALESCE(?, account_number),
        brokerage_environment = COALESCE(?, brokerage_environment),
        updated_at = ?
       WHERE id = ?`
    ).run(
      payload.name ?? null,
      payload.model ?? null,
      payload.role_desc ?? null,
      payload.system_prompt ?? null,
      payload.strategy_prompt ?? null,
      payload.brokerage ?? null,
      payload.account_number ?? null,
      payload.brokerage_environment ?? null,
      now,
      payload.id
    )

    if (payload.brokerageApiKey) {
      setAgentBrokerageKey(payload.id, payload.brokerageApiKey)
    }

    if (payload.sub_agents && payload.sub_agents.length > 0) {
      db.prepare('DELETE FROM sub_agents WHERE agent_id = ?').run(payload.id)

      const insertSub = db.prepare(
        'INSERT INTO sub_agents (agent_id, type, enabled, prompt, name, role_desc, model, system_prompt, strategy_prompt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      )
      const subMap = new Map<string, SubAgentPayload>(payload.sub_agents.map((s) => [s.type, s]))
      for (const type of SUB_AGENT_TYPES) {
        const sub = subMap.get(type)
        insertSub.run(
          payload.id, type, sub?.enabled ? 1 : 0, sub?.prompt ?? '',
          sub?.name ?? '', sub?.role_desc ?? '', sub?.model ?? '',
          sub?.system_prompt ?? '', sub?.strategy_prompt ?? ''
        )
      }
    }

    return getAgentFull(payload.id)
  })

  ipcMain.handle('agents:delete', (_event, id: string) => {
    getDb().prepare('DELETE FROM agents WHERE id = ?').run(id)
    clearAgentBrokerageKey(id)
    return { success: true }
  })

  ipcMain.handle('agents:toggle', (_event, { id, enabled }: { id: string; enabled: boolean }) => {
    getDb()
      .prepare('UPDATE agents SET enabled = ?, updated_at = ? WHERE id = ?')
      .run(enabled ? 1 : 0, new Date().toISOString(), id)
    return { success: true }
  })
}
