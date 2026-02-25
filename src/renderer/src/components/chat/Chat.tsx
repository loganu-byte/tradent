import { useState, useEffect, useRef } from 'react'
import { Send, MessageSquarePlus } from 'lucide-react'
import { useAppStore } from '../../store'
import { parseCommand } from './commands'

const SUGGESTED_PROMPTS = [
  'What is your current strategy?',
  'Summarize your recent trades.',
  'What instruments are you watching?',
  'How much risk are you taking on?'
]

export function Chat(): React.JSX.Element {
  const messages = useAppStore((s) => s.chatMessages)
  const setChatMessages = useAppStore((s) => s.setChatMessages)
  const addChatMessage = useAppStore((s) => s.addChatMessage)
  const setActiveProvider = useAppStore((s) => s.setActiveProvider)
  const setActiveModel = useAppStore((s) => s.setActiveModel)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!window.api) return
    window.api.getChatHistory().then(setChatMessages).catch(console.error)
    const unsubSchedule = window.api.onScheduleFired((payload) => {
      const p = payload as { message: string; response: { content: string; timestamp: string } }
      addChatMessage({ role: 'user', content: p.message, timestamp: new Date().toISOString() })
      addChatMessage({ role: 'assistant', content: p.response.content, timestamp: p.response.timestamp })
    })
    return unsubSchedule
  }, [setChatMessages, addChatMessage])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, sending])

  const addAssistantMsg = (content: string): void => {
    addChatMessage({ role: 'assistant', content, timestamp: new Date().toISOString() })
  }

  const send = async (text?: string): Promise<void> => {
    const msg = (text ?? input).trim()
    if (!msg || sending) return

    setInput('')

    const cmd = parseCommand(msg)
    if (cmd !== null) {
      switch (cmd.kind) {
        case 'new':
          if (!window.api) return
          await window.api.clearChat().catch(console.error)
          setChatMessages([])
          return

        case 'compact':
          addAssistantMsg('Conversation compaction is not yet available.')
          return

        case 'memory': {
          if (!window.api) return
          const mem = await window.api.readPermanentMemory().catch(() => null)
          if (!mem) { addAssistantMsg('Could not read permanent memory.'); return }
          addAssistantMsg(
            mem.content
              ? `**Permanent Memory** (${mem.path})\n\n${mem.content}`
              : `Permanent memory is empty. File: ${mem.path}`
          )
          return
        }

        case 'models': {
          if (!window.api) return
          addAssistantMsg('Fetching available models…')
          const result = await window.api.listModels(cmd.provider).catch(() => null)
          if (!result) { addAssistantMsg('Failed to fetch models.'); return }
          const grouped: Record<string, string[]> = {}
          for (const m of result.models) {
            if (!grouped[m.provider]) grouped[m.provider] = []
            grouped[m.provider].push(m.id)
          }
          const lines: string[] = []
          for (const [provider, ids] of Object.entries(grouped)) {
            lines.push(`**${provider}**`)
            for (const id of ids) lines.push(`  • ${id}`)
          }
          const errLines = Object.entries(result.errors).map(
            ([p, e]) => `⚠ ${p}: ${e}`
          )
          const content = lines.length
            ? lines.join('\n') + (errLines.length ? '\n\n' + errLines.join('\n') : '')
            : errLines.length
              ? errLines.join('\n')
              : 'No models available. Configure at least one AI provider in Settings.'
          addAssistantMsg(content)
          return
        }

        case 'model': {
          if (!window.api) return
          await window.api.setActiveModel(cmd.provider, cmd.model).catch(console.error)
          setActiveProvider(cmd.provider)
          setActiveModel(cmd.model)
          addAssistantMsg(`Active model set to **${cmd.provider}/${cmd.model}**.`)
          return
        }

        case 'schedule': {
          if (!window.api) return
          const result = await window.api
            .addSchedule({ scheduled_at: cmd.time, message: cmd.message })
            .catch(() => null)
          if (!result) { addAssistantMsg('Failed to schedule message.'); return }
          addAssistantMsg(`Scheduled message #${result.id} for ${cmd.time}.`)
          return
        }

        case 'commands':
          addAssistantMsg(
            'Available commands:\n' +
            '  /new — clear chat history\n' +
            '  /compact — compact conversation (stub)\n' +
            '  /memory — view permanent memory\n' +
            '  /models [provider] — list available models\n' +
            '  /model provider/model — set active model\n' +
            '  /schedule ISO-TIME message — schedule a message\n' +
            '  /commands — show this help'
          )
          return

        case 'unknown':
          addAssistantMsg(
            `Unknown command: \`${cmd.raw}\`. Type /commands for a list of available commands.`
          )
          return
      }
    }

    setSending(true)
    addChatMessage({ role: 'user', content: msg, timestamp: new Date().toISOString() })

    try {
      if (!window.api) throw new Error('API not available')
      const response = await window.api.sendMessage(msg)
      addChatMessage(response)
    } catch (err) {
      addChatMessage({
        role: 'assistant',
        content: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        timestamp: new Date().toISOString()
      })
    } finally {
      setSending(false)
    }
  }

  const onKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 shrink-0">
        <h1 className="text-sm font-semibold text-neutral-100">Chat</h1>
        <span className="text-xs text-neutral-700">
          <kbd className="font-mono">/commands</kbd> for help
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && !sending ? (
          <div className="flex flex-col items-center gap-6 mt-10">
            <div className="flex flex-col items-center gap-2">
              <MessageSquarePlus size={28} className="text-neutral-700" />
              <p className="text-sm text-neutral-600 text-center max-w-xs">
                Ask your agent anything about its strategy, performance, or current positions.
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-sm">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => send(prompt)}
                  className="text-left text-xs text-neutral-400 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 hover:text-neutral-300 rounded-lg px-3 py-2 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <div
                key={msg.id ?? i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[72%] px-3 py-2 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-emerald-500/20 text-emerald-50 rounded-br-sm'
                      : 'bg-neutral-800 text-neutral-200 rounded-bl-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {sending && <TypingIndicator />}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-neutral-800 shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Message your agent… (Enter to send, Shift+Enter for newline)"
            rows={1}
            className="flex-1 resize-none bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-600 no-drag"
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || sending}
            className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors no-drag shrink-0"
          >
            <Send size={15} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}

function TypingIndicator(): React.JSX.Element {
  return (
    <div className="flex justify-start">
      <div className="bg-neutral-800 rounded-xl rounded-bl-sm px-4 py-3">
        <div className="flex gap-1 items-center">
          <span className="w-1.5 h-1.5 rounded-full bg-neutral-500 animate-bounce [animation-delay:0ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-neutral-500 animate-bounce [animation-delay:150ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-neutral-500 animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  )
}
