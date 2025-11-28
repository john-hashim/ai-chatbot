// src/middleware/auth.middleware.ts
import type { Request, Response, NextFunction } from 'express'
import { prisma } from '../prisma/client.js'
import { ApiStatus, type ApiResponse } from '../types/api.js'

declare global {
  namespace Express {
    interface Request {
      user?: any
      session?: any
    }
  }
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      return res.status(401).json({
        status: ApiStatus.FAILURE,
        message: 'Authentication required',
      } satisfies ApiResponse)
    }

    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!session || new Date() > session.expiresAt) {
      if (session) {
        await prisma.session.delete({ where: { id: session.id } })
      }
      return res.status(401).json({
        status: ApiStatus.FAILURE,
        message: 'Session expired or invalid',
      } satisfies ApiResponse)
    }

    req.user = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    }
    req.session = session

    next()
  } catch (error) {
    console.error('Authentication error:', error)
    return res.status(500).json({
      status: ApiStatus.FAILURE,
      message: 'Authentication failed',
    } satisfies ApiResponse)
  }
}
