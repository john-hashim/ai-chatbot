import express from 'express'
import * as embedMiddleware from '../middleware/embed.middleware.js'
import * as embedController from '../controllers/embed.controller.js'
import * as chatController from '../controllers/chat.controller.js'
import * as bookingsController from '../controllers/bookings.controller.js'

const router = express.Router()

router.get('/:embedKey/config', embedMiddleware.authenticateEmbed, embedController.getEmbedConfig)
router.post('/:embedKey/chat', embedMiddleware.authenticateEmbed, chatController.chatController)

router.get(
  '/:embedKey/sessions',
  embedMiddleware.authenticateEmbed,
  chatController.getChatSessions
)
router.get(
  '/:embedKey/sessions/:sessionId',
  embedMiddleware.authenticateEmbed,
  chatController.getChatSession
)

router.post(
  '/:embedKey/end-user-sessions',
  embedMiddleware.authenticateEmbed,
  chatController.getChatSessionsByEndUser
)

router.get(
  '/:embedKey/:sessionId/download',
  embedMiddleware.authenticateEmbed,
  chatController.downloadChatSession
)

router.patch(
  '/:embedKey/:sessionId/:messageId',
  embedMiddleware.authenticateEmbed,
  chatController.updateMessage
)

router.post(
  '/:embedKey/booking/timeslots',
  embedMiddleware.authenticateEmbed,
  bookingsController.getTimeSlotsForDate
)

export default router
