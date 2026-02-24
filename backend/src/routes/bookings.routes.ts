import express from 'express'
import * as authMiddleware from '../middleware/auth.middleware.js'
import * as bookingsController from '../controllers/bookings.controller.js'

const router = express.Router()

router.post('/:chatbotId/availability', authMiddleware.authenticateToken, bookingsController.createAvailability)
router.get('/:chatbotId/availability', bookingsController.getAvailability)
router.patch('/:chatbotId/availability/:slotId', authMiddleware.authenticateToken, bookingsController.updateTimeSlots)
router.delete('/:chatbotId/availability/:slotId', authMiddleware.authenticateToken, bookingsController.deleteSlot)

export default router
