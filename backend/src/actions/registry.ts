import dayjs from 'dayjs'
import advancedFormat from 'dayjs/plugin/advancedFormat.js'
import { Prisma } from '@prisma/client'
import { prisma } from '../prisma/client.js'
import { getAvailabilitiesAsString, getAvailableTimeslots } from '../services/booking.service.js'
import type { BookingDraft } from '../services/booking-flow.service.js'
import {
  sendBookingConfirmationToUser,
  sendBookingNotificationToOwner,
} from '../services/email.service.js'
import { createCalendarEvent } from '../services/calendar.service.js'

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

    const availableTimeslots = await getAvailableTimeslots(chatbotId, date)
    if (!availableTimeslots.includes(timeslot)) {
      return {
        message: `Sorry, the slot ${timeslot} on ${date} is no longer available. Please choose a different time.`,
      }
    }

    let appointment
    let isNewBooking = true
    try {
      appointment = await prisma.appointment.create({
        data: { chatbotId, sessionId, name, email, date, timeslot, status: 'CONFIRMED' },
      })
    } catch (err) {
      // Idempotency: a duplicate (sessionId, date, timeslot) means the user
      // already confirmed this exact slot — surface success referencing the
      // existing row instead of erroring out.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        appointment = await prisma.appointment.findFirst({
          where: { sessionId, date, timeslot },
        })
        if (!appointment) throw err
        isNewBooking = false
      } else {
        throw err
      }
    }

    const prettyDate = dayjs(date).format('Do MMM YYYY, dddd')
    const prettyTime = dayjs(timeslot, 'HH:mm').format('hh:mm A')

    if (isNewBooking) {
      const [bookingConfig, chatbot] = await Promise.all([
        prisma.bookingConfig.findUnique({ where: { chatbotId } }),
        prisma.chatbot.findUnique({
          where: { id: chatbotId },
          include: { user: true },
        }),
      ])

      const tz = bookingConfig?.timezone ?? 'UTC'
      const eventType = chatbot?.name ?? 'Appointment'

      const fields = {
        eventType,
        inviteeName: name,
        inviteeEmail: email,
        date,
        timeslot,
        timezone: tz,
      }

      sendBookingConfirmationToUser(fields).catch(console.error)
      if (bookingConfig?.notificationEmail) {
        sendBookingNotificationToOwner(
          bookingConfig.notificationEmail,
          chatbot?.user?.name ?? null,
          fields
        ).catch(console.error)
      }

      const durationMinutes = bookingConfig?.appointmentDuration ?? 30
      const start = dayjs(`${date}T${timeslot}`)
      if (start.isValid()) {
        const end = start.add(durationMinutes, 'minute')
        createCalendarEvent(chatbotId, {
          summary: `${eventType} with ${name}`,
          description: `Booking via Pulsechat.\nInvitee: ${name} (${email})`,
          startDateTime: start.format('YYYY-MM-DDTHH:mm:ss'),
          endDateTime: end.format('YYYY-MM-DDTHH:mm:ss'),
          timeZone: tz,
          attendees: [{ email, displayName: name }],
        }).catch(err => console.error('Failed to create calendar event:', err))
      }
    }

    return {
      message: `${name}, your appointment is confirmed for ${prettyDate} at ${prettyTime}.`,
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
