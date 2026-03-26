import { prisma } from '../prisma/client.js'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'
import customParseFormat from 'dayjs/plugin/customParseFormat.js'

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
            availability.specificDate && dayjs(availability.specificDate).format('YYYY-MM-DD')
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
    const parsedDate = dayjs(date)
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
