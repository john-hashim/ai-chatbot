import express from 'express'
import * as authMiddleware from '../middleware/auth.middleware.js'
import * as analyticsController from '../controllers/analytics.controller.js'

const router = express.Router()

router.get(
  '/:chatbotId/analytics',
  authMiddleware.authenticateToken,
  analyticsController.getAnalytics
)

export default router
