import type { Request, Response, NextFunction } from 'express'
import { prisma } from '../prisma/client.js'
import { ApiStatus, type ApiResponse } from '../types/api.js'

export const createChatbot = async (req: Request, res: Response, next: Function) => {
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
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return res.status(409).json({
        status: ApiStatus.FAILURE,
        message: 'A chatbot with this name already exists',
        error: error.message,
      } satisfies ApiResponse)
    }

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

    res.status(200).json({
      status: ApiStatus.SUCCESS,
      data: chatbots,
      message: 'Chatbots retrieved successfully',
    } satisfies ApiResponse)
  } catch (error) {
    next(error)
  }
}
