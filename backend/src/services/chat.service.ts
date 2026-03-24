/**
 * Chat Service
 *
 * Handles RAG (Retrieval-Augmented Generation) for chatbot conversations:
 * 1. Vector search for relevant document chunks
 * 2. LLM response streaming via Hugging Face Inference API or Groq
 */

import { InferenceClient } from '@huggingface/inference'
import { prisma } from '../prisma/client.js'
import { generateEmbedding } from './embedding.service.js'

const USE_GROQ = process.env.USE_GROQ === 'true'

const LLM_MODEL = 'meta-llama/Llama-3.1-8B-Instruct'
// const GROQ_MODEL = 'gemma2-9b-it'
const GROQ_MODEL = 'llama-3.3-70b-versatile'
export const ACTIVE_MODEL = USE_GROQ ? GROQ_MODEL : LLM_MODEL
const SIMILARITY_THRESHOLD = 0.4
const MAX_CONTEXT_CHARS = 4000

export interface RelevantChunk {
  content: string
  similarity: number
  documentId: string
}

/**
 * Search for relevant document chunks using pgvector cosine distance
 */
export async function searchRelevantChunks(
  chatbotId: string,
  queryEmbedding: number[],
  limit = 5
): Promise<RelevantChunk[]> {
  const vectorString = `[${queryEmbedding.join(',')}]`

  const results = await prisma.$queryRawUnsafe<
    { content: string; similarity: number; documentId: string }[]
  >(
    `SELECT dc."content", 1 - (dc."embedding" <=> $1::vector) AS similarity, dc."documentId"
     FROM "DocumentChunk" dc
     JOIN "Document" d ON dc."documentId" = d."id"
     WHERE d."chatbotId" = $2
     ORDER BY dc."embedding" <=> $1::vector
     LIMIT $3`,
    vectorString,
    chatbotId,
    limit
  )

  return results.filter(r => r.similarity > SIMILARITY_THRESHOLD)
}

/**
 * Build a size-capped context string from relevant chunks
 */
export function buildContext(chunks: RelevantChunk[]): string {
  let context = ''
  for (const chunk of chunks) {
    if (context.length + chunk.content.length > MAX_CONTEXT_CHARS) break
    context += (context ? '\n\n---\n\n' : '') + chunk.content
  }
  return context
}

interface StreamLLMParams {
  message: string
  context: string
  chatHistory?: { role: string; content: string }[]
  systemInstruction: string
  onToken: (token: string) => void
  onComplete: () => Promise<void>
  onError: (error: Error) => Promise<void>
}

/**
 * Stream an LLM response using Hugging Face or Groq based on USE_GROQ env var
 */
export async function streamLLMResponse({
  message,
  context,
  chatHistory = [],
  systemInstruction,
  onToken,
  onComplete,
  onError,
}: StreamLLMParams): Promise<void> {
  const systemContent = context
    ? `${systemInstruction}\n\nBelow is context retrieved from the knowledge base. Use it to answer the user's question. If the context doesn't contain relevant information, say so honestly.\n\nContext:\n${context}`
    : `${systemInstruction}\n\nNo relevant context was found in the knowledge base for this question. Let the user know you couldn't find specific information in the documents, but still try to be helpful within your role.`

  const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
    {
      role: 'system',
      content: systemContent,
    },
    ...chatHistory.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
    { role: 'user', content: message },
  ]

  if (USE_GROQ) {
    await streamGroqResponse({ messages, onToken, onComplete, onError })
  } else {
    await streamHFResponse({ messages, onToken, onComplete, onError })
  }
}

interface StreamHFParams {
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[]
  onToken: (token: string) => void
  onComplete: () => Promise<void>
  onError: (error: Error) => Promise<void>
}

async function streamHFResponse({
  messages,
  onToken,
  onComplete,
  onError,
}: StreamHFParams): Promise<void> {
  const apiKey = process.env.HUGGINGFACE_API_KEY
  if (!apiKey) {
    await onError(new Error('HUGGINGFACE_API_KEY environment variable is not set'))
    return
  }

  const hf = new InferenceClient(apiKey)
  const MAX_RETRIES = 2

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const stream = hf.chatCompletionStream({
        model: LLM_MODEL,
        messages,
        max_tokens: 512,
        temperature: 0.7,
        top_p: 0.95,
      })

      for await (const chunk of stream) {
        const token = chunk.choices?.[0]?.delta?.content
        if (token) {
          const words = token.split(/(\s+)/)
          for (const word of words) {
            if (!word) continue
            await new Promise(r => setTimeout(r, 20))
            onToken(word)
          }
        }
      }

      await onComplete()
      return
    } catch (error) {
      if (attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, 1000))
      } else {
        await onError(error instanceof Error ? error : new Error(String(error)))
      }
    }
  }
}

interface StreamGroqParams {
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[]
  onToken: (token: string) => void
  onComplete: () => Promise<void>
  onError: (error: Error) => Promise<void>
}

async function streamGroqResponse({
  messages,
  onToken,
  onComplete,
  onError,
}: StreamGroqParams): Promise<void> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    await onError(new Error('GROQ_API_KEY environment variable is not set'))
    return
  }
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        max_tokens: 512,
        temperature: 0.7,
        stream: true,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      await onError(new Error(`Groq API error: ${response.status} - ${error}`))
      return
    }

    if (!response.body) {
      await onError(new Error('Groq response body is null'))
      return
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') {
            await onComplete()
            return
          }
          try {
            const parsed = JSON.parse(data)
            const token = parsed.choices?.[0]?.delta?.content
            if (token) {
              const words = token.split(/(\s+)/)
              for (const word of words) {
                if (!word) continue
                await new Promise(r => setTimeout(r, 20))
                onToken(word)
              }
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }
    }

    await onComplete()
  } catch (error) {
    await onError(error instanceof Error ? error : new Error(String(error)))
  }
}

export { generateEmbedding }
