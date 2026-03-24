import { prisma } from '../prisma/client.js'
import dayjs from 'dayjs'

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
