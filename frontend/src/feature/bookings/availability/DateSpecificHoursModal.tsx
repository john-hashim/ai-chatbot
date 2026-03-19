import { DatePicker } from '@mantine/dates'
import { Button, Indicator, Select, Tooltip } from '@mantine/core'
import { modals } from '@mantine/modals'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import dayjs from 'dayjs'
import { useStore } from '@/store'
import type { TimeSlot } from '@/types/bookings'
import { Plus, X } from 'lucide-react'

const TODAY = new Date()

interface DateSpecificHoursModalProps {
  createDateSpecificAvailability: (
    specificDates: string[],
    startTime: string,
    endTime: string
  ) => void
}

export const DateSpecificHoursModal = ({
  createDateSpecificAvailability,
}: DateSpecificHoursModalProps) => {
  const [value, setValue] = useState<string[]>([])
  const [schedules, setSchedules] = useState<TimeSlot[]>([{ startTime: '09:00', endTime: '17:00' }])

  const { duration, creatingDayId } = useStore()
  const isCreating = creatingDayId === -1
  const wasCreating = useRef(false)

  useEffect(() => {
    if (isCreating) {
      wasCreating.current = true
    } else if (wasCreating.current) {
      modals.closeAll()
    }
  }, [isCreating])

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

  const handleTimeChange = (index: number, field: 'startTime' | 'endTime', val: string) => {
    setSchedules(prev => prev.map((s, i) => (i === index ? { ...s, [field]: val } : s)))
  }

  const handleDelete = (index: number) => {
    setSchedules(prev => prev.filter((_, i) => i !== index))
  }

  const createNewInterval = () => {
    setSchedules(prev => [...prev, { startTime: '09:00', endTime: '17:00' }])
  }

  const renderDay = useCallback((date: string) => {
    const isToday = dayjs(date).isSame(dayjs(), 'day')
    return (
      <Indicator size={6} offset={-5} disabled={!isToday}>
        <div>{dayjs(date).date()}</div>
      </Indicator>
    )
  }, [])

  const onCreateAvailability = () => {
    if (value.length === 0 || schedules.length === 0) return
    schedules.forEach(({ startTime, endTime }) => {
      createDateSpecificAvailability(value, startTime, endTime)
    })
  }

  return (
    <div className="p-2">
      <p className="text-xl font-bold">Select the date(s) you want to assign specific hours</p>
      <div className="flex items-center justify-center mt-8 mb-8">
        <DatePicker
          firstDayOfWeek={0}
          hideOutsideDates
          type="multiple"
          size="md"
          value={value}
          onChange={setValue}
          minDate={TODAY}
          weekendDays={[]}
          renderDay={renderDay}
        />
      </div>
      {value.length !== 0 && (
        <div className="border-y p-4 border-border-week ">
          <p className="text-sm font-bold">What hours are you available?</p>
          {schedules.length === 0 && (
            <div className="flex mt-4 items-center">
              <p className="mr-10 text-xs text-text-weak">Unavailable</p>
              <Tooltip label="New interval" transitionProps={{ duration: 150 }}>
                <div
                  className="cursor-pointer rounded p-1.5 hover:bg-gray-100"
                  onClick={createNewInterval}
                >
                  <div className="p-px rounded-full border border-color-primary">
                    <Plus className="h-3 w-3" style={{ color: 'var(--mantine-color-brand-6)' }} />
                  </div>
                </div>
              </Tooltip>
            </div>
          )}
          {schedules.length > 0 && (
            <div className="flex flex-col gap-2 mt-4">
              {schedules.map((schedule, index) => (
                <div key={index} className="flex items-center gap-1 sm:gap-2">
                  <Select
                    size="xs"
                    data={timeOptions}
                    value={schedule.startTime}
                    onChange={val => val && handleTimeChange(index, 'startTime', val)}
                    className="w-24"
                    checkIconPosition="right"
                  />
                  <span className="text-xs text-text-weak">–</span>
                  <Select
                    size="xs"
                    data={timeOptions}
                    value={schedule.endTime}
                    onChange={val => val && handleTimeChange(index, 'endTime', val)}
                    className="w-24"
                    checkIconPosition="right"
                  />
                  <Tooltip label="Remove interval" transitionProps={{ duration: 150 }}>
                    <div
                      className="cursor-pointer rounded p-1.5 hover:bg-gray-100"
                      onClick={() => handleDelete(index)}
                    >
                      <X className="h-3.5 w-3.5 text-text-weak" />
                    </div>
                  </Tooltip>
                  {index === schedules.length - 1 && (
                    <Tooltip label="New interval" transitionProps={{ duration: 150 }}>
                      <div
                        className="cursor-pointer rounded p-1.5 hover:bg-gray-100"
                        onClick={createNewInterval}
                      >
                        <div className="p-px rounded-full border border-color-primary">
                          <Plus
                            className="h-3 w-3"
                            style={{ color: 'var(--mantine-color-brand-6)' }}
                          />
                        </div>
                      </div>
                    </Tooltip>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2 mt-6">
        <Button
          variant="secondary"
          className="flex-1"
          disabled={isCreating}
          onClick={() => modals.closeAll()}
        >
          Cancel
        </Button>
        <Button className="flex-1" loading={isCreating} onClick={onCreateAvailability}>
          Apply
        </Button>
      </div>
    </div>
  )
}
