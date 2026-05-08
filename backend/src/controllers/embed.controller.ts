import type { NextFunction, Request, Response } from 'express'
import { ApiStatus, type ApiResponse } from '../types/api.js'
import { prisma } from '../prisma/client.js'

export const getEmbedConfig = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const chatbot = req.chatbot
    res.status(200).json({
      status: ApiStatus.SUCCESS,
      data: {
        id: chatbot.id,
        name: chatbot.name,
        appearance: chatbot.appearance,
        brandColor: chatbot.brandColor,
        brandColorForHeader: chatbot.brandColorForHeader,
        profilePicture: chatbot.profilePicture,
        initialMessages: chatbot.initialMessages,
        suggestedMessages: chatbot.suggestedMessages,
        showSuggestedAfterFirst: chatbot.showSuggestedAfterFirst,
        messagePlaceholder: chatbot.messagePlaceholder,
        dismissibleNotice: chatbot.dismissibleNotice,
        footer: chatbot.footer,
        chatIcon: chatbot.chatIcon,
        chatBubbleButtonColor: chatbot.chatBubbleButtonColor,
        chatBubbleButtonPosition: chatbot.chatBubbleButtonPosition,
        autoshowDelaySeconds: chatbot.autoshowDelaySeconds,
        autoshowInitialPopup: chatbot.autoshowInitialPopup,
      },
      message: 'chatbot successfully retrived',
    } satisfies ApiResponse)
  } catch (error) {
    next(error)
  }
}

export const getEmbedChatSessions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const chatbotId = req.chatbot.id

    const sessions = await prisma.chatSession.findMany({
      where: { chatbotId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        chatbotId: true,
        createdAt: true,
        updatedAt: true,
        source: true,
        messages: {
          take: 2,
          orderBy: { createdAt: 'asc' },
        },
        _count: { select: { messages: true } },
      },
    })

    res.status(200).json({
      status: ApiStatus.SUCCESS,
      data: sessions,
      message: 'Chat sessions retrieved successfully',
    } satisfies ApiResponse)
  } catch (error) {
    next(error)
  }
}

export const getEmbedChatSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params
    const chatbotId = req.chatbot.id

    if (!sessionId) {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'Chat session ID required',
      } satisfies ApiResponse)
    }

    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, chatbotId },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
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
