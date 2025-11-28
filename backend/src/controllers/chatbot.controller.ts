import type { Request, Response } from 'express'
import { prisma } from '../prisma/client.js'
import { ApiStatus, type ApiResponse } from '../types/api.js'

export const createChatbot = async (req: Request, res: Response) => {
  try {
    const user = req.user

    if (!user || !user.id) {
      return res.status(401).json({
        status: ApiStatus.FAILURE,
        message: 'Unauthorized: User not authenticated',
      } satisfies ApiResponse)
    }

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
    if (error instanceof Error) {
      if (error.message.includes('Foreign key constraint')) {
        return res.status(400).json({
          status: ApiStatus.FAILURE,
          message: 'Invalid user reference',
          error: error.message,
        } satisfies ApiResponse)
      }

      if (error.message.includes('Unique constraint')) {
        return res.status(409).json({
          status: ApiStatus.FAILURE,
          message: 'A chatbot with this name already exists',
          error: error.message,
        } satisfies ApiResponse)
      }
    }

    res.status(500).json({
      status: ApiStatus.FAILURE,
      message: 'Internal server error while creating chatbot',
    } satisfies ApiResponse)
  }
}
