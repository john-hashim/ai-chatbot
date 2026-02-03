/**
 * Chat Service
 *
 * Handles RAG (Retrieval-Augmented Generation) for chatbot conversations:
 * 1. Vector search for relevant document chunks
 * 2. LLM response streaming via Hugging Face Inference API
 */

import { InferenceClient } from '@huggingface/inference'
import { prisma } from '../prisma/client.js'
import { generateEmbedding } from './embedding.service.js'

const LLM_MODEL = 'meta-llama/Llama-3.1-8B-Instruct'

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

  return results
}

interface StreamLLMParams {
  message: string
  context: string
  chatHistory?: { role: string; content: string }[]
  onToken: (token: string) => void
  onComplete: () => void
  onError: (error: Error) => void
}

/**
 * Stream an LLM response using @huggingface/inference chatCompletionStream
 */
export async function streamLLMResponse({
  message,
  context,
  chatHistory = [],
  onToken,
  onComplete,
  onError,
}: StreamLLMParams): Promise<void> {
  const apiKey = process.env.HUGGINGFACE_API_KEY
  if (!apiKey) {
    onError(new Error('HUGGINGFACE_API_KEY environment variable is not set'))
    return
  }

  const hf = new InferenceClient(apiKey)

  const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
    {
      role: 'system',
      content: `You are a helpful assistant. Answer the user's question based on the following context from the knowledge base. If the context doesn't contain relevant information, say so honestly but still try to be helpful.\n\nContext:\n${context}`,
    },
    ...chatHistory.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
    { role: 'user', content: message },
  ]

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
        onToken(token)
      }
    }

    onComplete()
  } catch (error) {
    onError(error instanceof Error ? error : new Error(String(error)))
  }
}

export { generateEmbedding }
