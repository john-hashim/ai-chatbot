// src/routes/auth.routes.ts
import express from 'express'
import * as authController from '../controllers/auth.controller.js'
import * as authMiddleware from '../middleware/auth.middleware.js'

const router = express.Router()

router.post('/google/signin', authController.googleSignIn)
router.post('/logout', authMiddleware.authenticateToken, authController.logout)
router.get('/me', authMiddleware.authenticateToken, authController.getMe)

export default router
