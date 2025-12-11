import type { Request, Response, NextFunction } from 'express'
import { prisma } from '../prisma/client.js'
import { ApiStatus, type ApiResponse } from '../types/api.js'
import * as r2Service from '../services/r2.service.js'
import { PDFParse } from 'pdf-parse'
import mammoth from 'mammoth'
import WordExtractor from 'word-extractor'

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
      },
    })

    res.status(201).json({
      status: ApiStatus.SUCCESS,
      data: chatbot,
      message: 'Chatbot created successfully',
    } satisfies ApiResponse)
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
    const { searchParam, sortBy } = req.body

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

    const result = await prisma.document.deleteMany({
      where: {
        id: documentId,
        chatbot: {
          userId: user.id,
        },
      },
    })

    if (result.count === 0) {
      return res.status(404).json({
        status: ApiStatus.FAILURE,
        message: 'Document not found or you do not have permission to delete it',
      } satisfies ApiResponse)
    }

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

    const result = await prisma.document.deleteMany({
      where: {
        id: { in: documentIds },
        chatbot: {
          userId: user.id,
        },
      },
    })

    res.status(200).json({
      status: ApiStatus.SUCCESS,
      data: { deletedCount: result.count },
      message: `${result.count} document(s) deleted successfully`,
    } satisfies ApiResponse)
  } catch (error) {
    next(error)
  }
}
