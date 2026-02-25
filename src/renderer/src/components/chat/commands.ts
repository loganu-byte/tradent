export type ParsedCommand =
  | { kind: 'new' }
  | { kind: 'compact' }
  | { kind: 'memory' }
  | { kind: 'commands' }
  | { kind: 'models'; provider?: string }
  | { kind: 'model'; provider: string; model: string }
  | { kind: 'schedule'; time: string; message: string }
  | { kind: 'unknown'; raw: string }

/**
 * Returns a ParsedCommand if input starts with '/', otherwise null.
 */
export function parseCommand(input: string): ParsedCommand | null {
  if (!input.startsWith('/')) return null

  const trimmed = input.trim()

  if (trimmed === '/new') return { kind: 'new' }
  if (trimmed === '/compact') return { kind: 'compact' }
  if (trimmed === '/memory') return { kind: 'memory' }
  if (trimmed === '/commands' || trimmed === '/help') return { kind: 'commands' }

  // /models [provider]
  if (trimmed === '/models') return { kind: 'models' }
  if (trimmed.startsWith('/models ')) {
    const provider = trimmed.slice('/models '.length).trim()
    return { kind: 'models', provider: provider || undefined }
  }

  // /model provider/model-id
  if (trimmed.startsWith('/model ')) {
    const rest = trimmed.slice('/model '.length).trim()
    const slashIdx = rest.indexOf('/')
    if (slashIdx > 0) {
      const provider = rest.slice(0, slashIdx)
      const model = rest.slice(slashIdx + 1)
      if (provider && model) return { kind: 'model', provider, model }
    }
    return { kind: 'unknown', raw: trimmed }
  }

  // /schedule ISO-TIME message text
  if (trimmed.startsWith('/schedule ')) {
    const rest = trimmed.slice('/schedule '.length).trim()
    const spaceIdx = rest.indexOf(' ')
    if (spaceIdx > 0) {
      const time = rest.slice(0, spaceIdx)
      const message = rest.slice(spaceIdx + 1).trim()
      if (time && message) return { kind: 'schedule', time, message }
    }
    return { kind: 'unknown', raw: trimmed }
  }

  return { kind: 'unknown', raw: trimmed }
}
