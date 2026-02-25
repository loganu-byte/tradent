import { ipcMain } from 'electron'
import { getApiKey, hasApiKey } from '../store/settings'
import { getVal, setVal } from './settings'

const ANTHROPIC_MODELS = ['claude-opus-4-6', 'claude-sonnet-4-6', 'claude-haiku-4-5']

async function fetchGeminiModels(apiKey: string): Promise<string[]> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`)
  const data = await res.json() as { models?: { name?: string; supportedGenerationMethods?: string[] }[] }
  return (data.models ?? [])
    .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
    .map((m) => (m.name ?? '').replace(/^models\//, ''))
    .filter(Boolean)
}

async function fetchOpenAIModels(apiKey: string): Promise<string[]> {
  const res = await fetch('https://api.openai.com/v1/models', {
    headers: { Authorization: `Bearer ${apiKey}` }
  })
  if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`)
  const data = await res.json() as { data?: { id: string }[] }
  return (data.data ?? [])
    .map((m) => m.id)
    .filter((id) => id.startsWith('gpt-'))
    .sort()
}

async function fetchOpenRouterModels(apiKey: string): Promise<string[]> {
  const res = await fetch('https://openrouter.ai/api/v1/models', {
    headers: { Authorization: `Bearer ${apiKey}` }
  })
  if (!res.ok) throw new Error(`OpenRouter API error: ${res.status}`)
  const data = await res.json() as { data?: { id: string }[] }
  return (data.data ?? []).map((m) => m.id).filter(Boolean)
}

export function registerModelsHandlers(): void {
  ipcMain.handle('models:list', async (_event, provider?: string) => {
    const models: { id: string; name: string; provider: string }[] = []
    const errors: Record<string, string> = {}

    const providers = provider ? [provider] : ['gemini', 'openai', 'anthropic', 'openrouter']

    for (const p of providers) {
      if (!hasApiKey(p) && p !== 'anthropic') continue

      try {
        let ids: string[] = []
        if (p === 'gemini') {
          const key = getApiKey('gemini')!
          ids = await fetchGeminiModels(key)
        } else if (p === 'openai') {
          const key = getApiKey('openai')!
          ids = await fetchOpenAIModels(key)
        } else if (p === 'anthropic') {
          ids = ANTHROPIC_MODELS
        } else if (p === 'openrouter') {
          const key = getApiKey('openrouter')!
          ids = await fetchOpenRouterModels(key)
        }
        for (const id of ids) {
          models.push({ id, name: id, provider: p })
        }
      } catch (err) {
        errors[p] = err instanceof Error ? err.message : 'Unknown error'
      }
    }

    return { models, errors }
  })

  ipcMain.handle('models:set-active', (_event, { provider, model }: { provider: string; model: string }) => {
    setVal('activeProvider', provider)
    setVal('activeModel', model)
    return { success: true }
  })

  ipcMain.handle('models:get-active', () => {
    return {
      provider: getVal('activeProvider', null) as string | null,
      model: getVal('activeModel', null) as string | null
    }
  })
}
