// OpenRouter uses the OpenAI SDK with a custom base URL + site headers.
// Provides access to 300+ models via a single API key.
import OpenAI from 'openai'
import type { AIMessage, AIResponse } from './gemini'

export async function callOpenRouter(
  apiKey: string,
  model: string,
  messages: AIMessage[]
): Promise<AIResponse> {
  const client = new OpenAI({
    apiKey,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': 'https://tradent.dev',
      'X-Title': 'Tradent'
    }
  })

  const completion = await client.chat.completions.create({
    model,
    messages: messages.map((m) => ({
      role: m.role === 'model' ? 'assistant' : m.role,
      content: m.content
    }))
  })

  const choice = completion.choices[0]
  if (!choice?.message?.content) throw new Error('Empty response from OpenRouter')

  return {
    content: choice.message.content,
    inputTokens: completion.usage?.prompt_tokens,
    outputTokens: completion.usage?.completion_tokens
  }
}
