import { getAvailabilitiesAsString } from '../services/booking.service.js'

export type ActionResult = {
  message: string
  meta?: Record<string, unknown>
}

export type ActionHandler = (chatbotId: string) => Promise<ActionResult>

export const actionHandlers: Record<string, ActionHandler> = {
  BOOKING: async (chatbotId) => {
    const dates = await getAvailabilitiesAsString(chatbotId)
    if (dates.length === 0) {
      return { message: 'Sorry, there are no available dates right now. Please check back later.' }
    }
    return {
      message: `Here are the available dates for booking: ${dates.join(', ')}. Please select one.`,
      meta: { dates },
    }
  },
}
