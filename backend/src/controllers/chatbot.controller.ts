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

    const processedFiles = await Promise.all(
      files.map(async file => {
        let textContent = ''
        if (file.mimetype === 'application/pdf') {
          const parser = new PDFParse({ data: file.buffer })
          const result = await parser.getText()
          textContent = result.text

          return {
            name: file.originalname,
            type: file.mimetype,
            size: file.size,
            text: textContent,
          }
        }
        // Handle .doc files (old Word format)
        if (file.mimetype === 'application/msword') {
          const extractor = new WordExtractor()
          const extracted = await extractor.extract(file.buffer)
          textContent = extracted.getBody()

          return {
            name: file.originalname,
            type: file.mimetype,
            size: file.size,
            text: textContent,
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
            type: file.mimetype,
            size: file.size,
            text: textContent,
          }
        }

        if (file.mimetype === 'text/plain') {
          textContent = file.buffer.toString('utf-8')
          return {
            name: file.originalname,
            type: file.mimetype,
            size: file.size,
            text: textContent,
          }
        }
      })
    )

    console.log(processedFiles)
    res.status(200).json({
      status: ApiStatus.SUCCESS,
      data: null,
      message: `${files.length} document(s) uploaded successfully`,
    } satisfies ApiResponse)
  } catch (error) {
    next(error)
  }
}
