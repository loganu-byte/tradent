import OpenAI from 'openai'
import type { AIMessage, AIResponse } from './gemini'

export async function callOpenAI(
  apiKey: string,
  model: string,
  messages: AIMessage[]
): Promise<AIResponse> {
  const client = new OpenAI({ apiKey })

  const completion = await client.chat.completions.create({
    model,
    messages: messages.map((m) => ({
      role: m.role === 'model' ? 'assistant' : m.role,
      content: m.content
    }))
  })

  const choice = completion.choices[0]
  if (!choice?.message?.content) throw new Error('Empty response from OpenAI')

  return {
    content: choice.message.content,
    inputTokens: completion.usage?.prompt_tokens,
    outputTokens: completion.usage?.completion_tokens
  }
}
