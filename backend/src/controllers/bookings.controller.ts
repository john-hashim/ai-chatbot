import type { NextFunction, Request, Response } from 'express'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'
import customParseFormat from 'dayjs/plugin/customParseFormat.js'
import { ApiStatus, type ApiResponse } from '../types/api.js'
import { prisma } from '../prisma/client.js'

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
      const { specificDate } = req.body

      if (!specificDate) {
        return res.status(400).json({
          status: ApiStatus.FAILURE,
          message: 'specificDate is required for SPECIFIC_DATE schedule',
        } satisfies ApiResponse)
      }

      const normalizedSlots = timeSlots.map(
        ({ startTime, endTime }: { startTime: string; endTime: string }) => ({
          startTime: localToUTC(specificDate, startTime, tz),
          endTime: localToUTC(specificDate, endTime, tz),
        })
      )

      const availability = await prisma.availabilitySchedule.create({
        data: {
          chatbotId,
          timezone: tz,
          scheduleType,
          specificDate: new Date(specificDate),
          timeSlots: normalizedSlots,
        },
      })

      return res.status(201).json({
        status: ApiStatus.SUCCESS,
        message: 'Availability created successfully',
        data: availability,
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

    const { isEnabled, timezone: tz, appointmentDuration } = req.body

    if (isEnabled === undefined && tz === undefined && appointmentDuration === undefined) {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'At least one field (isEnabled, timezone, appointmentDuration) must be provided',
      } satisfies ApiResponse)
    }

    if (appointmentDuration !== undefined && (isNaN(Number(appointmentDuration)) || Number(appointmentDuration) <= 0)) {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'appointmentDuration must be a positive number',
      } satisfies ApiResponse)
    }

    const config = await prisma.bookingConfig.upsert({
      where: { chatbotId },
      update: {
        ...(isEnabled !== undefined && { isEnabled }),
        ...(tz !== undefined && { timezone: tz }),
        ...(appointmentDuration !== undefined && { appointmentDuration: Number(appointmentDuration) }),
      },
      create: {
        chatbotId,
        isEnabled: isEnabled ?? true,
        timezone: tz ?? 'UTC',
        appointmentDuration: appointmentDuration ? Number(appointmentDuration) : 30,
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
