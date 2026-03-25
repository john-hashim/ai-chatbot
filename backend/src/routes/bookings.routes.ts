import express from 'express'
import * as authMiddleware from '../middleware/auth.middleware.js'
import * as bookingsController from '../controllers/bookings.controller.js'

const router = express.Router()

router.post(
  '/:chatbotId/availability',
  authMiddleware.authenticateToken,
  bookingsController.createAvailability
)
router.get('/:chatbotId/availability', bookingsController.getAvailability)
router.patch(
  '/:chatbotId/availability/:slotId',
  authMiddleware.authenticateToken,
  bookingsController.updateTimeSlots
)
router.delete(
  '/:chatbotId/availability/:slotId',
  authMiddleware.authenticateToken,
  bookingsController.deleteSlot
)

router.get(
  '/:chatbotId/booking-config',
  authMiddleware.authenticateToken,
  bookingsController.getBookingConfig
)
router.patch(
  '/:chatbotId/booking-config',
  authMiddleware.authenticateToken,
  bookingsController.updateBookingConfig
)

router.post('/:chatbotId/booking/timeslots', bookingsController.getTimeSlotsForDate)

export default router
