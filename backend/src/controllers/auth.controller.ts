import type { Request, Response, NextFunction } from 'express'
import crypto from 'crypto'
import { prisma } from '../prisma/client.js'
import { OAuth2Client } from 'google-auth-library'
import { ApiStatus, type ApiResponse } from '../types/api.js'
import * as r2Service from '../services/r2.service.js'

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

const generateToken = (): string => {
  return crypto.randomBytes(32).toString('hex')
}

const createSession = async (userId: string) => {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  const session = await prisma.session.create({
    data: {
      userId,
      token: generateToken(),
      expiresAt,
    },
  })
  return session
}

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const session = req.session

    if (!session) {
      res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'No session found',
      } satisfies ApiResponse)
      return
    }

    await prisma.session.delete({
      where: { id: session.id },
    })

    res.status(200).json({
      status: ApiStatus.SUCCESS,
      message: 'Logged out successfully',
    } satisfies ApiResponse)
  } catch (error) {
    console.error('Logout error:', error)
    next(error)
  }
}

export const googleSignIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { credential } = req.body

    if (!credential) {
      res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'Google credential is required',
      } satisfies ApiResponse)
      return
    }

    const clientId = process.env.GOOGLE_CLIENT_ID
    if (!clientId) {
      res.status(500).json({
        status: ApiStatus.FAILURE,
        message: 'Server configuration error',
      } satisfies ApiResponse)
      return
    }

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: clientId,
    })

    const payload = ticket.getPayload()

    if (!payload?.sub || !payload?.email) {
      res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'Invalid Google token',
      } satisfies ApiResponse)
      return
    }

    let user = await prisma.user.findUnique({
      where: { email: payload.email },
    })

    const isNewUser = !user

    if (!user) {
      user = await prisma.user.create({
        data: {
          googleId: payload.sub,
          email: payload.email,
          name: payload.name ?? '',
          avatar: payload.picture ?? '',
        },
      })
    } else if (!user.googleId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: payload.sub,
          avatar: user.avatar || payload.picture || '',
        },
      })
    }

    const session = await createSession(user.id)

    res.status(200).json({
      status: ApiStatus.SUCCESS,
      message: isNewUser ? 'Account created successfully' : 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
        },
        token: session.token,
        isNewUser,
      },
    } satisfies ApiResponse)
  } catch (error) {
    console.error('Google sign-in error:', error)

    if (error instanceof Error && error.message.includes('Token used too late')) {
      res.status(401).json({
        status: ApiStatus.FAILURE,
        message: 'Google token has expired. Please try signing in again.',
      } satisfies ApiResponse)
      return
    }

    next(error)
  }
}

export const updateAvatar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id
    const { avatar } = req.body

    // If removing, delete old file from R2
    if (avatar === null || avatar === '') {
      const existing = await prisma.user.findUnique({ where: { id: userId }, select: { avatar: true } })
      if (existing?.avatar) {
        try {
          await r2Service.deleteFile(existing.avatar)
        } catch {
          // Continue even if R2 delete fails
        }
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { avatar: avatar || null },
      select: { id: true, email: true, name: true, avatar: true },
    })

    res.status(200).json({
      status: ApiStatus.SUCCESS,
      message: 'Avatar updated successfully',
      data: user,
    } satisfies ApiResponse)
  } catch (error) {
    next(error)
  }
}

export const updateName = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id
    const { name } = req.body

    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'Name is required',
      } satisfies ApiResponse)
      return
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { name: name.trim() },
      select: { id: true, email: true, name: true, avatar: true },
    })

    res.status(200).json({
      status: ApiStatus.SUCCESS,
      message: 'Name updated successfully',
      data: user,
    } satisfies ApiResponse)
  } catch (error) {
    next(error)
  }
}

export const updateEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id
    const { email } = req.body

    if (!email || typeof email !== 'string' || !email.trim()) {
      res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'Email is required',
      } satisfies ApiResponse)
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'Invalid email address',
      } satisfies ApiResponse)
      return
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { email: email.trim() },
      select: { id: true, email: true, name: true, avatar: true },
    })

    res.status(200).json({
      status: ApiStatus.SUCCESS,
      message: 'Email updated successfully',
      data: user,
    } satisfies ApiResponse)
  } catch (error) {
    next(error)
  }
}

export const deleteAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id

    await prisma.user.delete({ where: { id: userId } })

    res.status(200).json({
      status: ApiStatus.SUCCESS,
      message: 'Account deleted successfully',
    } satisfies ApiResponse)
  } catch (error) {
    next(error)
  }
}

export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id

    if (!userId) {
      res.status(401).json({
        status: ApiStatus.FAILURE,
        message: 'Unauthorized',
      } satisfies ApiResponse)
      return
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
      },
    })

    if (!user) {
      res.status(404).json({
        status: ApiStatus.FAILURE,
        message: 'User not found',
      } satisfies ApiResponse)
      return
    }

    res.status(200).json({
      status: ApiStatus.SUCCESS,
      message: 'User retrieved successfully',
      data: user,
    } satisfies ApiResponse)
  } catch (error) {
    console.error('Get user error:', error)
    next(error)
  }
}
