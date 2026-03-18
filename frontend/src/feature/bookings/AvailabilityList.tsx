import { memo, useMemo } from 'react'
import { Calendar1, Clock, Plus, X } from 'lucide-react'
import { Avatar, Loader, Select, Tooltip } from '@mantine/core'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { useStore } from '@/store'
import type { UpdateTimeSlotsRequest } from '@/types/bookings'

dayjs.extend(customParseFormat)

const days = [
  { label: 'Sunday', id: 0, avatarLabel: 'S' },
  { label: 'Monday', id: 1, avatarLabel: 'M' },
  { label: 'Tuesday', id: 2, avatarLabel: 'T' },
  { label: 'Wednesday', id: 3, avatarLabel: 'W' },
  { label: 'Thursday', id: 4, avatarLabel: 'T' },
  { label: 'Friday', id: 5, avatarLabel: 'F' },
  { label: 'Saturday', id: 6, avatarLabel: 'S' },
]

export interface AvailabilityListProps {
  createWeeklyAvailablity: (dayOfWeek: number) => void
}

export const AvailabilityList = memo<AvailabilityListProps>(({ createWeeklyAvailablity }) => {
  const {
    duration,
    availabilities,
    updateAvailability,
    deleteAvailability,
    currentChatbot,
    creatingDayId,
  } = useStore()

  const timeOptions = useMemo(() => {
    const steps = Math.floor((24 * 60) / duration)
    return Array.from({ length: steps }, (_, i) => {
      const totalMins = i * duration
      const h = Math.floor(totalMins / 60)
      const m = totalMins % 60
      const value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      return { value, label: dayjs(value, 'HH:mm').format('h:mm A') }
    })
  }, [duration])

  const getDaySchedules = useMemo(() => {
    return (dayId: number) =>
      availabilities.filter(a => a.scheduleType === 'WEEKLY' && a.dayOfWeek === dayId)
  }, [availabilities])

  const handleTimeChange = (scheduleId: string, field: 'startTime' | 'endTime', value: string) => {
    if (!currentChatbot) return
    const current = availabilities.find(a => a.id === scheduleId)
    if (!current) return
    const data: UpdateTimeSlotsRequest = {
      timeSlots: [{ ...current.timeSlots[0], [field]: value }],
    }
    updateAvailability(currentChatbot.id, scheduleId, data).catch(console.error)
  }

  const handleDelete = (scheduleId: string) => {
    if (!currentChatbot) return
    deleteAvailability(currentChatbot.id, scheduleId).catch(console.error)
  }

  return (
    <div className="flex flex-col lg:flex-row flex-wrap">
      <div className="lg:w-1/2 p-6">
        <div className="flex items-center gap-2">
          <Clock size={18} className="text-text-weak" />
          <p className="font-bold text-sm">Weekly Hours</p>
        </div>
        <p className="text-xs mt-1 font-light text-text-weak max-w-2/3 mx-auto sm:mx-0">
          Set time based on weekly schedule
        </p>
        <div className="mt-6">
          {days.map(day => {
            const schedules = getDaySchedules(day.id)
            const isCreating = creatingDayId === day.id
            return (
              <div key={day.id} className="mt-6">
                {schedules.length === 0 ? (
                  <div className="flex items-center">
                    <Avatar size="sm" color="brand">
                      {day.avatarLabel}
                    </Avatar>
                    <p className="ml-8 text-xs text-text-weak">Unavailable</p>
                    <Tooltip
                      label={`New interval for ${day.label}`}
                      transitionProps={{ duration: 150 }}
                    >
                      <div
                        className="ml-2 cursor-pointer rounded p-1.5 hover:bg-gray-100"
                        onClick={() => !isCreating && createWeeklyAvailablity(day.id)}
                      >
                        <div
                          className={`p-px rounded-full border ${isCreating ? 'border-gray-300 opacity-40' : 'border-color-primary'}`}
                        >
                          <Plus
                            className="h-3 w-3"
                            style={{
                              color: isCreating
                                ? 'var(--mantine-color-gray-5)'
                                : 'var(--mantine-color-brand-6)',
                            }}
                          />
                        </div>
                      </div>
                    </Tooltip>
                    {isCreating && <Loader className="ml-2" size="xs" />}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {schedules.map((schedule, index) => {
                      const slot = schedule.timeSlots[0]
                      return (
                        <div key={schedule.id} className="flex items-center gap-2">
                          {index === 0 ? (
                            <Avatar size="sm" color="brand">
                              {day.avatarLabel}
                            </Avatar>
                          ) : (
                            <div className="w-[26px]" />
                          )}
                          <Select
                            size="xs"
                            data={timeOptions}
                            value={slot.startTime}
                            onChange={val => val && handleTimeChange(schedule.id, 'startTime', val)}
                            className="w-28"
                            checkIconPosition="right"
                          />
                          <span className="text-xs text-text-weak">–</span>
                          <Select
                            size="xs"
                            data={timeOptions}
                            value={slot.endTime}
                            onChange={val => val && handleTimeChange(schedule.id, 'endTime', val)}
                            className="w-28"
                            checkIconPosition="right"
                          />
                          <Tooltip
                            label={`Remove ${day.label} interval ${index + 1}`}
                            transitionProps={{ duration: 150 }}
                          >
                            <div
                              className="cursor-pointer rounded p-1.5 hover:bg-gray-100"
                              onClick={() => handleDelete(schedule.id)}
                            >
                              <X className="h-3.5 w-3.5 text-text-weak" />
                            </div>
                          </Tooltip>
                          {index === 0 && (
                            <Tooltip
                              label={`New interval for ${day.label}`}
                              transitionProps={{ duration: 150 }}
                            >
                              <div
                                className="cursor-pointer rounded p-1.5 hover:bg-gray-100"
                                onClick={() => !isCreating && createWeeklyAvailablity(day.id)}
                              >
                                <div
                                  className={`p-px rounded-full border ${isCreating ? 'border-gray-300 opacity-40' : 'border-color-primary'}`}
                                >
                                  <Plus
                                    className="h-3 w-3"
                                    style={{
                                      color: isCreating
                                        ? 'var(--mantine-color-gray-5)'
                                        : 'var(--mantine-color-brand-6)',
                                    }}
                                  />
                                </div>
                              </div>
                            </Tooltip>
                          )}
                          {index === 0 && isCreating && <Loader size="xs" />}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="lg:w-1/2 p-6">
        <div className="flex items-center gap-2">
          <Calendar1 size={18} className="text-text-weak" />
          <p className="font-bold text-sm">Date Specific Hours</p>
        </div>
        <p className="text-xs mt-1 font-light text-text-weak max-w-2/3 mx-auto sm:mx-0">
          Adjust hours for specific days
        </p>
      </div>
    </div>
  )
})
