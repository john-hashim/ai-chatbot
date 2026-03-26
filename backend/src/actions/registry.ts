import dayjs from 'dayjs'
import advancedFormat from 'dayjs/plugin/advancedFormat.js'
import { getAvailabilitiesAsString, getAvailableTimeslots } from '../services/booking.service.js'

dayjs.extend(advancedFormat)

export type AvailableDate = { value: string; label: string }

export type ActionResult = {
  message: string
  meta?: Record<string, unknown>
}

export type ActionContext = {
  message: string
  sessionId: string
}

export type ActionHandler = (chatbotId: string, ctx: ActionContext) => Promise<ActionResult>

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

  BOOKING_STEP2: async (chatbotId, { message }) => {
    const dateMatch = message.match(/\d{4}-\d{2}-\d{2}/)
    if (!dateMatch) {
      return { message: 'I could not determine the date you selected. Please try again.' }
    }
    const date = dateMatch[0]
    const timeslots = await getAvailableTimeslots(chatbotId, date)
    if (timeslots.length === 0) {
      return { message: `Sorry, there are no available time slots for ${date}. Please choose a different date.` }
    }
    return {
      message: `Here are the available time slots for ${date}: ${timeslots.join(', ')}. Please select one.`,
      meta: { date, timeslots },
    }
  },

  BOOKING_CANCEL: async () => {
    return { message: '[Booking cancelled by user] No problem! Is there anything else I can help you with?' }
  },
}
