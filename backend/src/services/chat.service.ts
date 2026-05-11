/**
 * Chat Service
 *
 * Handles RAG (Retrieval-Augmented Generation) for chatbot conversations:
 * 1. Vector search for relevant document chunks
 * 2. LLM response streaming via OpenRouter SDK
 */

import { OpenRouter } from '@openrouter/sdk'
import { prisma } from '../prisma/client.js'
import { generateEmbedding } from './embedding.service.js'
import { resolveModel, DEFAULT_MODEL_ID } from '../constants/models.js'

export const ACTIVE_MODEL = DEFAULT_MODEL_ID
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

type ChatMessages = { role: 'system' | 'user' | 'assistant'; content: string }[]

function openRouterClient(): OpenRouter {
  return new OpenRouter({ apiKey: process.env.OPENROUTER_API_KEY })
}

interface StreamLLMParams {
  message: string
  context: string
  chatHistory?: { role: string; content: string }[]
  systemInstruction: string
  modelId?: string | null | undefined
  onToken: (token: string) => void
  onComplete: () => Promise<void>
  onError: (error: Error) => Promise<void>
}

/**
 * Map provider/SDK errors to a short, user-safe message. Falls back to a
 * generic line so we never leak internals (api keys, stack traces, etc.).
 */
export function humanizeChatError(error: unknown): string {
  const name = (error as { name?: string } | null)?.name ?? ''
  switch (name) {
    case 'TooManyRequestsResponseError':
      return 'The AI service is rate-limiting requests right now. Please wait a moment and try again.'
    case 'PaymentRequiredResponseError':
      return 'The AI service is out of credits. Please contact the chatbot owner.'
    case 'UnauthorizedResponseError':
    case 'ForbiddenResponseError':
      return 'The AI service rejected the request. Please contact the chatbot owner.'
    case 'NotFoundResponseError':
      return 'The selected AI model is unavailable. Please choose a different model in settings.'
    case 'RequestTimeoutResponseError':
    case 'EdgeNetworkTimeoutResponseError':
      return 'The AI service timed out. Please try again.'
    case 'ProviderOverloadedResponseError':
    case 'ServiceUnavailableResponseError':
    case 'BadGatewayResponseError':
      return 'The AI service is temporarily overloaded. Please try again in a moment.'
    case 'BadRequestResponseError':
    case 'UnprocessableEntityResponseError':
      return 'The selected model could not process this message. Try rephrasing or switching models.'
    case 'InternalServerResponseError':
      return 'The AI service encountered an internal error. Please try again.'
    default:
      return 'Something went wrong while generating the response. Please try again.'
  }
}

export const EMPTY_RESPONSE_FALLBACK =
  "I couldn't generate a response for that. Try rephrasing your question or switching to a different model in settings."

/**
 * Stream an LLM response via OpenRouter. Model is resolved from the registry;
 * unknown ids fall back to DEFAULT_MODEL_ID.
 */
export async function streamLLMResponse({
  message,
  context,
  chatHistory = [],
  systemInstruction,
  modelId,
  onToken,
  onComplete,
  onError,
}: StreamLLMParams): Promise<void> {
  const systemContent = context
    ? `${systemInstruction}\n\nBelow is context retrieved from the knowledge base. Use it to answer the user's question. If the context doesn't contain relevant information, say so honestly.\n\nContext:\n${context}`
    : `${systemInstruction}\n\nNo relevant context was found in the knowledge base for this question. Let the user know you couldn't find specific information in the documents, but still try to be helpful within your role.`

  const messages: ChatMessages = [
    { role: 'system', content: systemContent },
    ...chatHistory.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
    { role: 'user', content: message },
  ]

  const model = resolveModel(modelId)

  try {
    const stream = await openRouterClient().chat.send({
      httpReferer: process.env.OPENROUTER_SITE_URL,
      appTitle: process.env.OPENROUTER_SITE_NAME,
      chatRequest: {
        model: model.id,
        messages,
        maxTokens: 2000,
        temperature: 0.7,
        stream: true,
        provider: { sort: 'throughput' },
      },
    })

    for await (const chunk of stream) {
      const token = chunk.choices?.[0]?.delta?.content
      if (!token) continue
      const words = token.split(/(\s+)/)
      for (const word of words) {
        if (!word) continue
        await new Promise(r => setTimeout(r, 20))
        onToken(word)
      }
    }

    await onComplete()
  } catch (error) {
    await onError(error instanceof Error ? error : new Error(String(error)))
  }
}

interface ChatCompletionParams {
  modelId?: string | null | undefined
  messages: ChatMessages
  maxTokens?: number
  temperature?: number
  jsonMode?: boolean
}

/**
 * Non-streaming chat completion via OpenRouter. Used by the booking
 * classifier and any other server-side LLM call that just needs a string back.
 */
export async function chatCompletion({
  modelId,
  messages,
  maxTokens = 256,
  temperature = 0,
  jsonMode = false,
}: ChatCompletionParams): Promise<string> {
  const model = resolveModel(modelId)

  const result = await openRouterClient().chat.send({
    httpReferer: process.env.OPENROUTER_SITE_URL,
    appTitle: process.env.OPENROUTER_SITE_NAME,
    chatRequest: {
      model: model.id,
      messages,
      maxTokens,
      temperature,
      stream: false,
      provider: { sort: 'throughput' },
      ...(jsonMode ? { responseFormat: { type: 'json_object' as const } } : {}),
    },
  })

  // Non-streaming returns ChatResult, not an EventStream — narrow the union.
  if ('choices' in result) {
    const content = result.choices[0]?.message?.content
    return typeof content === 'string' ? content : ''
  }
  return ''
}

export { generateEmbedding }
