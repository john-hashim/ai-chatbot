import dayjs from 'dayjs'
import advancedFormat from 'dayjs/plugin/advancedFormat.js'
import {
  confirmBooking,
  getAvailabilitiesAsString,
  getAvailableTimeslots,
} from '../services/booking.service.js'
import type { BookingDraft } from '../services/booking-flow.service.js'
import { prisma } from '../prisma/client.js'
import { LeadType } from '@prisma/client'
import { captureLead } from '../services/lead.service.js'

dayjs.extend(advancedFormat)

export type AvailableDate = { value: string; label: string }
export type AvailableTimeslot = { value: string; label: string }

export type ActionResult = {
  message: string
  meta?: Record<string, unknown>
}

export type ActionContext = {
  chatbotId: string
  sessionId: string
  draft: BookingDraft
}

export type ActionHandler = (ctx: ActionContext) => Promise<ActionResult>

export const actionHandlers: Record<string, ActionHandler> = {
  BOOKING: async ({ chatbotId }) => {
    const config = await prisma.bookingConfig.findUnique({
      where: { chatbotId },
      select: { isEnabled: true },
    })
    if (config && !config.isEnabled) {
      return { message: 'Sorry, there are no available dates right now. Please check back later.' }
    }
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

  CONFIRM_DATE: async ({ chatbotId, draft }) => {
    if (!draft.date) {
      return { message: 'I could not determine the date you selected. Please try again.' }
    }
    const date = draft.date
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
        'No worries, I’ve cancelled that for you. Is there anything else I can help you with?',
    }
  },

  CONFIRM_TIME: async ({ chatbotId, draft }) => {
    if (!draft.date || !draft.time) {
      return { message: 'I could not read the selected date and time. Please try again.' }
    }

    const availableTimeslots = await getAvailableTimeslots(chatbotId, draft.date)
    if (!availableTimeslots.includes(draft.time)) {
      return {
        message: `Sorry, the slot ${draft.time} on ${draft.date} is no longer available. Please choose a different time.`,
      }
    }

    return {
      message: 'Almost done. Please share your name and email to confirm the appointment.',
      meta: { date: draft.date, timeslot: draft.time },
    }
  },

  BOOKING_CONFIRM: async ({ chatbotId, sessionId, draft }) => {
    if (!draft.date || !draft.time || !draft.name || !draft.email) {
      return { message: 'I could not read all the booking details. Please try again.' }
    }

    const { date, time: timeslot, name, email } = draft
    const result = await confirmBooking({ chatbotId, sessionId, date, timeslot, name, email })

    if (result.status === 'unavailable') {
      return {
        message: `Sorry, the slot ${timeslot} on ${date} is no longer available. Please choose a different time.`,
      }
    }

    // Every confirmed booking is a captured lead — record it on the kanbans.
    // Fire-and-forget: lead bookkeeping must never fail the booking reply.
    captureLead({
      chatbotId,
      sessionId,
      type: LeadType.BOOKING,
      trigger: 'booking',
      name,
      email,
      meta: { appointmentId: result.appointment.id, date, timeslot },
    }).catch(err => console.error('Booking lead capture failed:', err))

    const prettyDate = dayjs(date).format('Do MMM YYYY, dddd')
    const prettyTime = dayjs(timeslot, 'HH:mm').format('hh:mm A')
    return {
      message: `${name}, your appointment is confirmed for ${prettyDate} at ${prettyTime}.`,
      meta: {
        appointmentId: result.appointment.id,
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
