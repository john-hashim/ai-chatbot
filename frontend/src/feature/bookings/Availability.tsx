import type React from 'react'
// import { useState } from 'react'
// import { SegmentedControl, Center } from '@mantine/core'
// import { List, Calendar } from 'lucide-react'
// import { AvailabilityCalendar } from './AvailablityCalendar'
import { AvailabilityList } from './AvailabilityList'
import type { CreateWeeklyAvailabilityRequest, TimeSlot } from '@/types/bookings'
import { useStore } from '@/store'
import { useCallback } from 'react'
import { Loader } from '@mantine/core'

export const Availability: React.FC = () => {
  // const [view, setView] = useState<'List' | 'Calendar'>('List')
  const { timezone, createAvailability, currentChatbot, fetchingAvailabilities, availabilities } =
    useStore()

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
      } catch (error) {
        console.error('Failed to create availability:', error)
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

        <div className="hidden lg:block">
          {/* TODO (john hashim): enable calendar view once implemented
          {view === 'Calendar' ? (
            <AvailabilityCalendar />
          ) : (
            <AvailabilityList createWeeklyAvailablity={createWeeklyAvailablity} />
          )} */}
          <AvailabilityList createWeeklyAvailablity={createWeeklyAvailablity} />
        </div>
        <div className="lg:hidden">
          <AvailabilityList createWeeklyAvailablity={createWeeklyAvailablity} />
        </div>
      </div>
    </div>
  )
}
