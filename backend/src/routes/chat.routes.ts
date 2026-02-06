import express from 'express'
import * as authMiddleware from '../middleware/auth.middleware.js'
import * as chatController from '../controllers/chat.controller.js'

const router = express.Router()

router.post('/:chatbotId/chat', authMiddleware.authenticateToken, chatController.chatController)
router.get(
  '/:chatbotId/chat-sessions',
  authMiddleware.authenticateToken,
  chatController.getChatSessions
)

// Export routes
router.get(
  '/:chatbotId/export/json',
  authMiddleware.authenticateToken,
  chatController.exportChatsAsJSON
)
router.get(
  '/:chatbotId/export/csv',
  authMiddleware.authenticateToken,
  chatController.exportChatsAsCSV
)
router.get(
  '/:chatbotId/export/pdf',
  authMiddleware.authenticateToken,
  chatController.exportChatsAsPDF
)

// These must be last — /:sessionId is a catch-all param
router.get(
  '/:chatbotId/:sessionId',
  authMiddleware.authenticateToken,
  chatController.getChatSession
)
router.delete(
  '/:chatbotId/:sessionId',
  authMiddleware.authenticateToken,
  chatController.deleteChatSession
)

export default router
