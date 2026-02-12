import type { NextFunction, Request, Response } from 'express'
import { ApiStatus, type ApiResponse } from '../types/api.js'
import { prisma } from '../prisma/client.js'

export const authenticateEmbed = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { embedKey } = req.params
    if (!embedKey) {
      return res.status(401).json({
        status: ApiStatus.FAILURE,
        message: 'Embed key is required',
      } satisfies ApiResponse)
    }

    const embedConfig = await prisma.embedConfig.findUnique({
      where: { embedKey },
      include: { chatbot: true },
    })

    if (!embedConfig || !embedConfig.isActive) {
      return res.status(404).json({
        status: ApiStatus.FAILURE,
        message: 'Invalid or inactive embed',
      } satisfies ApiResponse)
    }

    if (embedConfig.allowedDomains.length > 0) {
      const origin = req.headers.origin || req.headers.referer
      if (origin) {
        try {
          const originHost = new URL(origin).hostname
          const allowed = embedConfig.allowedDomains.some(
            domain => originHost === domain || originHost.endsWith('.' + domain)
          )
          if (!allowed) {
            return res.status(403).json({
              status: ApiStatus.FAILURE,
              message: 'Domain not allowed',
            } satisfies ApiResponse)
          }
        } catch {
          return res.status(403).json({
            status: ApiStatus.FAILURE,
            message: 'Invalid origin',
          } satisfies ApiResponse)
        }
      }
    }

    req.chatbot = embedConfig.chatbot
    req.embedConfig = embedConfig
    req.params.chatbotId = embedConfig.chatbot.id

    next()
  } catch (e) {
    console.error('Authentication error:', e)
    return res.status(500).json({
      status: ApiStatus.FAILURE,
      message: 'Authentication failed',
    } satisfies ApiResponse)
  }
}
