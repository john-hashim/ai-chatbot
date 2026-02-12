import express from 'express'
import * as authMiddleware from '../middleware/auth.middleware.js'
import * as chatbotController from '../controllers/chatbot.controller.js'

const router = express.Router()

router.post('/create', authMiddleware.authenticateToken, chatbotController.createChatbot)
router.get('/chatbots', authMiddleware.authenticateToken, chatbotController.getChatbots)
router.post(
  '/:chatbotId/embed',
  authMiddleware.authenticateToken,
  chatbotController.createEmbedConfig
)
router.get(
  '/:chatbotId/embed',
  authMiddleware.authenticateToken,
  chatbotController.getEmbedConfigAdmin
)
router.patch(
  '/:chatbotId/embed',
  authMiddleware.authenticateToken,
  chatbotController.updateEmbedConfig
)
router.get('/:chatbotId', authMiddleware.authenticateToken, chatbotController.getChatbot)
router.patch('/:chatbotId', authMiddleware.authenticateToken, chatbotController.updateChatbot)
router.delete('/:chatbotId', authMiddleware.authenticateToken, chatbotController.deleteChatbot)

export default router
