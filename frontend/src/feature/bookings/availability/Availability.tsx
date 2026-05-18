import type React from 'react'
// import { useState } from 'react'
// import { SegmentedControl, Center } from '@mantine/core'
// import { List, Calendar } from 'lucide-react'
// import { AvailabilityCalendar } from './AvailablityCalendar'
import { WeeklyAvailability } from './WeeklyAvailability'
import { DateSpecificHours } from './DateSpecificHours'
import type {
  CreateSpecificDateAvailabilityRequest,
  CreateWeeklyAvailabilityRequest,
  TimeSlot,
} from '@/types/bookings'
import { useBookingStore, useChatbotStore } from '@/store'
import { useCallback } from 'react'
import { Loader } from '@mantine/core'
import { isAxiosError } from 'axios'
import { showNotification } from '@/utils/notifications'

export const Availability: React.FC = () => {
  // const [view, setView] = useState<'List' | 'Calendar'>('List')
  const { timezone, createAvailability, fetchingAvailabilities, availabilities } = useBookingStore()
  const { currentChatbot } = useChatbotStore()

  const getDefaultTimeSlot = (): TimeSlot => ({ startTime: '09:00', endTime: '17:00' })

  const createWeeklyAvailablity = useCallback(
    async (dayOfWeek: number) => {
      if (!currentChatbot) return
      const timeSlot = getDefaultTimeSlot()
      const payload: CreateWeeklyAvailabilityRequest = {
        timezone,
        timeSlots: [timeSlot],
        scheduleType: 'WEEKLY',
        dayOfWeek,
      }
      try {
        await createAvailability(currentChatbot.id, payload)
        showNotification('success', 'Availability added.')
      } catch (error) {
        if (isAxiosError(error) && error.response && error.response.status < 500) {
          showNotification('error', 'Could not add availability. Please try again.')
        }
      }
    },
    [currentChatbot, timezone, createAvailability]
  )

  const createDateSpecificAvailability = useCallback(
    async (specificDates: string[], startTime: string, endTime: string) => {
      if (!currentChatbot) return
      const timeSlot = { startTime, endTime }
      const payload: CreateSpecificDateAvailabilityRequest = {
        timezone,
        timeSlots: [timeSlot],
        scheduleType: 'SPECIFIC_DATE',
        specificDates,
      }
      try {
        await createAvailability(currentChatbot.id, payload)
        showNotification('success', 'Availability added.')
      } catch (error) {
        if (isAxiosError(error) && error.response && error.response.status < 500) {
          showNotification('error', 'Could not add availability. Please try again.')
        }
      }
    },
    [currentChatbot, timezone, createAvailability]
  )

  return (
    <div className="lg:m-5 m-2 min-h-[calc(100%-40px)] border border-border-week bg-white rounded-xl">
      <div className="pb-16">
        <div className="flex justify-between p-6 border-b border-border-week">
          <div className="lg:w-3/5 w-full">
            <div className="flex items-center">
              <p className="text-lg font-semibold">Availability</p>
              {fetchingAvailabilities && availabilities.length === 0 && (
                <Loader size="xs" className="ml-2" />
              )}
            </div>
            <p className="text-sm mt-1 font-light text-text-weak">
              Set when you are typically available for meetings
            </p>
          </div>
          {/* TODO (john hashim): list/calendar toggle — implement when calendar view is ready
          <div className="hidden lg:flex items-center justify-center ">
            <SegmentedControl
              value={view}
              onChange={val => setView(val as 'List' | 'Calendar')}
              data={[
                {
                  value: 'List',
                  label: (
                    <Center style={{ gap: 6 }}>
                      <List size={16} />
                      <span>List</span>
                    </Center>
                  ),
                },
                {
                  value: 'Calendar',
                  label: (
                    <Center style={{ gap: 6 }}>
                      <Calendar size={16} />
                      <span>Calendar</span>
                    </Center>
                  ),
                },
              ]}
            />
          </div>
          */}
        </div>

        <div className="hidden lg:flex lg:flex-row flex-wrap">
          {/* TODO (john hashim): enable calendar view once implemented
          {view === 'Calendar' ? (
            <AvailabilityCalendar />
          ) : (
            <WeeklyAvailability createWeeklyAvailablity={createWeeklyAvailablity} />
          )} */}
          <WeeklyAvailability createWeeklyAvailablity={createWeeklyAvailablity} />
          <DateSpecificHours createDateSpecificAvailability={createDateSpecificAvailability} />
        </div>
        <div className="lg:hidden flex flex-col">
          <WeeklyAvailability createWeeklyAvailablity={createWeeklyAvailablity} />
          <DateSpecificHours createDateSpecificAvailability={createDateSpecificAvailability} />
        </div>
      </div>
    </div>
  )
}
