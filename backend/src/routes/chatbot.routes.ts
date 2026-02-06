import express from 'express'
import * as authMiddleware from '../middleware/auth.middleware.js'
import * as chatbotController from '../controllers/chatbot.controller.js'

const router = express.Router()

router.post('/create', authMiddleware.authenticateToken, chatbotController.createChatbot)
router.get('/chatbots', authMiddleware.authenticateToken, chatbotController.getChatbots)
router.get('/:chatbotId', authMiddleware.authenticateToken, chatbotController.getChatbot)
router.patch('/:chatbotId', authMiddleware.authenticateToken, chatbotController.updateChatbot)
router.delete('/:chatbotId', authMiddleware.authenticateToken, chatbotController.deleteChatbot)

export default router
