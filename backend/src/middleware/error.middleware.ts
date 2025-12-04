import type { Request, Response, NextFunction } from 'express'
import { ApiStatus, type ApiResponse } from '../types/api.js'

interface PrismaError extends Error {
  code?: string
  meta?: Record<string, unknown>
}

export const errorHandler = (
  err: PrismaError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('Error:', err)

  let statusCode = 500
  let message = 'Internal server error'

  // Handle Prisma-specific errors
  if (err.code?.startsWith('P')) {
    switch (err.code) {
      case 'P2002': // Unique constraint violation
        statusCode = 409
        message = 'A record with this information already exists'
        break
      case 'P2025': // Record not found
        statusCode = 404
        message = 'Record not found'
        break
      case 'P2024': // Connection timeout
        statusCode = 503
        message = 'Database connection timeout. Please try again.'
        break
      case 'P1001': // Can't reach database server
      case 'P1002': // Database server timeout
        statusCode = 503
        message = 'Database service unavailable. Please try again later.'
        break
      default:
        message = 'Database error occurred'
        break
    }
  }

  const response: ApiResponse = {
    status: ApiStatus.FAILURE,
    message,
  }

  if (process.env.NODE_ENV === 'development') {
    response.error = err.message
  }

  res.status(statusCode).json(response)
}
