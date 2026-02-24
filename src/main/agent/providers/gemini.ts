import { GoogleGenerativeAI } from '@google/generative-ai'

export interface AIMessage {
  role: 'user' | 'model'
  content: string
}

export interface AIResponse {
  content: string
  inputTokens?: number
  outputTokens?: number
}

export async function callGemini(
  apiKey: string,
  model: string,
  messages: AIMessage[]
): Promise<AIResponse> {
  const client = new GoogleGenerativeAI(apiKey)
  const genModel = client.getGenerativeModel({ model })

  const history = messages.slice(0, -1).map((m) => ({
    role: m.role,
    parts: [{ text: m.content }]
  }))

  const chat = genModel.startChat({ history })
  const lastMessage = messages.at(-1)
  if (!lastMessage) throw new Error('No messages provided')

  const result = await chat.sendMessage(lastMessage.content)
  const response = result.response

  return {
    content: response.text(),
    inputTokens: response.usageMetadata?.promptTokenCount,
    outputTokens: response.usageMetadata?.candidatesTokenCount
  }
}
