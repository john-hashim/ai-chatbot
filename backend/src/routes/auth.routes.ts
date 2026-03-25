// src/routes/auth.routes.ts
import express from 'express'
import * as authController from '../controllers/auth.controller.js'
import * as authMiddleware from '../middleware/auth.middleware.js'

const router = express.Router()

router.post('/google/signin', authController.googleSignIn)
router.post('/logout', authMiddleware.authenticateToken, authController.logout)
router.get('/me', authMiddleware.authenticateToken, authController.getMe)
router.patch('/me/avatar', authMiddleware.authenticateToken, authController.updateAvatar)
router.patch('/me/name', authMiddleware.authenticateToken, authController.updateName)
router.patch('/me/email', authMiddleware.authenticateToken, authController.updateEmail)
router.delete('/me', authMiddleware.authenticateToken, authController.deleteAccount)

export default router
