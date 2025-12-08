import type { Request, Response, NextFunction } from 'express'
import { prisma } from '../prisma/client.js'
import { ApiStatus, type ApiResponse } from '../types/api.js'
import * as r2Service from '../services/r2.service.js'

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

    res.status(200).json({
      status: ApiStatus.SUCCESS,
      data: chatbots,
      message: 'Chatbots retrieved successfully',
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

    if (!files || files.length === 0) {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'No files uploaded',
      } satisfies ApiResponse)
    }

    // Log file buffers (you can process them as needed)
    files.forEach(file => console.log(file.buffer))

    const uploadedFiles = files.map(file => ({
      name: file.originalname,
      type: file.mimetype,
      size: file.size,
    }))

    res.status(200).json({
      status: ApiStatus.SUCCESS,
      data: uploadedFiles,
      message: `${files.length} document(s) uploaded successfully`,
    } satisfies ApiResponse)
  } catch (error) {
    next(error)
  }
}
