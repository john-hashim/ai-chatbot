/**
 * Embedding Service
 *
 * Generates embeddings using Hugging Face's free inference API.
 * Model: BAAI/bge-small-en-v1.5 (384 dimensions)
 * Excellent for RAG applications.
 *
 * Get your free API token at: https://huggingface.co/settings/tokens
 */

const HF_API_URL = 'https://router.huggingface.co/hf-inference/models'
const EMBEDDING_MODEL = 'BAAI/bge-small-en-v1.5'
const EMBEDDING_DIMENSIONS = 384

// Batch size for embedding requests
const BATCH_SIZE = 32

export interface EmbeddingResult {
  embedding: number[]
  index: number
}

/**
 * Generate embedding for a single text
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.HUGGINGFACE_API_KEY
  if (!apiKey) {
    throw new Error('HUGGINGFACE_API_KEY environment variable is not set')
  }

  // BGE models recommend adding this prefix for retrieval tasks
  const prefixedText = `Represent this sentence for searching relevant passages: ${text}`

  const response = await fetch(`${HF_API_URL}/${EMBEDDING_MODEL}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      inputs: prefixedText,
      options: {
        wait_for_model: true, // Wait if model is loading
      },
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Hugging Face API error: ${response.status} - ${error}`)
  }

  const data = (await response.json()) as number[]

  // HF returns the embedding directly as an array
  return data
}

/**
 * Generate embeddings for multiple texts in batches
 * More efficient than calling () multiple times
 */
export async function generateEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
  const apiKey = process.env.HUGGINGFACE_API_KEY
  if (!apiKey) {
    throw new Error('HUGGINGFACE_API_KEY environment variable is not set')
  }

  if (texts.length === 0) {
    return []
  }

  const results: EmbeddingResult[] = []

  // Process in batches
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE)

    // BGE models recommend adding this prefix for retrieval tasks
    const prefixedBatch = batch.map(
      text => `Represent this sentence for searching relevant passages: ${text}`
    )

    const response = await fetch(`${HF_API_URL}/${EMBEDDING_MODEL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        inputs: prefixedBatch,
        options: {
          wait_for_model: true,
        },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Hugging Face API error: ${response.status} - ${error}`)
    }

    const data = (await response.json()) as number[][]

    // Map batch results back to original indices
    for (let j = 0; j < data.length; j++) {
      results.push({
        embedding: data[j]!,
        index: i + j,
      })
    }

    // Small delay between batches to avoid rate limiting
    if (i + BATCH_SIZE < texts.length) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  return results
}

/**
 * Get the embedding model info
 */
export function getEmbeddingConfig() {
  return {
    model: EMBEDDING_MODEL,
    dimensions: EMBEDDING_DIMENSIONS,
    batchSize: BATCH_SIZE,
  }
}
