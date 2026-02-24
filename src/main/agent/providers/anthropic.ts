import Anthropic from '@anthropic-ai/sdk'
import type { AIMessage, AIResponse } from './gemini'

export async function callAnthropic(
  apiKey: string,
  model: string,
  messages: AIMessage[]
): Promise<AIResponse> {
  const client = new Anthropic({ apiKey })

  const response = await client.messages.create({
    model,
    max_tokens: 8096,
    messages: messages.map((m) => ({
      role: m.role === 'model' ? 'assistant' : m.role,
      content: m.content
    }))
  })

  const block = response.content[0]
  if (!block || block.type !== 'text') throw new Error('Unexpected response type from Anthropic')

  return {
    content: block.text,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens
  }
}
