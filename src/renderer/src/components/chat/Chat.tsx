import { useState, useEffect, useRef } from 'react'
import { Send } from 'lucide-react'
import { useAppStore } from '../../store'

export function Chat(): React.JSX.Element {
  const messages = useAppStore((s) => s.chatMessages)
  const setChatMessages = useAppStore((s) => s.setChatMessages)
  const addChatMessage = useAppStore((s) => s.addChatMessage)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!window.api) return
    window.api.getChatHistory().then(setChatMessages).catch(console.error)
  }, [setChatMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const send = async (): Promise<void> => {
    const text = input.trim()
    if (!text || sending) return

    setInput('')
    setSending(true)
    addChatMessage({ role: 'user', content: text, timestamp: new Date().toISOString() })

    try {
      const response = await window.api.sendMessage(text)
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
      <div className="px-4 py-3 border-b border-neutral-800 shrink-0">
        <h1 className="text-sm font-semibold text-neutral-100">Chat</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <p className="text-neutral-700 text-sm text-center mt-8">
            Ask your agent anything about its performance, strategy, or current positions.
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={msg.id ?? i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-emerald-500/20 text-emerald-50 rounded-br-sm'
                  : 'bg-neutral-800 text-neutral-200 rounded-bl-sm'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-3 border-t border-neutral-800 shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Message your agent… (Enter to send)"
            rows={1}
            className="flex-1 resize-none bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-600 no-drag"
          />
          <button
            onClick={send}
            disabled={!input.trim() || sending}
            className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors no-drag"
          >
            <Send size={15} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}
