import dayjs from 'dayjs'
import advancedFormat from 'dayjs/plugin/advancedFormat.js'
import { prisma } from '../prisma/client.js'
import { getAvailabilitiesAsString, getAvailableTimeslots } from '../services/booking.service.js'

dayjs.extend(advancedFormat)

export type AvailableDate = { value: string; label: string }
export type AvailableTimeslot = { value: string; label: string }

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
    const rawTimeslots = await getAvailableTimeslots(chatbotId, date)
    if (rawTimeslots.length === 0) {
      return {
        message: `Sorry, there are no available time slots for ${date}. Please choose a different date.`,
      }
    }
    const timeslots: AvailableTimeslot[] = rawTimeslots.map(value => ({
      value,
      label: dayjs(value, 'HH:mm').format('hh:mm A'),
    }))
    return {
      message: `Here are the available time slots for ${date}: ${rawTimeslots.join(', ')}. Please select one.`,
      meta: { date, timeslots },
    }
  },

  BOOKING_CANCEL: async () => {
    return {
      message:
        '[Booking cancelled by user] No problem! Is there anything else I can help you with?',
    }
  },

  CONFIRM_TIME: async (chatbotId, { message }) => {
    const dateMatch = message.match(/"booking_confirm_date"\s*:\s*"(\d{4}-\d{2}-\d{2})"/)
    const timeMatch = message.match(/"booking_confirm_time"\s*:\s*"(\d{2}:\d{2})"/)

    if (!dateMatch || !timeMatch) {
      return { message: 'I could not read the selected date and time. Please try again.' }
    }

    const date = dateMatch[1]!
    const timeslot = timeMatch[1]!

    const availableTimeslots = await getAvailableTimeslots(chatbotId, date)
    if (!availableTimeslots.includes(timeslot)) {
      return {
        message: `Sorry, the slot ${timeslot} on ${date} is no longer available. Please choose a different time.`,
      }
    }

    return {
      message: 'Almost done. Please share your name and email to confirm the appointment.',
      meta: { date, timeslot },
    }
  },

  BOOKING_CONFIRM: async (chatbotId, { message, sessionId }) => {
    const dateMatch = message.match(/"booking_confirm_date"\s*:\s*"(\d{4}-\d{2}-\d{2})"/)
    const timeMatch = message.match(/"booking_confirm_time"\s*:\s*"(\d{2}:\d{2})"/)
    const nameMatch = message.match(/"name"\s*:\s*"([^"]+)"/)
    const emailMatch = message.match(/"email"\s*:\s*"([^"]+)"/)

    if (!dateMatch || !timeMatch || !nameMatch || !emailMatch) {
      return { message: 'I could not read all the booking details. Please try again.' }
    }

    const date = dateMatch[1]!
    const timeslot = timeMatch[1]!
    const name = nameMatch[1]!
    const email = emailMatch[1]!

    const availableTimeslots = await getAvailableTimeslots(chatbotId, date)
    if (!availableTimeslots.includes(timeslot)) {
      return {
        message: `Sorry, the slot ${timeslot} on ${date} is no longer available. Please choose a different time.`,
      }
    }

    const appointment = await prisma.appointment.create({
      data: {
        chatbotId,
        sessionId,
        name,
        email,
        date,
        timeslot,
        status: 'CONFIRMED',
      },
    })

    const prettyDate = dayjs(date).format('Do MMM YYYY, dddd')
    const prettyTime = dayjs(timeslot, 'HH:mm').format('hh:mm A')

    return {
      message: `${name}, Your appointment is confirmed for ${prettyDate} at ${prettyTime}.`,
      meta: {
        appointmentId: appointment.id,
        date,
        timeslot,
        name,
        email,
        prettyDate,
        prettyTime,
      },
    }
  },
}
