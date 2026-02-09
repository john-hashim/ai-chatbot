import type { Request, Response, NextFunction } from 'express'
import { prisma } from '../prisma/client.js'
import { ApiStatus, type ApiResponse } from '../types/api.js'
import * as analyticsService from '../services/analytics.service.js'

export const getAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { chatbotId } = req.params
    const { period } = req.query as { period?: string }

    if (!chatbotId) {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'Chatbot ID is required',
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

    const endDate = new Date()
    const startDate = new Date()

    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(endDate.getDate() - 30)
        break
      case '90d':
        startDate.setDate(endDate.getDate() - 90)
        break
      case 'all':
        startDate.setFullYear(2020)
        break
      default:
        startDate.setDate(endDate.getDate() - 30)
    }

    const analytics = await analyticsService.getAnalytics(chatbotId, startDate, endDate)

    res.status(200).json({
      status: ApiStatus.SUCCESS,
      data: analytics,
      message: 'Analytics retrieved successfully',
    } satisfies ApiResponse)
  } catch (error) {
    next(error)
  }
}
