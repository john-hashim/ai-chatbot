/**
 * Chunking Service for RAG Pipeline
 *
 * Handles:
 * 1. Text cleaning & noise reduction
 * 2. Semantic boundary detection
 * 3. Token-based chunking with overlap
 *
 * Each chunk becomes one vector row with metadata for citations.
 */

// ============================================
// CONSTANTS & CONFIGURATION
// ============================================

// Token estimation: ~4 characters per token for English text
// For production accuracy, install 'js-tiktoken': npm install js-tiktoken
const CHARS_PER_TOKEN = 4

// Chunking configuration by document type
const CHUNK_CONFIG = {
  'q&a': {
    maxTokens: 300, // Smaller chunks for Q&A
    minTokens: 50,
    overlapTokens: 30, // ~10% overlap
  },
  document: {
    maxTokens: 500, // Larger for documents
    minTokens: 100,
    overlapTokens: 75, // ~15% overlap
  },
  text: {
    maxTokens: 400,
    minTokens: 75,
    overlapTokens: 60,
  },
  website: {
    maxTokens: 450,
    minTokens: 100,
    overlapTokens: 70,
  },
} as const

type DocumentType = keyof typeof CHUNK_CONFIG

// ============================================
// TYPES
// ============================================

export interface ChunkMetadata {
  documentId: string
  source: string // filename or URL
  title: string // document title
  chunkIndex: number
  documentType: string
  subtype?: string
}

export interface ChunkResult {
  content: string // Cleaned chunk text
  position: number // Same as chunkIndex
  tokens: number
  metadata: ChunkMetadata
}

export interface DocumentInput {
  id: string
  name: string
  type: string
  subtype?: string | null
  content: string
  metadata?: {
    sourceUrl?: string
    title?: string
    [key: string]: unknown
  } | null
}

interface CleaningOptions {
  removePageNumbers?: boolean
  removeHeaders?: boolean
  removeNavigation?: boolean
  normalizeLegalText?: boolean
  fixOCRArtifacts?: boolean
}

interface TextSegment {
  content: string
  type: 'heading' | 'paragraph' | 'list' | 'code' | 'qa'
  level?: number
}

// ============================================
// TEXT CLEANING & NORMALIZATION
// ============================================

/**
 * Main cleaning function - applies all noise reduction
 */
export function cleanText(
  text: string,
  options: CleaningOptions = {}
): string {
  const {
    removePageNumbers = true,
    removeHeaders = true,
    removeNavigation = true,
    normalizeLegalText = true,
    fixOCRArtifacts = true,
  } = options

  let cleaned = text

  // 1. Normalize unicode and whitespace first
  cleaned = normalizeWhitespace(cleaned)

  // 2. Remove page numbers
  if (removePageNumbers) {
    cleaned = removePageNumberPatterns(cleaned)
  }

  // 3. Remove repeated headers/footers
  if (removeHeaders) {
    cleaned = removeRepeatedLines(cleaned)
  }

  // 4. Remove navigation patterns
  if (removeNavigation) {
    cleaned = removeNavigationPatterns(cleaned)
  }

  // 5. Normalize legal boilerplate
  if (normalizeLegalText) {
    cleaned = removeLegalBoilerplate(cleaned)
  }

  // 6. Fix OCR artifacts
  if (fixOCRArtifacts) {
    cleaned = fixOCRErrors(cleaned)
  }

  // Final whitespace cleanup
  cleaned = normalizeWhitespace(cleaned)

  return cleaned.trim()
}

/**
 * Normalize whitespace: collapse multiple spaces/newlines
 */
function normalizeWhitespace(text: string): string {
  return (
    text
      // Normalize line endings
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Remove null bytes and control characters (except newlines/tabs)
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Collapse multiple spaces to single space
      .replace(/[^\S\n]+/g, ' ')
      // Collapse 3+ newlines to 2 (preserve paragraph breaks)
      .replace(/\n{3,}/g, '\n\n')
      // Remove spaces at start/end of lines
      .replace(/^ +| +$/gm, '')
  )
}

/**
 * Remove common page number patterns
 */
function removePageNumberPatterns(text: string): string {
  const pagePatterns = [
    /^Page \d+ of \d+$/gim,
    /^Page \d+$/gim,
    /^- ?\d+ ?-$/gm,
    /^\d+\s*$/gm, // Standalone numbers on their own line
    /^p\.\s*\d+$/gim,
    /^\[\d+\]$/gm,
    /^— \d+ —$/gm,
  ]

  let cleaned = text
  for (const pattern of pagePatterns) {
    cleaned = cleaned.replace(pattern, '')
  }
  return cleaned
}

/**
 * Detect and remove repeated lines (headers/footers)
 * Lines that appear 3+ times are likely headers/footers
 */
function removeRepeatedLines(text: string): string {
  const lines = text.split('\n')
  const lineCounts = new Map<string, number>()

  // Count occurrences of each line (normalized)
  for (const line of lines) {
    const normalized = line.trim().toLowerCase()
    if (normalized.length > 5 && normalized.length < 200) {
      lineCounts.set(normalized, (lineCounts.get(normalized) || 0) + 1)
    }
  }

  // Find lines that appear 3+ times (likely headers/footers)
  const repeatedLines = new Set<string>()
  for (const [line, count] of lineCounts) {
    if (count >= 3) {
      repeatedLines.add(line)
    }
  }

  // Filter out repeated lines
  return lines
    .filter((line) => !repeatedLines.has(line.trim().toLowerCase()))
    .join('\n')
}

/**
 * Remove navigation patterns common in web content
 */
function removeNavigationPatterns(text: string): string {
  const navPatterns = [
    // Menu-like patterns: "Home | About | Contact"
    /^[\w\s]+(\s*[|•·]\s*[\w\s]+){2,}$/gm,
    // Breadcrumbs: "Home > Products > Category"
    /^[\w\s]+(\s*[>»›]\s*[\w\s]+){2,}$/gm,
    // Skip to content links
    /^skip to (main )?content$/gim,
    // Cookie notices
    /^(we use cookies|this site uses cookies|accept cookies).*$/gim,
    // Social media links
    /^(follow us on|share on|like us on)\s*(facebook|twitter|linkedin|instagram)/gim,
    // Copyright lines (but keep substantive legal text)
    /^©?\s*\d{4}(\s*[-–]\s*\d{4})?\s+[\w\s,]+\.?\s*(all rights reserved\.?)?$/gim,
  ]

  let cleaned = text
  for (const pattern of navPatterns) {
    cleaned = cleaned.replace(pattern, '')
  }
  return cleaned
}

/**
 * Remove or normalize legal boilerplate
 */
function removeLegalBoilerplate(text: string): string {
  const legalPatterns = [
    // Repeated disclaimers
    /^(disclaimer|legal notice|terms of use|privacy policy):?\s*$/gim,
    // Generic "for more information" footers
    /^for more information,?\s*(please\s*)?(visit|contact|see).*$/gim,
    // Auto-generated timestamps
    /^(last updated|last modified|date modified):?\s*\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/gim,
  ]

  let cleaned = text
  for (const pattern of legalPatterns) {
    cleaned = cleaned.replace(pattern, '')
  }
  return cleaned
}

/**
 * Fix common OCR errors
 */
function fixOCRErrors(text: string): string {
  return (
    text
      // Fix ligature issues
      .replace(/ﬁ/g, 'fi')
      .replace(/ﬂ/g, 'fl')
      .replace(/ﬀ/g, 'ff')
      // Remove zero-width characters
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      // Fix common character substitutions (be conservative)
      .replace(/\bI\s+([a-z])/g, 'I$1') // "I t" -> "It" (common OCR issue)
  )
}

// ============================================
// SEMANTIC BOUNDARY DETECTION
// ============================================

/**
 * Detect semantic boundaries in text
 */
function detectSemanticBoundaries(text: string): TextSegment[] {
  const segments: TextSegment[] = []
  const lines = text.split('\n')

  let currentParagraph: string[] = []
  let inCodeBlock = false

  for (const line of lines) {
    const trimmedLine = line.trim()

    // Skip empty lines (they separate paragraphs)
    if (!trimmedLine) {
      if (currentParagraph.length > 0) {
        segments.push({
          content: currentParagraph.join('\n'),
          type: 'paragraph',
        })
        currentParagraph = []
      }
      continue
    }

    // Detect code blocks
    if (trimmedLine.startsWith('```')) {
      inCodeBlock = !inCodeBlock
      if (!inCodeBlock && currentParagraph.length > 0) {
        segments.push({
          content: currentParagraph.join('\n'),
          type: 'code',
        })
        currentParagraph = []
      }
      continue
    }

    if (inCodeBlock) {
      currentParagraph.push(line)
      continue
    }

    // Detect headings (Markdown style or ALL CAPS short lines)
    const headingMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/)
    if (headingMatch) {
      // Save current paragraph first
      if (currentParagraph.length > 0) {
        segments.push({
          content: currentParagraph.join('\n'),
          type: 'paragraph',
        })
        currentParagraph = []
      }

      segments.push({
        content: headingMatch[2]!,
        type: 'heading',
        level: headingMatch[1]!.length,
      })
      continue
    }

    // Detect ALL CAPS headings (common in PDFs)
    if (
      trimmedLine === trimmedLine.toUpperCase() &&
      trimmedLine.length > 3 &&
      trimmedLine.length < 100 &&
      /^[A-Z\s\d]+$/.test(trimmedLine)
    ) {
      if (currentParagraph.length > 0) {
        segments.push({
          content: currentParagraph.join('\n'),
          type: 'paragraph',
        })
        currentParagraph = []
      }

      segments.push({
        content: trimmedLine,
        type: 'heading',
        level: 2,
      })
      continue
    }

    // Detect list items
    if (/^[-*•]\s+/.test(trimmedLine) || /^\d+[.)]\s+/.test(trimmedLine)) {
      currentParagraph.push(trimmedLine)
      continue
    }

    // Regular paragraph content
    currentParagraph.push(trimmedLine)
  }

  // Don't forget the last paragraph
  if (currentParagraph.length > 0) {
    segments.push({
      content: currentParagraph.join('\n'),
      type: inCodeBlock ? 'code' : 'paragraph',
    })
  }

  return segments
}

// ============================================
// TOKEN-BASED CHUNKING
// ============================================

/**
 * Estimate token count
 * For production accuracy: npm install js-tiktoken
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN)
}

/**
 * Split text into chunks respecting semantic boundaries
 */
function chunkWithOverlap(
  segments: TextSegment[],
  config: (typeof CHUNK_CONFIG)[DocumentType],
  baseMetadata: Omit<ChunkMetadata, 'chunkIndex'>
): ChunkResult[] {
  const { maxTokens, minTokens, overlapTokens } = config
  const chunks: ChunkResult[] = []

  let currentChunk: string[] = []
  let currentTokens = 0
  let position = 0

  for (const segment of segments) {
    const segmentTokens = estimateTokens(segment.content)

    // If segment alone exceeds max, we need to split it
    if (segmentTokens > maxTokens) {
      // Save current chunk first
      if (currentChunk.length > 0) {
        const content = currentChunk.join('\n\n')
        chunks.push({
          content,
          position,
          tokens: currentTokens,
          metadata: { ...baseMetadata, chunkIndex: position },
        })
        position++
        currentChunk = []
        currentTokens = 0
      }

      // Split large segment by sentences
      const sentenceChunks = splitBySentences(
        segment.content,
        maxTokens,
        overlapTokens,
        baseMetadata,
        position
      )
      for (const sentenceChunk of sentenceChunks) {
        chunks.push(sentenceChunk)
        position++
      }
      continue
    }

    // Check if adding this segment would exceed max
    if (currentTokens + segmentTokens > maxTokens && currentChunk.length > 0) {
      // Save current chunk
      const content = currentChunk.join('\n\n')
      chunks.push({
        content,
        position,
        tokens: currentTokens,
        metadata: { ...baseMetadata, chunkIndex: position },
      })
      position++

      // Start new chunk with overlap from previous
      const overlap = getOverlapContent(currentChunk, overlapTokens)
      currentChunk = overlap ? [overlap] : []
      currentTokens = overlap ? estimateTokens(overlap) : 0
    }

    // Add segment to current chunk
    if (segment.type === 'heading') {
      currentChunk.push(`## ${segment.content}`)
    } else {
      currentChunk.push(segment.content)
    }
    currentTokens += segmentTokens
  }

  // Handle the last chunk
  if (currentChunk.length > 0 && currentTokens >= minTokens) {
    const content = currentChunk.join('\n\n')
    chunks.push({
      content,
      position,
      tokens: currentTokens,
      metadata: { ...baseMetadata, chunkIndex: position },
    })
  } else if (currentChunk.length > 0 && chunks.length > 0) {
    // If last chunk is too small, merge with previous
    const lastChunk = chunks[chunks.length - 1]!
    lastChunk.content += '\n\n' + currentChunk.join('\n\n')
    lastChunk.tokens += currentTokens
  } else if (currentChunk.length > 0) {
    // Only chunk, even if small
    const content = currentChunk.join('\n\n')
    chunks.push({
      content,
      position,
      tokens: currentTokens,
      metadata: { ...baseMetadata, chunkIndex: position },
    })
  }

  return chunks
}

/**
 * Split text by sentences when a single segment is too large
 */
function splitBySentences(
  text: string,
  maxTokens: number,
  overlapTokens: number,
  baseMetadata: Omit<ChunkMetadata, 'chunkIndex'>,
  startPosition: number
): ChunkResult[] {
  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text]
  const chunks: ChunkResult[] = []

  let currentChunk: string[] = []
  let currentTokens = 0
  let position = startPosition

  for (const sentence of sentences) {
    const sentenceTokens = estimateTokens(sentence)

    if (currentTokens + sentenceTokens > maxTokens && currentChunk.length > 0) {
      const content = currentChunk.join(' ').trim()
      chunks.push({
        content,
        position,
        tokens: currentTokens,
        metadata: { ...baseMetadata, chunkIndex: position },
      })
      position++

      // Get overlap sentences
      const overlapSentences: string[] = []
      let overlapCount = 0
      for (let i = currentChunk.length - 1; i >= 0 && overlapCount < overlapTokens; i--) {
        const chunk = currentChunk[i]!
        overlapSentences.unshift(chunk)
        overlapCount += estimateTokens(chunk)
      }

      currentChunk = overlapSentences
      currentTokens = overlapCount
    }

    currentChunk.push(sentence.trim())
    currentTokens += sentenceTokens
  }

  if (currentChunk.length > 0) {
    const content = currentChunk.join(' ').trim()
    chunks.push({
      content,
      position,
      tokens: currentTokens,
      metadata: { ...baseMetadata, chunkIndex: position },
    })
  }

  return chunks
}

/**
 * Get overlap content from the end of previous chunk
 */
function getOverlapContent(chunks: string[], overlapTokens: number): string | null {
  if (chunks.length === 0) return null

  const lastContent = chunks[chunks.length - 1]!
  const sentences = lastContent.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [lastContent]

  const overlapSentences: string[] = []
  let tokenCount = 0

  for (let i = sentences.length - 1; i >= 0 && tokenCount < overlapTokens; i--) {
    const sentence = sentences[i]!
    overlapSentences.unshift(sentence.trim())
    tokenCount += estimateTokens(sentence)
  }

  return overlapSentences.length > 0 ? overlapSentences.join(' ') : null
}

// ============================================
// Q&A SPECIFIC CHUNKING
// ============================================

/**
 * Chunk Q&A content - keep each Q&A pair together
 */
function chunkQandA(
  content: string,
  baseMetadata: Omit<ChunkMetadata, 'chunkIndex'>
): ChunkResult[] {
  const chunks: ChunkResult[] = []

  // Q&A format: "Questions:\n...\n\nAnswer:..."
  const qaPairs = content.split(/(?=Questions?:)/gi).filter((p) => p.trim())

  let position = 0
  for (const pair of qaPairs) {
    const cleaned = pair.trim()
    if (cleaned) {
      chunks.push({
        content: cleaned,
        position,
        tokens: estimateTokens(cleaned),
        metadata: { ...baseMetadata, chunkIndex: position },
      })
      position++
    }
  }

  return chunks
}

// ============================================
// MAIN ENTRY POINT
// ============================================

/**
 * Main function to process and chunk a document
 *
 * @param document - The document to chunk
 * @param cleaningOptions - Optional cleaning configuration
 * @returns Array of chunks ready for embedding
 *
 * @example
 * const chunks = chunkDocument({
 *   id: 'doc-123',
 *   name: 'manual.pdf',
 *   type: 'document',
 *   subtype: 'pdf',
 *   content: '...',
 *   metadata: { sourceUrl: 'https://...' }
 * });
 *
 * // Each chunk has:
 * // - content: cleaned text
 * // - position: chunk index
 * // - tokens: estimated token count
 * // - metadata: { documentId, source, title, chunkIndex, documentType, subtype }
 */
export function chunkDocument(
  document: DocumentInput,
  cleaningOptions?: CleaningOptions
): ChunkResult[] {
  // Step 1: Clean the text
  const cleanedText = cleanText(document.content, cleaningOptions)

  if (!cleanedText || cleanedText.length < 10) {
    return []
  }

  // Step 2: Build base metadata for all chunks
  const baseMetadata: Omit<ChunkMetadata, 'chunkIndex'> = {
    documentId: document.id,
    source: document.metadata?.sourceUrl || document.name,
    title: document.metadata?.title || document.name,
    documentType: document.type,
    ...(document.subtype && { subtype: document.subtype }),
  }

  // Step 3: Route to appropriate chunking strategy
  const docType =
    (document.type as DocumentType) in CHUNK_CONFIG
      ? (document.type as DocumentType)
      : 'document'

  // Q&A has special handling - keep pairs together
  if (docType === 'q&a') {
    return chunkQandA(cleanedText, baseMetadata)
  }

  // Step 4: Detect semantic boundaries
  const segments = detectSemanticBoundaries(cleanedText)

  // Step 5: Chunk with overlap
  const config = CHUNK_CONFIG[docType]
  return chunkWithOverlap(segments, config, baseMetadata)
}

/**
 * Utility to get chunk statistics
 */
export function getChunkStats(chunks: ChunkResult[]): {
  totalChunks: number
  avgTokens: number
  minTokens: number
  maxTokens: number
  totalTokens: number
} {
  if (chunks.length === 0) {
    return {
      totalChunks: 0,
      avgTokens: 0,
      minTokens: 0,
      maxTokens: 0,
      totalTokens: 0,
    }
  }

  const tokens = chunks.map((c) => c.tokens)
  const totalTokens = tokens.reduce((a, b) => a + b, 0)

  return {
    totalChunks: chunks.length,
    avgTokens: Math.round(totalTokens / chunks.length),
    minTokens: Math.min(...tokens),
    maxTokens: Math.max(...tokens),
    totalTokens,
  }
}
