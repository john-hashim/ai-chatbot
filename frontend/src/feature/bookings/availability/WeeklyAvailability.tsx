import { memo, useMemo } from 'react'
import { Clock, Plus, X } from 'lucide-react'
import { Avatar, Loader, Select, Tooltip } from '@mantine/core'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { useBookingStore, useChatbotStore } from '@/store'
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

export interface WeeklyAvailabilityProps {
  createWeeklyAvailablity: (dayOfWeek: number) => void
}

export const WeeklyAvailability = memo<WeeklyAvailabilityProps>(({ createWeeklyAvailablity }) => {
  const { duration, availabilities, updateAvailability, deleteAvailability, creatingDayId } =
    useBookingStore()
  const { currentChatbot } = useChatbotStore()

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

  const getDaySchedule = useMemo(() => {
    return (dayId: number) =>
      availabilities.find(a => a.scheduleType === 'WEEKLY' && a.dayOfWeek === dayId) ?? null
  }, [availabilities])

  const handleTimeChange = (
    scheduleId: string,
    slotIndex: number,
    field: 'startTime' | 'endTime',
    value: string
  ) => {
    if (!currentChatbot) return
    const current = availabilities.find(a => a.id === scheduleId)
    if (!current) return
    const data: UpdateTimeSlotsRequest = {
      timeSlots: current.timeSlots.map((s, i) => (i === slotIndex ? { ...s, [field]: value } : s)),
    }
    updateAvailability(currentChatbot.id, scheduleId, data).catch(console.error)
  }

  const handleDelete = (scheduleId: string, slotIndex: number) => {
    if (!currentChatbot) return
    const current = availabilities.find(a => a.id === scheduleId)
    if (!current) return
    if (current.timeSlots.length === 1) {
      deleteAvailability(currentChatbot.id, scheduleId).catch(console.error)
    } else {
      const data: UpdateTimeSlotsRequest = {
        timeSlots: current.timeSlots.filter((_, i) => i !== slotIndex),
      }
      updateAvailability(currentChatbot.id, scheduleId, data).catch(console.error)
    }
  }

  return (
    <div className="lg:w-1/2 pl-6 py-6">
      <div className="flex items-center gap-2">
        <Clock size={18} className="text-text-weak" />
        <p className="font-bold text-sm">Weekly Hours</p>
      </div>
      <p className="text-xs mt-1 font-light text-text-weak">Set time based on weekly schedule</p>
      <div className="mt-6">
        {days.map(day => {
          const schedule = getDaySchedule(day.id)
          const isCreating = creatingDayId === day.id
          return (
            <div key={day.id} className="mt-6">
              {!schedule ? (
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
                  {schedule.timeSlots.map((slot, slotIndex) => (
                    <div key={slotIndex} className="flex items-center gap-1 sm:gap-2">
                      {slotIndex === 0 ? (
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
                        onChange={val =>
                          val && handleTimeChange(schedule.id, slotIndex, 'startTime', val)
                        }
                        className="w-24 ml-2"
                        checkIconPosition="right"
                      />
                      <span className="text-xs text-text-weak">–</span>
                      <Select
                        size="xs"
                        data={timeOptions}
                        value={slot.endTime}
                        onChange={val =>
                          val && handleTimeChange(schedule.id, slotIndex, 'endTime', val)
                        }
                        className="w-24"
                        checkIconPosition="right"
                      />
                      <Tooltip
                        label={`Remove ${day.label} interval ${slotIndex + 1}`}
                        transitionProps={{ duration: 150 }}
                      >
                        <div
                          className="cursor-pointer rounded p-1.5 hover:bg-gray-100"
                          onClick={() => handleDelete(schedule.id, slotIndex)}
                        >
                          <X className="h-3.5 w-3.5 text-text-weak" />
                        </div>
                      </Tooltip>
                      {slotIndex === schedule.timeSlots.length - 1 && (
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
                      {slotIndex === schedule.timeSlots.length - 1 && isCreating && (
                        <Loader size="xs" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
})
