import type { NextFunction, Request, Response } from 'express'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'
import customParseFormat from 'dayjs/plugin/customParseFormat.js'
import { Prisma } from '@prisma/client'
import PDFDocument from 'pdfkit'
import { ApiStatus, type ApiResponse } from '../types/api.js'
import { prisma } from '../prisma/client.js'
import { cancelAppointment as cancelAppointmentService } from '../services/booking.service.js'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

function localToUTC(date: string, time: string, tz: string): string {
  return dayjs.tz(`${date} ${time}`, 'YYYY-MM-DD HH:mm', tz).utc().toISOString()
}

export const createAvailability = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { chatbotId } = req.params

    if (!chatbotId) {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'Chatbot ID is required',
      } satisfies ApiResponse)
    }

    const { timezone: tz, scheduleType, timeSlots } = req.body

    if (!tz || !scheduleType) {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'timezone and scheduleType are required',
      } satisfies ApiResponse)
    }

    if (!Array.isArray(timeSlots) || timeSlots.length === 0) {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'timeSlots array is required and must not be empty',
      } satisfies ApiResponse)
    }

    if (scheduleType === 'WEEKLY') {
      const { dayOfWeek } = req.body

      if (dayOfWeek === undefined) {
        return res.status(400).json({
          status: ApiStatus.FAILURE,
          message: 'dayOfWeek is required for WEEKLY schedule',
        } satisfies ApiResponse)
      }

      const existing = await prisma.availabilitySchedule.findFirst({
        where: { chatbotId, scheduleType: 'WEEKLY', dayOfWeek: Number(dayOfWeek) },
      })

      if (existing) {
        const merged = [
          ...(existing.timeSlots as { startTime: string; endTime: string }[]),
          ...timeSlots,
        ]
        const updated = await prisma.availabilitySchedule.update({
          where: { id: existing.id },
          data: { timeSlots: merged },
        })
        return res.status(200).json({
          status: ApiStatus.SUCCESS,
          message: 'Time slot appended successfully',
          data: updated,
        } satisfies ApiResponse)
      }

      const availability = await prisma.availabilitySchedule.create({
        data: {
          chatbotId,
          timezone: tz,
          scheduleType,
          dayOfWeek: Number(dayOfWeek),
          timeSlots,
        },
      })

      return res.status(201).json({
        status: ApiStatus.SUCCESS,
        message: 'Availability created successfully',
        data: availability,
      } satisfies ApiResponse)
    }

    if (scheduleType === 'SPECIFIC_DATE') {
      const { specificDates } = req.body

      if (!Array.isArray(specificDates) || specificDates.length === 0) {
        return res.status(400).json({
          status: ApiStatus.FAILURE,
          message: 'specificDates array is required for SPECIFIC_DATE schedule',
        } satisfies ApiResponse)
      }

      const results = await Promise.all(
        specificDates.map(async (date: string) => {
          const normalizedSlots = timeSlots.map(
            ({ startTime, endTime }: { startTime: string; endTime: string }) => ({
              startTime: localToUTC(date, startTime, tz),
              endTime: localToUTC(date, endTime, tz),
            })
          )

          const existing = await prisma.availabilitySchedule.findFirst({
            where: { chatbotId, scheduleType: 'SPECIFIC_DATE', specificDate: new Date(date) },
          })

          if (existing) {
            const merged = [
              ...(existing.timeSlots as { startTime: string; endTime: string }[]),
              ...normalizedSlots,
            ]
            return prisma.availabilitySchedule.update({
              where: { id: existing.id },
              data: { timeSlots: merged },
            })
          }

          return prisma.availabilitySchedule.create({
            data: {
              chatbotId,
              timezone: tz,
              scheduleType,
              specificDate: new Date(date),
              timeSlots: normalizedSlots,
            },
          })
        })
      )

      return res.status(201).json({
        status: ApiStatus.SUCCESS,
        message: 'Availability created successfully',
        data: results,
      } satisfies ApiResponse)
    }

    return res.status(400).json({
      status: ApiStatus.FAILURE,
      message: 'scheduleType must be WEEKLY or SPECIFIC_DATE',
    } satisfies ApiResponse)
  } catch (error) {
    next(error)
  }
}

export const getAvailability = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { chatbotId } = req.params

    if (!chatbotId) {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'Chatbot ID is required',
      } satisfies ApiResponse)
    }

    const schedules = await prisma.availabilitySchedule.findMany({
      where: { chatbotId },
      orderBy: { createdAt: 'asc' },
    })

    return res.status(200).json({
      status: ApiStatus.SUCCESS,
      message: 'Availability fetched successfully',
      data: schedules,
    } satisfies ApiResponse)
  } catch (error) {
    next(error)
  }
}

// PATCH /:chatbotId/availability/:slotId
// Payload for WEEKLY:        { timeSlots: [{ startTime: "09:00", endTime: "12:00" }] }
// Payload for SPECIFIC_DATE: { specificDate: "2026-02-24", timeSlots: [{ startTime: "09:00", endTime: "12:00" }] }
export const updateTimeSlots = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { chatbotId, slotId } = req.params
    const { timeSlots, specificDate } = req.body

    if (!chatbotId || !slotId) {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'Chatbot ID and slot ID are required',
      } satisfies ApiResponse)
    }

    if (!Array.isArray(timeSlots) || timeSlots.length === 0) {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'timeSlots array is required and must not be empty',
      } satisfies ApiResponse)
    }

    const schedule = await prisma.availabilitySchedule.findFirst({
      where: { id: slotId, chatbotId },
    })

    if (!schedule) {
      return res.status(404).json({
        status: ApiStatus.FAILURE,
        message: 'Availability slot not found',
      } satisfies ApiResponse)
    }

    if (schedule.scheduleType !== 'WEEKLY' && !specificDate) {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'specificDate is required for SPECIFIC_DATE schedule',
      } satisfies ApiResponse)
    }

    const normalizedSlots =
      schedule.scheduleType === 'WEEKLY'
        ? timeSlots
        : timeSlots.map(({ startTime, endTime }: { startTime: string; endTime: string }) => ({
            startTime: localToUTC(specificDate, startTime, schedule.timezone),
            endTime: localToUTC(specificDate, endTime, schedule.timezone),
          }))

    const updated = await prisma.availabilitySchedule.update({
      where: { id: slotId },
      data: { timeSlots: normalizedSlots },
    })

    return res.status(200).json({
      status: ApiStatus.SUCCESS,
      message: 'Time slots updated successfully',
      data: updated,
    } satisfies ApiResponse)
  } catch (error) {
    next(error)
  }
}

export const getBookingConfig = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { chatbotId } = req.params

    if (!chatbotId) {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'Chatbot ID is required',
      } satisfies ApiResponse)
    }

    const config = await prisma.bookingConfig.findUnique({
      where: { chatbotId },
    })

    return res.status(200).json({
      status: ApiStatus.SUCCESS,
      message: 'Booking config fetched successfully',
      data: config,
    } satisfies ApiResponse)
  } catch (error) {
    next(error)
  }
}

export const updateBookingConfig = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { chatbotId } = req.params

    if (!chatbotId) {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'Chatbot ID is required',
      } satisfies ApiResponse)
    }

    const {
      isEnabled,
      timezone: tz,
      appointmentDuration,
      notificationEmail,
      locationType,
      locationAddress,
      locationPhone,
    } = req.body

    if (
      isEnabled === undefined &&
      tz === undefined &&
      appointmentDuration === undefined &&
      notificationEmail === undefined &&
      locationType === undefined &&
      locationAddress === undefined &&
      locationPhone === undefined
    ) {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'At least one field must be provided',
      } satisfies ApiResponse)
    }

    if (
      appointmentDuration !== undefined &&
      (isNaN(Number(appointmentDuration)) || Number(appointmentDuration) <= 0)
    ) {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'appointmentDuration must be a positive number',
      } satisfies ApiResponse)
    }

    const VALID_LOCATION_TYPES = ['GOOGLE_MEET', 'IN_PERSON', 'ZOOM', 'PHONE']
    if (
      locationType !== undefined &&
      locationType !== null &&
      !VALID_LOCATION_TYPES.includes(locationType)
    ) {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'locationType must be GOOGLE_MEET, IN_PERSON, ZOOM, or PHONE',
      } satisfies ApiResponse)
    }

    const config = await prisma.bookingConfig.upsert({
      where: { chatbotId },
      update: {
        ...(isEnabled !== undefined && { isEnabled }),
        ...(tz !== undefined && { timezone: tz }),
        ...(appointmentDuration !== undefined && {
          appointmentDuration: Number(appointmentDuration),
        }),
        ...(notificationEmail !== undefined && { notificationEmail }),
        ...(locationType !== undefined && { locationType }),
        ...(locationAddress !== undefined && { locationAddress }),
        ...(locationPhone !== undefined && { locationPhone }),
      },
      create: {
        chatbotId,
        isEnabled: isEnabled ?? true,
        timezone: tz ?? 'UTC',
        appointmentDuration: appointmentDuration ? Number(appointmentDuration) : 30,
        notificationEmail: notificationEmail ?? null,
        locationType: locationType ?? null,
        locationAddress: locationAddress ?? null,
        locationPhone: locationPhone ?? null,
      },
    })

    return res.status(200).json({
      status: ApiStatus.SUCCESS,
      message: 'Booking config updated successfully',
      data: config,
    } satisfies ApiResponse)
  } catch (error) {
    next(error)
  }
}

export const deleteSlot = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { chatbotId, slotId } = req.params

    if (!chatbotId || !slotId) {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'Chatbot ID and slot ID are required',
      } satisfies ApiResponse)
    }

    const existing = await prisma.availabilitySchedule.findFirst({
      where: { id: slotId, chatbotId },
    })

    if (!existing) {
      return res.status(404).json({
        status: ApiStatus.FAILURE,
        message: 'Availability slot not found',
      } satisfies ApiResponse)
    }

    await prisma.availabilitySchedule.delete({ where: { id: slotId } })

    return res.status(200).json({
      status: ApiStatus.SUCCESS,
      message: 'Availability slot deleted successfully',
    } satisfies ApiResponse)
  } catch (error) {
    next(error)
  }
}

export const getTimeSlotsForDate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { chatbotId } = req.params
    const { sessionId, date } = req.body

    if (!chatbotId) {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'Chatbot ID is required',
      } satisfies ApiResponse)
    }

    if (!sessionId || !date) {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'sessionId and date are required',
      } satisfies ApiResponse)
    }

    const parsedDate = dayjs.utc(date)
    if (!parsedDate.isValid()) {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'Invalid date format',
      } satisfies ApiResponse)
    }

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
        const start = isISO
          ? dayjs(slot.startTime)
          : dayjs(`${date} ${slot.startTime}`, 'YYYY-MM-DD HH:mm')
        const end = isISO
          ? dayjs(slot.endTime)
          : dayjs(`${date} ${slot.endTime}`, 'YYYY-MM-DD HH:mm')

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

    // Filter out already booked slots
    const bookedAppointments = await prisma.appointment.findMany({
      where: { chatbotId, date, status: 'UPCOMING' },
      select: { timeslot: true },
    })
    const bookedTimes = new Set(bookedAppointments.map(a => a.timeslot))
    const availableTimeslots = uniqueTimeslots.filter(t => !bookedTimes.has(t))

    const messageContent =
      availableTimeslots.length === 0
        ? `Sorry, there are no available time slots for ${date}.`
        : `Here are the available time slots for ${date}: ${availableTimeslots.join(', ')}. Please select one.`

    const hasSlots = availableTimeslots.length > 0

    const message = await prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'assistant',
        content: messageContent,
        sources: [],
        isAction: hasSlots,
        actionType: hasSlots ? 'confirm_date' : null,
        actionMeta: hasSlots
          ? ({ date, timeslots: availableTimeslots } as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      },
    })

    return res.status(200).json({
      status: ApiStatus.SUCCESS,
      message: 'Time slots fetched successfully',
      data: { date, timeslots: availableTimeslots, message },
    } satisfies ApiResponse)
  } catch (error) {
    next(error)
  }
}

const PRESET_DATE_FILTERS = [
  'today',
  'tomorrow',
  'yesterday',
  'next7',
  'next30',
  'last7',
  'last30',
  'all-upcoming',
  'all-past',
] as const
type PresetDateFilter = (typeof PRESET_DATE_FILTERS)[number]

function resolveDateFilter(
  filter: string,
  tz: string
):
  | { date: string }
  | { date: { gte: string; lte: string } }
  | { date: { gte: string } }
  | { date: { lt: string } }
  | null {
  const todayLocal = dayjs().tz(tz)
  const today = todayLocal.format('YYYY-MM-DD')

  if ((PRESET_DATE_FILTERS as readonly string[]).includes(filter)) {
    const preset = filter as PresetDateFilter
    switch (preset) {
      case 'today':
        return { date: today }
      case 'tomorrow':
        return { date: todayLocal.add(1, 'day').format('YYYY-MM-DD') }
      case 'yesterday':
        return { date: todayLocal.subtract(1, 'day').format('YYYY-MM-DD') }
      case 'next7':
        return { date: { gte: today, lte: todayLocal.add(7, 'day').format('YYYY-MM-DD') } }
      case 'next30':
        return { date: { gte: today, lte: todayLocal.add(30, 'day').format('YYYY-MM-DD') } }
      case 'last7':
        return { date: { gte: todayLocal.subtract(7, 'day').format('YYYY-MM-DD'), lte: today } }
      case 'last30':
        return { date: { gte: todayLocal.subtract(30, 'day').format('YYYY-MM-DD'), lte: today } }
      case 'all-upcoming':
        return { date: { gte: today } }
      case 'all-past':
        return { date: { lt: today } }
    }
  }

  const parsed = dayjs(filter, 'YYYY-MM-DD', true)
  if (!parsed.isValid()) return null
  return { date: filter }
}

export const getAppointments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { chatbotId } = req.params
    const dateFilterParam =
      typeof req.query.dateFilter === 'string' && req.query.dateFilter.length > 0
        ? req.query.dateFilter
        : null

    if (!chatbotId) {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'Chatbot ID is required',
      } satisfies ApiResponse)
    }

    const config = await prisma.bookingConfig.findUnique({ where: { chatbotId } })
    const fallbackTz = config?.timezone || 'UTC'

    // Lazy-flip: each row uses its own snapshotted timezone (config tz at the
    // time of booking). Falling back to current config tz only for legacy rows
    // that pre-date the snapshot column. Per-row evaluation in JS — UPCOMING
    // sets are small because this query is what prunes them.
    const upcoming = await prisma.appointment.findMany({
      where: { chatbotId, status: 'UPCOMING' },
      select: { id: true, date: true, timeslot: true, timezone: true },
    })
    const expiredIds: string[] = []
    for (const row of upcoming) {
      const tz = row.timezone || fallbackTz
      const nowLocal = dayjs().tz(tz)
      const today = nowLocal.format('YYYY-MM-DD')
      const nowTime = nowLocal.format('HH:mm')
      if (row.date < today || (row.date === today && row.timeslot < nowTime)) {
        expiredIds.push(row.id)
      }
    }
    if (expiredIds.length > 0) {
      await prisma.appointment.updateMany({
        where: { id: { in: expiredIds } },
        data: { status: 'PAST' },
      })
    }

    let dateWhere: Prisma.AppointmentWhereInput = {}
    if (dateFilterParam) {
      const resolved = resolveDateFilter(dateFilterParam, fallbackTz)
      if (!resolved) {
        return res.status(400).json({
          status: ApiStatus.FAILURE,
          message: `dateFilter must be one of: ${PRESET_DATE_FILTERS.join(', ')}, or a date in YYYY-MM-DD format`,
        } satisfies ApiResponse)
      }
      dateWhere = resolved
    }

    const appointments = await prisma.appointment.findMany({
      where: { chatbotId, ...dateWhere },
      orderBy: [{ date: 'asc' }, { timeslot: 'asc' }],
    })

    return res.status(200).json({
      status: ApiStatus.SUCCESS,
      message: 'Appointments fetched successfully',
      data: appointments,
    } satisfies ApiResponse)
  } catch (error) {
    next(error)
  }
}

const LOCATION_LABELS: Record<string, string> = {
  GOOGLE_MEET: 'Google Meet',
  ZOOM: 'Zoom',
  IN_PERSON: 'In person',
  PHONE: 'Phone call',
}

function describeDateFilter(filter: string | null): string {
  if (!filter) return 'All appointments'
  switch (filter) {
    case 'today':
      return 'Today'
    case 'tomorrow':
      return 'Tomorrow'
    case 'yesterday':
      return 'Yesterday'
    case 'next7':
      return 'Next 7 days'
    case 'next30':
      return 'Next 30 days'
    case 'last7':
      return 'Last 7 days'
    case 'last30':
      return 'Last 30 days'
    case 'all-upcoming':
      return 'All upcoming'
    case 'all-past':
      return 'All past'
    default: {
      const parsed = dayjs(filter, 'YYYY-MM-DD', true)
      return parsed.isValid() ? parsed.format('MMM D, YYYY') : filter
    }
  }
}

export const exportAppointmentsAsPDF = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { chatbotId } = req.params
    if (!chatbotId) {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'Chatbot ID is required',
      } satisfies ApiResponse)
    }

    const chatbot = await prisma.chatbot.findFirst({
      where: { id: chatbotId, userId: req.user.id },
      select: { id: true, name: true },
    })
    if (!chatbot) {
      return res.status(404).json({
        status: ApiStatus.FAILURE,
        message: 'Chatbot not found',
      } satisfies ApiResponse)
    }

    const dateFilterParam =
      typeof req.query.dateFilter === 'string' && req.query.dateFilter.length > 0
        ? req.query.dateFilter
        : null

    const config = await prisma.bookingConfig.findUnique({ where: { chatbotId } })
    const fallbackTz = config?.timezone || 'UTC'

    let dateWhere: Prisma.AppointmentWhereInput = {}
    if (dateFilterParam) {
      const resolved = resolveDateFilter(dateFilterParam, fallbackTz)
      if (!resolved) {
        return res.status(400).json({
          status: ApiStatus.FAILURE,
          message: `dateFilter must be one of: ${PRESET_DATE_FILTERS.join(', ')}, or a date in YYYY-MM-DD format`,
        } satisfies ApiResponse)
      }
      dateWhere = resolved
    }

    const appointments = await prisma.appointment.findMany({
      where: { chatbotId, ...dateWhere },
      orderBy: [{ date: 'asc' }, { timeslot: 'asc' }],
    })

    const filename = `appointments-${chatbot.name.replace(/[^a-z0-9-_]+/gi, '_')}.pdf`
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)

    const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' })
    doc.pipe(res)

    doc.fontSize(20).font('Helvetica-Bold').text(chatbot.name, { align: 'center' })
    doc.moveDown(0.3)
    doc
      .fontSize(11)
      .font('Helvetica')
      .fillColor('#555')
      .text(`Appointments — ${describeDateFilter(dateFilterParam)}`, { align: 'center' })
    doc
      .fontSize(9)
      .fillColor('#888')
      .text(`Generated ${dayjs().format('MMM D, YYYY h:mm A')}`, { align: 'center' })
    doc.fillColor('black')
    doc.moveDown(1)

    const pageLeft = doc.page.margins.left
    const pageRight = doc.page.width - doc.page.margins.right
    const usableWidth = pageRight - pageLeft

    // Column ratios: Name, Email, Date, Time, Meeting Type, Location
    const ratios = [0.14, 0.2, 0.12, 0.14, 0.13, 0.27]
    const colWidths = ratios.map(r => Math.floor(usableWidth * r))
    const headers = ['Name', 'Email', 'Date', 'Time', 'Meeting Type', 'Location']
    const rowPaddingY = 6
    const cellPadX = 6

    const drawRow = (
      cells: string[],
      opts: { bold?: boolean; fill?: string; fontSize?: number } = {}
    ) => {
      const fontSize = opts.fontSize ?? 9
      doc.font(opts.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(fontSize)

      const heights = cells.map((text, i) =>
        doc.heightOfString(text || '-', { width: colWidths[i]! - cellPadX * 2 })
      )
      const rowHeight = Math.max(...heights) + rowPaddingY * 2

      if (doc.y + rowHeight > doc.page.height - doc.page.margins.bottom) {
        doc.addPage()
      }

      const top = doc.y
      let x = pageLeft

      if (opts.fill) {
        doc.save().rect(pageLeft, top, usableWidth, rowHeight).fill(opts.fill).restore()
      }

      doc.strokeColor('#d0d0d0').lineWidth(0.5)
      cells.forEach((text, i) => {
        const w = colWidths[i]!
        doc.rect(x, top, w, rowHeight).stroke()
        doc
          .fillColor('black')
          .text(text || '-', x + cellPadX, top + rowPaddingY, {
            width: w - cellPadX * 2,
          })
        x += w
      })

      doc.y = top + rowHeight
      doc.x = pageLeft
    }

    drawRow(headers, { bold: true, fill: '#f1f3f5', fontSize: 10 })

    if (appointments.length === 0) {
      doc.moveDown(1)
      doc
        .font('Helvetica-Oblique')
        .fontSize(11)
        .fillColor('#888')
        .text('No appointments for the selected filter.', { align: 'center' })
    } else {
      for (const appt of appointments) {
        const name = appt.name ?? appt.email.split('@')[0] ?? appt.email
        const meetingType = appt.locationType ? LOCATION_LABELS[appt.locationType] ?? '-' : '-'
        const location =
          appt.locationType === 'GOOGLE_MEET' && appt.meetLink
            ? appt.meetLink
            : appt.locationType === 'PHONE' && appt.locationPhone
              ? appt.locationPhone
              : appt.locationType === 'IN_PERSON' && appt.locationAddress
                ? appt.locationAddress
                : '-'

        const start = dayjs(`${appt.date}T${appt.timeslot}`)
        const end = start.add(appt.duration ?? 30, 'minute')
        const timeRange = `${start.format('h:mm A')} - ${end.format('h:mm A')}`

        drawRow([
          name,
          appt.email,
          dayjs(appt.date).format('MMM D, YYYY'),
          timeRange,
          meetingType,
          location,
        ])
      }
    }

    doc.end()
  } catch (error) {
    next(error)
  }
}

export const cancelAppointment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { chatbotId, appointmentId } = req.params

    if (!chatbotId || !appointmentId) {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'Chatbot ID and appointment ID are required',
      } satisfies ApiResponse)
    }

    const result = await cancelAppointmentService(chatbotId, appointmentId)

    if (result.status === 'not_found') {
      return res.status(404).json({
        status: ApiStatus.FAILURE,
        message: 'Appointment not found',
      } satisfies ApiResponse)
    }

    if (result.status === 'already_cancelled') {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'Appointment is already cancelled',
      } satisfies ApiResponse)
    }

    return res.status(200).json({
      status: ApiStatus.SUCCESS,
      message: 'Appointment cancelled successfully',
      data: result.appointment,
    } satisfies ApiResponse)
  } catch (error) {
    next(error)
  }
}
