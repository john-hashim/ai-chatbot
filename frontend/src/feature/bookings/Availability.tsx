import type React from 'react'
import { useState } from 'react'
import { SegmentedControl, Center } from '@mantine/core'
import { List, Calendar } from 'lucide-react'
import { AvailabilityCalendar } from './AvailablityCalendar'
import { AvailabilityList } from './AvailabilityList'

export const Availability: React.FC = () => {
  const [view, setView] = useState<'List' | 'Calendar'>('List')

  return (
    <div className="m-5 min-h-[calc(100%-40px)] border border-border-week bg-white rounded-xl">
      <div>
        <div className="flex justify-between p-6 border-b border-border-week">
          <div className="lg:w-3/5 w-full">
            <p className="text-lg font-semibold">Availability</p>
            <p className="text-sm mt-1 font-light text-text-weak max-w-2/3 mx-auto sm:mx-0">
              Set when you are typically available for meetings
            </p>
          </div>
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
        </div>

        <div className="hidden lg:block">
          {view === 'Calendar' ? <AvailabilityCalendar /> : <AvailabilityList />}
        </div>
        <div className="lg:hidden">
          <AvailabilityList />
        </div>
      </div>
    </div>
  )
}
