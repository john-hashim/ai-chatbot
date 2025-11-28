import type { Request, Response } from 'express'
import { prisma } from '../prisma/client.js'

export const createChatbot = async (req: Request, res: Response) => {
  try {
    const user = req.user

    if (!user || !user.id) {
      return res.status(401).json({ message: 'Unauthorized: User not authenticated' })
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

    res.status(201).json({ chatbot })
  } catch (error) {
    console.error('Error creating chatbot:', error)

    if (error instanceof Error) {
      if (error.message.includes('Foreign key constraint')) {
        return res.status(400).json({ message: 'Invalid user reference' })
      }

      if (error.message.includes('Unique constraint')) {
        return res.status(409).json({ message: 'A chatbot with this name already exists' })
      }
    }

    res.status(500).json({ message: 'Internal server error while creating chatbot' })
  }
}
