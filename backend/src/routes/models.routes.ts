import express from 'express'
import * as authMiddleware from '../middleware/auth.middleware.js'
import * as modelsController from '../controllers/models.controller.js'

const router = express.Router()

router.get('/', authMiddleware.authenticateToken, modelsController.listModels)

export default router
