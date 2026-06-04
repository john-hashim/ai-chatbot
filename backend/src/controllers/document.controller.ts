import type { Request, Response, NextFunction } from 'express'
import { prisma } from '../prisma/client.js'
import { ApiStatus, type ApiResponse } from '../types/api.js'
import * as r2Service from '../services/r2.service.js'
import { PDFParse } from 'pdf-parse'
import mammoth from 'mammoth'
import WordExtractor from 'word-extractor'
import * as crawlerService from '../services/crawler.service.js'
import * as trainingService from '../services/training.service.js'

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
    const user = req.user
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

    // Verify chatbot exists and belongs to the authenticated user
    const chatbot = await prisma.chatbot.findUnique({
      where: { id: chatbotId },
    })

    if (!chatbot) {
      return res.status(404).json({
        status: ApiStatus.FAILURE,
        message: 'Chatbot not found',
      } satisfies ApiResponse)
    }

    if (chatbot.userId !== user?.id) {
      return res.status(403).json({
        status: ApiStatus.FAILURE,
        message: 'Forbidden',
      } satisfies ApiResponse)
    }

    const processedFiles = await Promise.all(
      files.map(async file => {
        let textContent = ''
        if (file.mimetype === 'application/pdf') {
          const parser = new PDFParse({ data: file.buffer })
          const result = await parser.getText()
          textContent = result.text.replace(/\0/g, '')
        } else if (file.mimetype === 'application/msword') {
          // Handle .doc files (old Word format)
          const extractor = new WordExtractor()
          const extracted = await extractor.extract(file.buffer)
          textContent = extracted.getBody().replace(/\0/g, '')
        } else if (
          file.mimetype ===
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ) {
          // Handle .docx files (newer Word format)
          const result = await mammoth.extractRawText({ buffer: file.buffer })
          textContent = result.value.replace(/\0/g, '')
        } else if (file.mimetype === 'text/plain') {
          textContent = file.buffer.toString('utf-8').replace(/\0/g, '')
        } else {
          throw new Error(`Unsupported file type: ${file.mimetype} for file ${file.originalname}`)
        }

        if (!textContent.trim()) {
          throw new Error(
            `No text could be extracted from "${file.originalname}". The file may be empty or image-only.`
          )
        }

        const subtypeMap: Record<string, string> = {
          'application/pdf': 'pdf',
          'application/msword': 'doc',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
          'text/plain': 'txt',
        }

        return {
          name: file.originalname,
          type: 'document',
          subtype: subtypeMap[file.mimetype] ?? null,
          size: file.size,
          content: textContent,
          chatbotId: chatbotId,
        }
      })
    )

    // Insert documents and update totalSize in a single transaction
    const totalNewSize = processedFiles.reduce((sum, f) => sum + f.size, 0)
    const createdDocuments = await prisma.$transaction(async tx => {
      const docs = await Promise.all(
        processedFiles.map(fileData => tx.document.create({ data: fileData }))
      )
      await tx.chatbot.update({
        where: { id: chatbotId },
        data: { totalSize: { increment: totalNewSize } },
      })
      return docs
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
