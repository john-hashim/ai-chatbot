import { memo, useMemo } from 'react'
import { Calendar1, Plus, X } from 'lucide-react'
import { Button, Tooltip } from '@mantine/core'
import { modals } from '@mantine/modals'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { useBookingStore, useChatbotStore } from '@/store'

dayjs.extend(utc)
dayjs.extend(timezone)
import { DateSpecificHoursModal } from './DateSpecificHoursModal'

export interface DateSpecificHoursProps {
  createDateSpecificAvailability: (
    specificDates: string[],
    startTime: string,
    endTime: string
  ) => void
}

export const DateSpecificHours = memo<DateSpecificHoursProps>(
  ({ createDateSpecificAvailability }) => {
    const { availabilities, deleteAvailability } = useBookingStore()
    const { currentChatbot } = useChatbotStore()

    const specificSchedules = useMemo(() => {
      return availabilities
        .filter(a => a.scheduleType === 'SPECIFIC_DATE' && a.specificDate)
        .sort((a, b) => dayjs(a.specificDate).valueOf() - dayjs(b.specificDate).valueOf())
    }, [availabilities])

    const handleDelete = (scheduleId: string) => {
      if (!currentChatbot) return
      deleteAvailability(currentChatbot.id, scheduleId).catch(console.error)
    }

    const selectDateAndTime = () => {
      modals.open({
        size: 'md',
        withCloseButton: false,
        children: (
          <DateSpecificHoursModal createDateSpecificAvailability={createDateSpecificAvailability} />
        ),
      })
    }

    return (
      <div className="lg:w-1/2 p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Calendar1 size={18} className="text-text-weak" />
              <p className="font-bold text-sm">Date Specific Hours</p>
            </div>
            <p className="text-xs mt-1 font-light text-text-weak mx-auto sm:mx-0">
              Adjust hours for specific days
            </p>
          </div>
          <Button
            variant="compact"
            className="cursor-pointer"
            leftSection={<Plus size={18} />}
            onClick={selectDateAndTime}
          >
            Hours
          </Button>
        </div>

        {specificSchedules.length > 0 && (
          <div className="mt-4 flex flex-col gap-3">
            {specificSchedules.map(schedule => (
              <div
                key={schedule.id}
                className="flex items-start px-4 py-2 bg-background-dark-week rounded-xl gap-6"
              >
                <div className="w-20 shrink-0">
                  <p className="text-xs font-semibold">
                    {dayjs.utc(schedule.specificDate).format('MMM D, YYYY')}
                  </p>
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  {schedule.timeSlots.map((slot, i) => (
                    <p key={i} className="text-xs text-text-weak">
                      {dayjs.utc(slot.startTime).tz(schedule.timezone).format('h:mm A')} –{' '}
                      {dayjs.utc(slot.endTime).tz(schedule.timezone).format('h:mm A')}
                    </p>
                  ))}
                </div>
                <Tooltip
                  label={`Remove availability in day ${dayjs.utc(schedule.specificDate).format('MMM D, YYYY')}`}
                  transitionProps={{ duration: 150 }}
                >
                  <div
                    className="cursor-pointer rounded p-1.5 hover:bg-gray-100"
                    onClick={() => handleDelete(schedule.id)}
                  >
                    <X className="h-3.5 w-3.5 text-text-weak" />
                  </div>
                </Tooltip>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }
)
