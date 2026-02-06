import express from 'express'
import * as authMiddleware from '../middleware/auth.middleware.js'
import * as uploadMiddleware from '../middleware/upload.middleware.js'
import * as documentController from '../controllers/document.controller.js'

const router = express.Router()

router.post(
  '/upload-url',
  authMiddleware.authenticateToken,
  documentController.getPresignedUploadUrl
)
router.post('/delete-file', authMiddleware.authenticateToken, documentController.deleteFile)
router.post(
  '/:chatbotId/upload-document',
  authMiddleware.authenticateToken,
  uploadMiddleware.uploadMultipleDocuments,
  documentController.uploadDocument
)
router.post(
  '/:chatbotId/upload-text',
  authMiddleware.authenticateToken,
  documentController.uploadText
)
router.post(
  '/:chatbotId/crawl-website',
  authMiddleware.authenticateToken,
  documentController.crawlWebsite
)
router.delete(
  '/documents/:documentId',
  authMiddleware.authenticateToken,
  documentController.deleteDocument
)
router.post(
  '/documents/delete-multiple',
  authMiddleware.authenticateToken,
  documentController.deleteMultipleDocuments
)

// Training routes
router.post(
  '/:chatbotId/train',
  authMiddleware.authenticateToken,
  documentController.trainDocuments
)
router.get(
  '/:chatbotId/training-status',
  authMiddleware.authenticateToken,
  documentController.getTrainingStatus
)

export default router
