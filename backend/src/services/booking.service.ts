import { Prisma, type Appointment } from '@prisma/client'
import { prisma } from '../prisma/client.js'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'
import customParseFormat from 'dayjs/plugin/customParseFormat.js'
import { createCalendarEvent } from './calendar.service.js'
import {
  sendBookingConfirmationToUser,
  sendBookingNotificationToOwner,
} from './email.service.js'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

const getNextWeekdays = (weekday: number, count: number): string[] => {
  const today = dayjs()
  const firstOccurrence =
    today.day() === weekday ? today : today.add((weekday - today.day() + 7) % 7, 'day')

  return Array.from({ length: count }, (_, i) =>
    firstOccurrence.add(i * 7, 'day').format('YYYY-MM-DD')
  )
}

export async function getAvailabilitiesAsString(chatbotId: string) {
  try {
    const availabilities = await prisma.availabilitySchedule.findMany({
      where: { chatbotId },
      orderBy: { createdAt: 'asc' },
    })
    if (availabilities.length === 0) {
      return []
    } else {
      const today = dayjs().format('YYYY-MM-DD')
      let dates = availabilities
        .map(
          availability =>
            availability.specificDate && dayjs.utc(availability.specificDate).format('YYYY-MM-DD')
        )
        .filter((date): date is string => date !== null && date >= today)

      let days = availabilities
        .filter(availability => availability.scheduleType === 'WEEKLY')
        .map(availability => availability.dayOfWeek && availability.dayOfWeek)
        .filter((day): day is number => day !== null)
      const weekdayDates = days.flatMap(day => getNextWeekdays(day, 4)) || []
      return [...new Set([...dates, ...weekdayDates])].sort()
    }
  } catch {
    return []
  }
}

export async function getAvailableTimeslots(chatbotId: string, date: string): Promise<string[]> {
  try {
    const parsedDate = dayjs.utc(date)
    if (!parsedDate.isValid()) return []

    const dayOfWeek = parsedDate.day()

    const [availabilities, bookingConfig] = await Promise.all([
      prisma.availabilitySchedule.findMany({
        where: {
          chatbotId,
          OR: [
            { scheduleType: 'SPECIFIC_DATE', specificDate: parsedDate.toDate() },
            { scheduleType: 'WEEKLY', dayOfWeek },
          ],
        },
      }),
      prisma.bookingConfig.findUnique({ where: { chatbotId } }),
    ])

    const duration = bookingConfig?.appointmentDuration ?? 30

    const timeslots = availabilities
      .flatMap(a => a.timeSlots as { startTime: string; endTime: string }[])
      .flatMap(slot => {
        const isISO = slot.startTime.includes('T')
        const start = isISO ? dayjs(slot.startTime) : dayjs(`${date} ${slot.startTime}`, 'YYYY-MM-DD HH:mm')
        const end = isISO ? dayjs(slot.endTime) : dayjs(`${date} ${slot.endTime}`, 'YYYY-MM-DD HH:mm')
        const slots: string[] = []
        let current = start
        while (current.isBefore(end)) {
          slots.push(current.format('HH:mm'))
          current = current.add(duration, 'minute')
        }
        return slots
      })
      .sort()

    const uniqueTimeslots = [...new Set(timeslots)]

    const bookedAppointments = await prisma.appointment.findMany({
      where: { chatbotId, date, status: 'CONFIRMED' },
      select: { timeslot: true },
    })
    const bookedTimes = new Set(bookedAppointments.map(a => a.timeslot))

    return uniqueTimeslots.filter(t => !bookedTimes.has(t))
  } catch {
    return []
  }
}

export type ConfirmBookingInput = {
  chatbotId: string
  sessionId: string
  date: string
  timeslot: string
  name: string
  email: string
}

export type ConfirmBookingResult =
  | { status: 'unavailable' }
  | { status: 'confirmed'; appointment: Appointment; isNew: boolean }

/**
 * Owns the full "confirm a booking" side-effect chain: availability re-check,
 * idempotent appointment insert, calendar event, confirmation emails.
 * The action handler stays a thin presentation layer on top of this.
 */
export async function confirmBooking(input: ConfirmBookingInput): Promise<ConfirmBookingResult> {
  const { chatbotId, sessionId, date, timeslot, name, email } = input

  const available = await getAvailableTimeslots(chatbotId, date)
  if (!available.includes(timeslot)) return { status: 'unavailable' }

  let appointment: Appointment
  let isNew = true
  try {
    appointment = await prisma.appointment.create({
      data: { chatbotId, sessionId, name, email, date, timeslot, status: 'CONFIRMED' },
    })
  } catch (err) {
    // P2002 = same (sessionId, date, timeslot) already inserted. Treat as success.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      const existing = await prisma.appointment.findFirst({
        where: { sessionId, date, timeslot },
      })
      if (!existing) throw err
      appointment = existing
      isNew = false
    } else {
      throw err
    }
  }

  if (isNew) await notifyBookingConfirmed(input)
  return { status: 'confirmed', appointment, isNew }
}

async function notifyBookingConfirmed(input: ConfirmBookingInput): Promise<void> {
  const { chatbotId, date, timeslot, name, email } = input

  const [bookingConfig, chatbot] = await Promise.all([
    prisma.bookingConfig.findUnique({ where: { chatbotId } }),
    prisma.chatbot.findUnique({ where: { id: chatbotId }, include: { user: true } }),
  ])

  const tz = bookingConfig?.timezone ?? 'UTC'
  const eventType = chatbot?.name ?? 'Appointment'
  const locType = bookingConfig?.locationType
  const configuredLocation =
    locType === 'IN_PERSON' ? bookingConfig?.locationAddress ?? undefined :
    locType === 'PHONE' ? bookingConfig?.locationPhone ?? undefined :
    locType === 'ZOOM' ? 'Zoom' :
    undefined

  // Await the calendar event so Google's auto-generated Meet link can be
  // included in the email. .catch returns null so a calendar failure never
  // blocks the email.
  const start = dayjs(`${date}T${timeslot}`)
  const end = start.add(bookingConfig?.appointmentDuration ?? 30, 'minute')
  const event = start.isValid()
    ? await createCalendarEvent(chatbotId, {
        summary: `${eventType} with ${name}`,
        description: `Booking via Pulsechat.\nInvitee: ${name} (${email})`,
        startDateTime: start.format('YYYY-MM-DDTHH:mm:ss'),
        endDateTime: end.format('YYYY-MM-DDTHH:mm:ss'),
        timeZone: tz,
        attendees: [{ email, displayName: name }],
        location: configuredLocation,
        withGoogleMeet: locType === 'GOOGLE_MEET',
      }).catch(err => {
        console.error('Failed to create calendar event:', err)
        return null
      })
    : null

  const meetLink =
    locType === 'GOOGLE_MEET'
      ? event?.hangoutLink ||
        event?.conferenceData?.entryPoints?.find(e => e.entryPointType === 'video')?.uri
      : undefined
  const emailLocation = meetLink
    ? `<a href="${meetLink}" style="color:#FF584A;">${meetLink}</a>`
    : configuredLocation

  const fields = {
    eventType,
    inviteeName: name,
    inviteeEmail: email,
    date,
    timeslot,
    timezone: tz,
    ...(emailLocation && { location: emailLocation }),
  }

  sendBookingConfirmationToUser(fields).catch(console.error)
  if (bookingConfig?.notificationEmail) {
    sendBookingNotificationToOwner(
      bookingConfig.notificationEmail,
      chatbot?.user?.name ?? null,
      fields
    ).catch(console.error)
  }
}
