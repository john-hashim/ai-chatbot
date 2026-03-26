import dayjs from 'dayjs'
import advancedFormat from 'dayjs/plugin/advancedFormat.js'
import { getAvailabilitiesAsString } from '../services/booking.service.js'

dayjs.extend(advancedFormat)

export type AvailableDate = { value: string; label: string }

export type ActionResult = {
  message: string
  meta?: Record<string, unknown>
}

export type ActionHandler = (chatbotId: string) => Promise<ActionResult>

export const actionHandlers: Record<string, ActionHandler> = {
  BOOKING: async chatbotId => {
    const rawDates = await getAvailabilitiesAsString(chatbotId)
    if (rawDates.length === 0) {
      return { message: 'Sorry, there are no available dates right now. Please check back later.' }
    }
    const dates: AvailableDate[] = rawDates.map(value => ({
      value,
      label: dayjs(value).format('Do MMM YYYY, dddd'),
    }))
    return {
      message: `Here are the available dates for booking: ${rawDates.join(', ')}. Please select one.`,
      meta: { dates },
    }
  },
}
