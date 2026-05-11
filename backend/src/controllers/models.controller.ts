import type { Request, Response, NextFunction } from 'express'
import { CHAT_MODELS, DEFAULT_MODEL_ID } from '../constants/models.js'
import { ApiStatus, type ApiResponse } from '../types/api.js'

export const listModels = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(200).json({
      status: ApiStatus.SUCCESS,
      data: {
        models: CHAT_MODELS,
        defaultModelId: DEFAULT_MODEL_ID,
      },
      message: 'Models retrieved successfully',
    } satisfies ApiResponse)
  } catch (error) {
    next(error)
  }
}
