import express from 'express'
import * as authMiddleware from '../middleware/auth.middleware.js'
import * as calendarController from '../controllers/calendar.controller.js'

const router = express.Router()

// Google redirects here without our auth header — verified via signed `state`.
router.get('/calendar/google/callback', calendarController.handleCallback)

router.get(
  '/:chatbotId/calendar',
  authMiddleware.authenticateToken,
  calendarController.getStatus
)
router.get(
  '/:chatbotId/calendar/google/authorize',
  authMiddleware.authenticateToken,
  calendarController.getAuthorizeUrl
)
router.delete(
  '/:chatbotId/calendar',
  authMiddleware.authenticateToken,
  calendarController.disconnect
)

export default router
