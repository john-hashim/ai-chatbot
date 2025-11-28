import type { Request, Response, NextFunction } from 'express'
import { ApiStatus, type ApiResponse } from '../types/api.js'

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('Error:', err)

  const response: ApiResponse = {
    status: ApiStatus.FAILURE,
    message: 'Internal server error',
  }

  if (process.env.NODE_ENV === 'development') {
    response.error = err.message
  }

  res.status(500).json(response)
}
