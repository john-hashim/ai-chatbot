/**
 * Training Service
 *
 * Orchestrates the document training pipeline:
 * 1. Fetch untrained documents
 * 2. Clean and chunk each document
 * 3. Generate embeddings for chunks
 * 4. Store chunks with embeddings in database
 * 5. Update document status
 */

import { prisma } from '../prisma/client.js'
import { chunkDocument, getChunkStats, type ChunkResult } from './chunking.service.js'
import { generateEmbeddings, getEmbeddingConfig } from './embedding.service.js'

export interface TrainingProgress {
  totalDocuments: number
  processedDocuments: number
  currentDocument: string | null
  totalChunks: number
  status: 'idle' | 'processing' | 'completed' | 'failed'
  error?: string
}

export interface TrainingResult {
  success: boolean
  documentsProcessed: number
  totalChunksCreated: number
  failedDocuments: string[]
  error?: string
}

/**
 * Train all untrained documents for a chatbot
 */
export async function trainChatbotDocuments(
  chatbotId: string,
  onProgress?: (progress: TrainingProgress) => void
): Promise<TrainingResult> {
  const progress: TrainingProgress = {
    totalDocuments: 0,
    processedDocuments: 0,
    currentDocument: null,
    totalChunks: 0,
    status: 'idle',
  }

  const result: TrainingResult = {
    success: true,
    documentsProcessed: 0,
    totalChunksCreated: 0,
    failedDocuments: [],
  }

  try {
    // Step 1: Get all untrained or failed documents for this chatbot
    const untrainedDocuments = await prisma.document.findMany({
      where: {
        chatbotId,
        status: { in: ['untrained', 'failed'] },
      },
      orderBy: { uploadedAt: 'asc' },
    })

    if (untrainedDocuments.length === 0) {
      progress.status = 'completed'
      onProgress?.(progress)
      return result
    }

    progress.totalDocuments = untrainedDocuments.length
    progress.status = 'processing'
    onProgress?.(progress)

    // Step 2: Process each document
    for (const document of untrainedDocuments) {
      progress.currentDocument = document.name
      onProgress?.(progress)

      try {
        // Step 2a: Chunk the document
        const chunks = chunkDocument({
          id: document.id,
          name: document.name,
          type: document.type,
          subtype: document.subtype,
          content: document.content,
          metadata: document.metadata as { sourceUrl?: string; title?: string } | null,
        })

        if (chunks.length === 0) {
          // Document has no meaningful content, mark as trained anyway
          await prisma.document.update({
            where: { id: document.id },
            data: { status: 'trained' },
          })
          progress.processedDocuments++
          result.documentsProcessed++
          onProgress?.(progress)
          continue
        }

        // Log chunk stats for debugging
        const stats = getChunkStats(chunks)
        console.log(
          `Document "${document.name}": ${stats.totalChunks} chunks, avg ${stats.avgTokens} tokens`
        )

        // Step 2b: Generate embeddings for all chunks
        const chunkTexts = chunks.map((chunk) => chunk.content)
        const embeddingResults = await generateEmbeddings(chunkTexts)

        // Step 2c: Store chunks with embeddings in database
        await storeChunksWithEmbeddings(document.id, chunks, embeddingResults)

        // Step 2d: Update document status to trained
        await prisma.document.update({
          where: { id: document.id },
          data: { status: 'trained' },
        })

        progress.processedDocuments++
        progress.totalChunks += chunks.length
        result.documentsProcessed++
        result.totalChunksCreated += chunks.length
        onProgress?.(progress)
      } catch (docError) {
        // Mark document as failed but continue with others
        console.error(`Failed to process document "${document.name}":`, docError)

        await prisma.document.update({
          where: { id: document.id },
          data: { status: 'failed' },
        })

        result.failedDocuments.push(document.name)
        progress.processedDocuments++
        onProgress?.(progress)
      }
    }

    progress.status = 'completed'
    progress.currentDocument = null
    onProgress?.(progress)

    result.success = result.failedDocuments.length === 0

    return result
  } catch (error) {
    progress.status = 'failed'
    progress.error = error instanceof Error ? error.message : 'Unknown error'
    onProgress?.(progress)

    result.success = false
    result.error = progress.error

    return result
  }
}

/**
 * Store chunks with embeddings in database using raw SQL for vector type
 */
async function storeChunksWithEmbeddings(
  documentId: string,
  chunks: ChunkResult[],
  embeddings: { embedding: number[]; index: number }[]
): Promise<void> {
  const { dimensions } = getEmbeddingConfig()

  // Delete existing chunks for this document (in case of re-training)
  await prisma.documentChunk.deleteMany({
    where: { documentId },
  })

  // Insert chunks with embeddings using raw SQL
  // Prisma doesn't support vector type directly, so we use $executeRaw
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]!
    const embedding = embeddings.find((e) => e.index === i)?.embedding

    if (!embedding) {
      throw new Error(`Missing embedding for chunk ${i}`)
    }

    // Validate embedding dimensions
    if (embedding.length !== dimensions) {
      throw new Error(
        `Invalid embedding dimensions: expected ${dimensions}, got ${embedding.length}`
      )
    }

    // Convert embedding array to PostgreSQL vector format
    const vectorString = `[${embedding.join(',')}]`

    // Generate a unique ID for the chunk
    const chunkId = generateCuid()

    await prisma.$executeRaw`
      INSERT INTO "DocumentChunk" (
        "id",
        "documentId",
        "content",
        "embedding",
        "position",
        "tokens",
        "metadata",
        "createdAt"
      ) VALUES (
        ${chunkId},
        ${documentId},
        ${chunk.content},
        ${vectorString}::vector,
        ${chunk.position},
        ${chunk.tokens},
        ${JSON.stringify(chunk.metadata)}::jsonb,
        NOW()
      )
    `
  }
}

/**
 * Get training status for a chatbot
 */
export async function getTrainingStatus(chatbotId: string) {
  const documents = await prisma.document.findMany({
    where: { chatbotId },
    select: { id: true, name: true, status: true },
  })

  const totalDocuments = documents.length
  const trainedDocuments = documents.filter((d) => d.status === 'trained').length
  const untrainedDocuments = documents.filter((d) => d.status === 'untrained').length
  const failedDocuments = documents.filter((d) => d.status === 'failed').length

  const totalChunks = await prisma.documentChunk.count({
    where: {
      document: { chatbotId },
    },
  })

  return {
    totalDocuments,
    trainedDocuments,
    untrainedDocuments,
    failedDocuments,
    totalChunks,
    isFullyTrained: untrainedDocuments === 0 && failedDocuments === 0,
    documents: documents.map((d) => ({ id: d.id, name: d.name, status: d.status })),
  }
}

/**
 * Simple CUID generator (subset of cuid functionality)
 */
function generateCuid(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 10)
  const randomPart2 = Math.random().toString(36).substring(2, 10)
  return `c${timestamp}${randomPart}${randomPart2}`
}
