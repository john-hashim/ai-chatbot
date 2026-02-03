import type { Request, Response, NextFunction } from 'express'
import { Prisma } from '@prisma/client'
import { prisma } from '../prisma/client.js'
import { ApiStatus, type ApiResponse } from '../types/api.js'
import * as r2Service from '../services/r2.service.js'
import { PDFParse } from 'pdf-parse'
import mammoth from 'mammoth'
import WordExtractor from 'word-extractor'
import * as crawlerService from '../services/crawler.service.js'
import * as trainingService from '../services/training.service.js'
import * as chatService from '../services/chat.service.js'

export const createChatbot = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user

    const { name, appearance, brandColor, brandColorForHeader, profilePicture } = req.body

    const chatbot = await prisma.chatbot.create({
      data: {
        name: name.trim(),
        appearance: appearance || 'light',
        brandColor,
        brandColorForHeader: brandColorForHeader ?? false,
        profilePicture: profilePicture || null,
        userId: user.id,
        initialMessages: ['Hi! What can I help you with?'],
      },
    })

    res.status(201).json({
      status: ApiStatus.SUCCESS,
      data: chatbot,
      message: 'Chatbot created successfully',
    } satisfies ApiResponse)
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({
        status: ApiStatus.FAILURE,
        message: 'A chatbot with this name already exists',
      } satisfies ApiResponse)
    }
    next(error)
  }
}

export const updateChatbot = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user
    const { chatbotId } = req.params

    if (!chatbotId) {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'Chatbot ID is required',
      } satisfies ApiResponse)
    }

    // Verify ownership
    const existingChatbot = await prisma.chatbot.findUnique({
      where: { id: chatbotId, userId: user.id },
    })

    if (!existingChatbot) {
      return res.status(404).json({
        status: ApiStatus.FAILURE,
        message: 'Chatbot not found or you do not have permission',
      } satisfies ApiResponse)
    }

    const allowedFields = [
      'name',
      'appearance',
      'brandColor',
      'brandColorForHeader',
      'profilePicture',
      'initialMessages',
      'suggestedMessages',
      'showSuggestedAfterFirst',
      'messagePlaceholder',
      'dismissibleNotice',
      'footer',
      'autoshowDelaySeconds',
      'autoshowInitialPopup',
      'chatIcon',
      'chatBubbleButtonColor',
      'chatBubbleButtonPosition',
    ] as const

    const updateData: Record<string, unknown> = {}

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (field === 'name' && typeof req.body[field] === 'string') {
          updateData[field] = req.body[field].trim()
        } else {
          updateData[field] = req.body[field]
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'No valid fields provided for update',
      } satisfies ApiResponse)
    }

    const chatbot = await prisma.chatbot.update({
      where: { id: chatbotId },
      data: updateData,
    })

    res.status(200).json({
      status: ApiStatus.SUCCESS,
      data: chatbot,
      message: 'Chatbot updated successfully',
    } satisfies ApiResponse)
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({
        status: ApiStatus.FAILURE,
        message: 'A chatbot with this name already exists',
      } satisfies ApiResponse)
    }
    next(error)
  }
}

export const deleteChatbot = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { chatbotId } = req.params
    const user = req.user

    if (!chatbotId) {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'Chatbot ID is required',
      } satisfies ApiResponse)
    }

    const chatbot = await prisma.chatbot.findUnique({
      where: { id: chatbotId, userId: user.id },
    })

    if (!chatbot) {
      return res.status(404).json({
        status: ApiStatus.FAILURE,
        message: 'Chatbot not found or you do not have permission to delete it',
      } satisfies ApiResponse)
    }

    // Delete profile picture from R2 if it exists
    if (chatbot.profilePicture) {
      try {
        await r2Service.deleteFile(chatbot.profilePicture)
      } catch (error) {
        // Log error but don't fail the deletion
        console.error('Failed to delete profile picture from R2:', error)
      }
    }

    const result = await prisma.chatbot.delete({
      where: { id: chatbotId },
    })

    if (result) {
      return res.status(200).json({
        status: ApiStatus.SUCCESS,
        data: null,
        message: 'Chatbot deleted successfully',
      } satisfies ApiResponse)
    } else {
      return res.status(500).json({
        status: ApiStatus.FAILURE,
        message: 'Failed to delete chatbot',
      } satisfies ApiResponse)
    }
  } catch (error) {
    next(error)
  }
}

export const getChatbots = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user

    const chatbots = await prisma.chatbot.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })

    // If no chatbots, return empty array
    if (chatbots.length === 0) {
      return res.status(200).json({
        status: ApiStatus.SUCCESS,
        data: [],
        message: 'Chatbots retrieved successfully',
      } satisfies ApiResponse)
    }

    // Get document counts grouped by chatbotId and type
    const documentCounts = await prisma.document.groupBy({
      by: ['chatbotId', 'type'],
      where: {
        chatbotId: { in: chatbots.map(c => c.id) },
      },
      _count: {
        id: true,
      },
    })

    // Map counts to each chatbot
    const chatbotsWithCounts = chatbots.map(chatbot => {
      const chatbotCounts = documentCounts.filter(dc => dc.chatbotId === chatbot.id)

      const fileCount = chatbotCounts.find(dc => dc.type === 'document')?._count.id || 0
      const linkCount = chatbotCounts.find(dc => dc.type === 'website')?._count.id || 0
      const textCount = chatbotCounts.find(dc => dc.type === 'text')?._count.id || 0
      const QandACount = chatbotCounts.find(dc => dc.type === 'q&a')?._count.id || 0
      const documentsCount = fileCount + linkCount + textCount + QandACount

      return {
        ...chatbot,
        documentsCount,
        fileCount,
        linkCount,
        textCount,
        QandACount,
      }
    })

    res.status(200).json({
      status: ApiStatus.SUCCESS,
      data: chatbotsWithCounts,
      message: 'Chatbots retrieved successfully',
    } satisfies ApiResponse)
  } catch (error) {
    next(error)
  }
}

export const getChatbot = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user
    const { chatbotId } = req.params
    const { searchParam, sortBy } = req.query as { searchParam?: string; sortBy?: string }

    if (!chatbotId) {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'Chatbot ID is required',
      } satisfies ApiResponse)
    }

    // Verify chatbot exists and belongs to user
    const chatbot = await prisma.chatbot.findUnique({
      where: { id: chatbotId, userId: user.id },
    })

    if (!chatbot) {
      return res.status(404).json({
        status: ApiStatus.FAILURE,
        message: 'Chatbot not found',
      } satisfies ApiResponse)
    }

    // Get sort order
    const getOrderBy = (filter: string) => {
      switch (filter) {
        case 'Oldest':
          return { uploadedAt: 'asc' as const }
        case 'Newest':
          return { uploadedAt: 'desc' as const }
        case 'Status':
          return { status: 'asc' as const }
        case 'Alphabetical(A-Z)':
          return { name: 'asc' as const }
        case 'Alphabetical(Z-A)':
          return { name: 'desc' as const }
        case 'Default':
        default:
          return { uploadedAt: 'desc' as const }
      }
    }

    // Get filtered and sorted documents
    const documents = await prisma.document.findMany({
      where: {
        chatbotId,
        ...(searchParam && {
          name: {
            contains: searchParam,
            mode: 'insensitive',
          },
        }),
      },
      orderBy: getOrderBy(sortBy || 'Default'),
    })

    // Get document counts by type
    const documentCounts = await prisma.document.groupBy({
      by: ['type'],
      where: {
        chatbotId,
      },
      _count: {
        id: true,
      },
    })

    const fileCount = documentCounts.find(dc => dc.type === 'document')?._count.id || 0
    const linkCount = documentCounts.find(dc => dc.type === 'website')?._count.id || 0
    const textCount = documentCounts.find(dc => dc.type === 'text')?._count.id || 0
    const QandACount = documentCounts.find(dc => dc.type === 'q&a')?._count.id || 0
    const documentsCount = fileCount + linkCount + textCount + QandACount

    res.status(200).json({
      status: ApiStatus.SUCCESS,
      data: {
        ...chatbot,
        documents,
        documentsCount,
        fileCount,
        linkCount,
        textCount,
        QandACount,
      },
      message: 'Chatbot retrieved successfully',
    } satisfies ApiResponse)
  } catch (error) {
    next(error)
  }
}

export const getPresignedUploadUrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fileName, fileType, directory } = req.body

    if (!fileName || !fileType) {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'fileName and fileType are required',
      } satisfies ApiResponse)
    }

    const presignedData = await r2Service.generatePresignedUploadUrl(fileName, fileType, directory)

    res.status(200).json({
      status: ApiStatus.SUCCESS,
      data: presignedData,
      message: 'Presigned URL generated successfully',
    } satisfies ApiResponse)
  } catch (error) {
    next(error)
  }
}

export const deleteFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fileUrl } = req.body

    if (!fileUrl) {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'fileUrl is required',
      } satisfies ApiResponse)
    }

    await r2Service.deleteFile(fileUrl)

    res.status(200).json({
      status: ApiStatus.SUCCESS,
      data: null,
      message: 'File deleted successfully',
    } satisfies ApiResponse)
  } catch (error) {
    next(error)
  }
}

export const uploadText = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, type, subtype, content, size, metadata } = req.body
    const { chatbotId } = req.params

    if (!chatbotId) {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'Chatbot ID is required',
      } satisfies ApiResponse)
    }

    if (!name || !type || !content || !subtype || size === undefined || !metadata) {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'Fields are missing',
      } satisfies ApiResponse)
    }

    const chatbot = await prisma.chatbot.findUnique({
      where: { id: chatbotId },
    })

    if (!chatbot) {
      return res.status(404).json({
        status: ApiStatus.FAILURE,
        message: 'Chatbot not found',
      } satisfies ApiResponse)
    }

    const document = await prisma.document.create({
      data: {
        name,
        type,
        subtype,
        size,
        content,
        chatbotId,
        metadata,
      },
    })

    // Update chatbot totalSize
    await prisma.chatbot.update({
      where: { id: chatbotId },
      data: {
        totalSize: {
          increment: size,
        },
      },
    })

    res.status(200).json({
      status: ApiStatus.SUCCESS,
      data: document,
      message: `${type} document created successfully`,
    } satisfies ApiResponse)
  } catch (error) {
    next(error)
  }
}

export const crawlWebsite = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { url, subtype } = req.body
    const { chatbotId } = req.params

    if (!chatbotId) {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'Chatbot ID is required',
      } satisfies ApiResponse)
    }

    if (!url || !subtype) {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'URL and subtype are required',
      } satisfies ApiResponse)
    }

    if (subtype !== 'url' && subtype !== 'sitemap') {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'Subtype must be either "url" or "sitemap"',
      } satisfies ApiResponse)
    }

    const chatbot = await prisma.chatbot.findUnique({
      where: { id: chatbotId },
    })

    if (!chatbot) {
      return res.status(404).json({
        status: ApiStatus.FAILURE,
        message: 'Chatbot not found',
      } satisfies ApiResponse)
    }

    // Only handle single URL crawling for now
    if (subtype === 'sitemap') {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'Sitemap crawling is not yet implemented',
      } satisfies ApiResponse)
    }

    // Crawl the URL
    const crawlResult = await crawlerService.crawlUrl(url)

    const documentSize = Buffer.byteLength(crawlResult.content, 'utf8')
    const document = await prisma.document.create({
      data: {
        name: crawlResult.title || url,
        type: 'website',
        subtype,
        size: documentSize,
        content: crawlResult.content,
        chatbotId,
        metadata: {
          url: crawlResult.url,
          title: crawlResult.title,
          crawledAt: new Date().toISOString(),
          pageCount: 1,
        },
      },
    })

    // Update chatbot totalSize
    await prisma.chatbot.update({
      where: { id: chatbotId },
      data: {
        totalSize: {
          increment: documentSize,
        },
      },
    })

    res.status(200).json({
      status: ApiStatus.SUCCESS,
      data: document,
      message: `Website ${subtype === 'url' ? 'page' : 'sitemap'} crawled successfully`,
    } satisfies ApiResponse)
  } catch (error) {
    next(error)
  }
}

export const uploadDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const files = req.files as Express.Multer.File[]
    const { chatbotId } = req.params

    if (!chatbotId) {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'Chatbot ID is required',
      } satisfies ApiResponse)
    }

    if (!files || files.length === 0) {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'No files uploaded',
      } satisfies ApiResponse)
    }

    // Verify chatbot exists
    const chatbot = await prisma.chatbot.findUnique({
      where: { id: chatbotId },
    })

    if (!chatbot) {
      return res.status(404).json({
        status: ApiStatus.FAILURE,
        message: 'Chatbot not found',
      } satisfies ApiResponse)
    }

    const processedFiles = await Promise.all(
      files.map(async file => {
        let textContent = ''
        if (file.mimetype === 'application/pdf') {
          const parser = new PDFParse({ data: file.buffer })
          const result = await parser.getText()
          textContent = result.text

          return {
            name: file.originalname,
            type: 'document',
            subtype: 'pdf',
            size: file.size,
            content: textContent,
            chatbotId: chatbotId,
          }
        }
        // Handle .doc files (old Word format)
        if (file.mimetype === 'application/msword') {
          const extractor = new WordExtractor()
          const extracted = await extractor.extract(file.buffer)
          textContent = extracted.getBody()

          return {
            name: file.originalname,
            type: 'document',
            subtype: 'doc',
            content: textContent,
            size: file.size,
            chatbotId: chatbotId,
          }
        }

        // Handle .docx files (newer Word format)
        if (
          file.mimetype ===
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ) {
          const result = await mammoth.extractRawText({ buffer: file.buffer })
          textContent = result.value

          return {
            name: file.originalname,
            type: 'document',
            subtype: 'docx',
            size: file.size,
            content: textContent,
            chatbotId: chatbotId,
          }
        }

        if (file.mimetype === 'text/plain') {
          textContent = file.buffer.toString('utf-8')
          return {
            name: file.originalname,
            type: 'document',
            subtype: 'txt',
            size: file.size,
            content: textContent,
            chatbotId: chatbotId,
          }
        }

        throw new Error(`Unsupported file type: ${file.mimetype} for file ${file.originalname}`)
      })
    )

    // Insert documents into database
    const createdDocuments = await Promise.all(
      processedFiles.map(async fileData => {
        return await prisma.document.create({
          data: fileData,
        })
      })
    )

    // Update chatbot totalSize atomically
    const totalNewSize = createdDocuments.reduce((sum, doc) => sum + doc.size, 0)
    await prisma.chatbot.update({
      where: { id: chatbotId },
      data: {
        totalSize: {
          increment: totalNewSize,
        },
      },
    })

    res.status(200).json({
      status: ApiStatus.SUCCESS,
      data: createdDocuments,
      message: `${files.length} document(s) uploaded successfully`,
    } satisfies ApiResponse)
  } catch (error) {
    next(error)
  }
}

export const deleteDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user
    const { documentId } = req.params

    if (!documentId) {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'Document ID is required',
      } satisfies ApiResponse)
    }

    // First, fetch the document to get its size and chatbotId
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        chatbot: {
          userId: user.id,
        },
      },
    })

    if (!document) {
      return res.status(404).json({
        status: ApiStatus.FAILURE,
        message: 'Document not found or you do not have permission to delete it',
      } satisfies ApiResponse)
    }

    // Delete the document
    await prisma.document.delete({
      where: { id: documentId },
    })

    // Update chatbot totalSize
    await prisma.chatbot.update({
      where: { id: document.chatbotId },
      data: {
        totalSize: {
          decrement: document.size,
        },
      },
    })

    res.status(200).json({
      status: ApiStatus.SUCCESS,
      data: null,
      message: 'Document deleted successfully',
    } satisfies ApiResponse)
  } catch (error) {
    next(error)
  }
}

export const deleteMultipleDocuments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user
    const { documentIds } = req.body

    // Validate input
    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'Document IDs array is required and must not be empty',
      } satisfies ApiResponse)
    }

    // Validate all IDs are strings
    if (!documentIds.every(id => typeof id === 'string')) {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'All document IDs must be valid strings',
      } satisfies ApiResponse)
    }

    // First, fetch all documents to get their sizes and chatbotIds
    const documents = await prisma.document.findMany({
      where: {
        id: { in: documentIds },
        chatbot: {
          userId: user.id,
        },
      },
      select: {
        id: true,
        size: true,
        chatbotId: true,
      },
    })

    if (documents.length === 0) {
      return res.status(404).json({
        status: ApiStatus.FAILURE,
        message: 'No documents found or you do not have permission to delete them',
      } satisfies ApiResponse)
    }

    // Delete the documents
    const result = await prisma.document.deleteMany({
      where: {
        id: { in: documents.map(doc => doc.id) },
      },
    })

    // Group documents by chatbotId and calculate total size per chatbot
    const sizesByChatbot = documents.reduce(
      (acc, doc) => {
        acc[doc.chatbotId] = (acc[doc.chatbotId] || 0) + doc.size
        return acc
      },
      {} as Record<string, number>
    )

    // Update totalSize for each affected chatbot
    await Promise.all(
      Object.entries(sizesByChatbot).map(([chatbotId, totalSize]) =>
        prisma.chatbot.update({
          where: { id: chatbotId },
          data: {
            totalSize: {
              decrement: totalSize,
            },
          },
        })
      )
    )

    res.status(200).json({
      status: ApiStatus.SUCCESS,
      data: { deletedCount: result.count },
      message: `${result.count} document(s) deleted successfully`,
    } satisfies ApiResponse)
  } catch (error) {
    next(error)
  }
}

/**
 * Train all untrained documents for a chatbot
 * POST /:chatbotId/train
 */
export const trainDocuments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { chatbotId } = req.params
    const user = req.user

    if (!chatbotId) {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'Chatbot ID is required',
      } satisfies ApiResponse)
    }

    // Verify ownership
    const chatbot = await prisma.chatbot.findUnique({
      where: { id: chatbotId, userId: user.id },
    })

    if (!chatbot) {
      return res.status(404).json({
        status: ApiStatus.FAILURE,
        message: 'Chatbot not found or you do not have permission',
      } satisfies ApiResponse)
    }

    // Start training
    const result = await trainingService.trainChatbotDocuments(chatbotId)

    if (result.success) {
      res.status(200).json({
        status: ApiStatus.SUCCESS,
        data: {
          documentsProcessed: result.documentsProcessed,
          chunksCreated: result.totalChunksCreated,
        },
        message:
          result.documentsProcessed > 0
            ? `Successfully trained ${result.documentsProcessed} document(s) with ${result.totalChunksCreated} chunks`
            : 'No untrained documents to process',
      } satisfies ApiResponse)
    } else {
      res.status(207).json({
        status: ApiStatus.FAILURE,
        data: {
          documentsProcessed: result.documentsProcessed,
          chunksCreated: result.totalChunksCreated,
          failedDocuments: result.failedDocuments,
        },
        message:
          result.error ||
          `Training completed with ${result.failedDocuments.length} failed document(s)`,
      } satisfies ApiResponse)
    }
  } catch (error) {
    next(error)
  }
}

/**
 * Get training status for a chatbot
 * GET /:chatbotId/training-status
 */
export const getTrainingStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { chatbotId } = req.params
    const user = req.user

    if (!chatbotId) {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'Chatbot ID is required',
      } satisfies ApiResponse)
    }

    // Verify ownership
    const chatbot = await prisma.chatbot.findUnique({
      where: { id: chatbotId, userId: user.id },
    })

    if (!chatbot) {
      return res.status(404).json({
        status: ApiStatus.FAILURE,
        message: 'Chatbot not found or you do not have permission',
      } satisfies ApiResponse)
    }

    const status = await trainingService.getTrainingStatus(chatbotId)

    res.status(200).json({
      status: ApiStatus.SUCCESS,
      data: status,
      message: 'Training status retrieved successfully',
    } satisfies ApiResponse)
  } catch (error) {
    next(error)
  }
}

export const chatController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { chatbotId } = req.params
    let { sessionId, message } = req.body

    if (!chatbotId) {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'Chatbot ID is required',
      } satisfies ApiResponse)
    }

    if (!message) {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'User message required',
      } satisfies ApiResponse)
    }

    // --- Session creation / validation (keep existing logic) ---
    if (!sessionId) {
      const chatbot = await prisma.chatbot.findUnique({
        where: { id: chatbotId },
      })

      if (!chatbot) {
        return res.status(404).json({
          status: ApiStatus.FAILURE,
          message: 'Chatbot not found',
        } satisfies ApiResponse)
      }

      const session = await prisma.chatSession.create({
        data: {
          chatbotId,
          messages: {
            create: {
              role: 'user',
              content: message,
              sources: [],
            },
          },
        },
        include: {
          messages: true,
        },
      })
      sessionId = session.id
    } else {
      const session = await prisma.chatSession.findFirst({
        where: { id: sessionId, chatbotId },
      })

      if (!session) {
        return res.status(404).json({
          status: ApiStatus.FAILURE,
          message: 'Chat session not found',
        } satisfies ApiResponse)
      }

      await prisma.chatMessage.create({
        data: {
          sessionId,
          role: 'user',
          content: message,
          sources: [],
        },
      })
    }

    // --- SSE headers ---
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')
    res.flushHeaders()

    const sendSSE = (payload: object) => {
      res.write(`data: ${JSON.stringify(payload)}\n\n`)
    }

    // Send sessionId immediately
    sendSSE({ type: 'session', sessionId })

    // --- RAG: embed + search ---
    const startTime = Date.now()

    let queryEmbedding: number[]
    try {
      queryEmbedding = await chatService.generateEmbedding(message)
    } catch (err) {
      sendSSE({ type: 'error', message: 'Failed to generate embedding' })
      res.end()
      return
    }

    const relevantChunks = await chatService.searchRelevantChunks(chatbotId, queryEmbedding)
    const context = relevantChunks.map(c => c.content).join('\n\n---\n\n')
    const sourceDocIds = [...new Set(relevantChunks.map(c => c.documentId))]

    // Fetch recent chat history for context
    const recentMessages = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      take: 10,
    })
    const chatHistory = recentMessages.slice(0, -1).map(m => ({
      role: m.role,
      content: m.content,
    }))

    // --- Stream LLM response ---
    let fullResponse = ''

    await chatService.streamLLMResponse({
      message,
      context,
      chatHistory,
      onToken: (token: string) => {
        fullResponse += token
        sendSSE({ type: 'token', token })
      },
      onComplete: async () => {
        const responseTime = Date.now() - startTime

        // Save assistant message to DB
        const assistantMessage = await prisma.chatMessage.create({
          data: {
            sessionId,
            role: 'assistant',
            content: fullResponse,
            model: 'meta-llama/Llama-3.1-8B-Instruct',
            responseTime,
            sources: sourceDocIds,
          },
        })

        sendSSE({ type: 'done', message: assistantMessage })
        res.end()
      },
      onError: (error: Error) => {
        console.error('LLM streaming error:', error)
        sendSSE({ type: 'error', message: 'Failed to generate response' })
        res.end()
      },
    })
  } catch (error) {
    // If headers already sent (SSE started), send error event
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Internal server error' })}\n\n`)
      res.end()
    } else {
      next(error)
    }
  }
}

export const getChatSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { chatbotId, sessionId } = req.params
    if (!chatbotId) {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'Chatbot ID is required',
      } satisfies ApiResponse)
    }

    if (!sessionId) {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'Chat session ID required',
      } satisfies ApiResponse)
    }

    const chatbot = await prisma.chatbot.findUnique({
      where: { id: chatbotId, userId: req.user.id },
    })

    if (!chatbot) {
      return res.status(404).json({
        status: ApiStatus.FAILURE,
        message: 'Chatbot not found',
      } satisfies ApiResponse)
    }
    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, chatbotId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!session) {
      return res.status(404).json({
        status: ApiStatus.FAILURE,
        message: 'Chat session not found',
      } satisfies ApiResponse)
    }

    res.status(200).json({
      status: ApiStatus.SUCCESS,
      data: { chatSession: session },
      message: 'Successfully retrieved chat session',
    } satisfies ApiResponse)
  } catch (error) {
    next(error)
  }
}
