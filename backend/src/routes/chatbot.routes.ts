import express from 'express'
import * as authMiddleware from '../middleware/auth.middleware.js'
import * as uploadMiddleware from '../middleware/upload.middleware.js'
import * as chatbotController from '../controllers/chatbot.controller.js'

const router = express.Router()

router.post('/create', authMiddleware.authenticateToken, chatbotController.createChatbot)
router.get('/chatbots', authMiddleware.authenticateToken, chatbotController.getChatbots)
router.get('/:chatbotId', authMiddleware.authenticateToken, chatbotController.getChatbot)
router.patch('/:chatbotId', authMiddleware.authenticateToken, chatbotController.updateChatbot)
router.delete('/:chatbotId', authMiddleware.authenticateToken, chatbotController.deleteChatbot)
router.post(
  '/upload-url',
  authMiddleware.authenticateToken,
  chatbotController.getPresignedUploadUrl
)
router.post('/delete-file', authMiddleware.authenticateToken, chatbotController.deleteFile)
router.post(
  '/:chatbotId/upload-document',
  authMiddleware.authenticateToken,
  uploadMiddleware.uploadMultipleDocuments,
  chatbotController.uploadDocument
)
router.post(
  '/:chatbotId/upload-text',
  authMiddleware.authenticateToken,
  chatbotController.uploadText
)
router.post(
  '/:chatbotId/crawl-website',
  authMiddleware.authenticateToken,
  chatbotController.crawlWebsite
)
router.delete(
  '/documents/:documentId',
  authMiddleware.authenticateToken,
  chatbotController.deleteDocument
)
router.post(
  '/documents/delete-multiple',
  authMiddleware.authenticateToken,
  chatbotController.deleteMultipleDocuments
)

// Training routes
router.post('/:chatbotId/train', authMiddleware.authenticateToken, chatbotController.trainDocuments)
router.get(
  '/:chatbotId/training-status',
  authMiddleware.authenticateToken,
  chatbotController.getTrainingStatus
)

export default router
