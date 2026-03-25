import type { Request, Response, NextFunction } from 'express'
import { Prisma } from '@prisma/client'
import { prisma } from '../prisma/client.js'
import { ApiStatus, type ApiResponse } from '../types/api.js'
import * as r2Service from '../services/r2.service.js'
import crypto from 'crypto'

export const createChatbot = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user

    const {
      name,
      appearance,
      brandColor,
      brandColorForHeader,
      profilePicture,
      instructionType,
      customInstruction,
      timezone,
    } = req.body

    const chatbot = await prisma.chatbot.create({
      data: {
        name: name.trim(),
        appearance: appearance || 'light',
        brandColor,
        brandColorForHeader: brandColorForHeader ?? false,
        profilePicture: profilePicture || null,
        userId: user.id,
        initialMessages: ['Hi! What can I help you with?'],
        instructionType: instructionType || 'base',
        customInstruction: instructionType === 'manual' ? customInstruction || null : null,
        bookingConfig: {
          create: {
            timezone: timezone || 'UTC',
            appointmentDuration: 30,
            notificationEmail: user.email,
          },
        },
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
      'instructionType',
      'customInstruction',
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

export const createEmbedConfig = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user
    const { chatbotId } = req.params

    if (!chatbotId) {
      return res.status(404).json({
        status: ApiStatus.FAILURE,
        message: 'ChatbotId is required',
      } satisfies ApiResponse)
    }

    const chatbot = await prisma.chatbot.findUnique({
      where: { id: chatbotId, userId: user.id },
    })

    if (!chatbot) {
      return res.status(404).json({
        status: ApiStatus.FAILURE,
        message: 'Chatbot not found',
      } satisfies ApiResponse)
    }

    const existing = await prisma.embedConfig.findUnique({
      where: { chatbotId },
    })

    if (existing) {
      return res.status(409).json({
        status: ApiStatus.FAILURE,
        message: 'Embed config already exists for this chatbot',
      } satisfies ApiResponse)
    }

    const embedKey = 'ek_' + crypto.randomBytes(24).toString('hex')

    const embedConfig = await prisma.embedConfig.create({
      data: {
        chatbotId,
        embedKey,
      },
    })

    res.status(201).json({
      status: ApiStatus.SUCCESS,
      data: embedConfig,
      message: 'Embed config created successfully',
    } satisfies ApiResponse)
  } catch (error) {
    next(error)
  }
}

export const getEmbedConfigAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user
    const { chatbotId } = req.params

    if (!chatbotId) {
      return res.status(404).json({
        status: ApiStatus.FAILURE,
        message: 'ChatbotId is required',
      } satisfies ApiResponse)
    }

    const chatbot = await prisma.chatbot.findUnique({
      where: { id: chatbotId, userId: user.id },
    })

    if (!chatbot) {
      return res.status(404).json({
        status: ApiStatus.FAILURE,
        message: 'Chatbot not found',
      } satisfies ApiResponse)
    }

    const embedConfig = await prisma.embedConfig.findUnique({
      where: { chatbotId },
    })

    if (!embedConfig) {
      return res.status(200).json({
        status: ApiStatus.SUCCESS,
        data: null,
        message: 'No embed config found for this chatbot',
      })
    }

    res.status(200).json({
      status: ApiStatus.SUCCESS,
      data: embedConfig,
      message: 'Embed config retrieved successfully',
    } satisfies ApiResponse)
  } catch (error) {
    next(error)
  }
}

export const updateEmbedConfig = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user
    const { chatbotId } = req.params
    const { isActive, allowedDomains, rateLimitPerMin, regenerateKey } = req.body

    if (!chatbotId) {
      return res.status(404).json({
        status: ApiStatus.FAILURE,
        message: 'ChatbotId is required',
      } satisfies ApiResponse)
    }

    const chatbot = await prisma.chatbot.findUnique({
      where: { id: chatbotId, userId: user.id },
    })

    if (!chatbot) {
      return res.status(404).json({
        status: ApiStatus.FAILURE,
        message: 'Chatbot not found',
      } satisfies ApiResponse)
    }

    const updateData: any = {}
    if (isActive !== undefined) updateData.isActive = isActive
    if (allowedDomains !== undefined) updateData.allowedDomains = allowedDomains
    if (rateLimitPerMin !== undefined) updateData.rateLimitPerMin = rateLimitPerMin
    if (regenerateKey) updateData.embedKey = 'ek_' + crypto.randomBytes(24).toString('hex')

    const embedConfig = await prisma.embedConfig.update({
      where: { chatbotId },
      data: updateData,
    })

    res.status(200).json({
      status: ApiStatus.SUCCESS,
      data: embedConfig,
      message: 'Embed config updated successfully',
    } satisfies ApiResponse)
  } catch (error) {
    next(error)
  }
}
