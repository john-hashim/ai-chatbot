import type React from 'react'
import { Calendar1, Clock } from 'lucide-react'
import { Avatar } from '@mantine/core'

const days = [
  { label: 'Sunday', id: 0, avatarLabel: 'S' },
  { label: 'Monday', id: 1, avatarLabel: 'M' },
  { label: 'Tuesday', id: 2, avatarLabel: 'T' },
  { label: 'Wednesday', id: 3, avatarLabel: 'W' },
  { label: 'Thursday', id: 4, avatarLabel: 'T' },
  { label: 'Friday', id: 5, avatarLabel: 'F' },
  { label: 'Saturday', id: 6, avatarLabel: 'S' },
]

export const AvailabilityList: React.FC = () => {
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
          {days.map(day => (
            <div className="mt-2">
              <Avatar size="md" color="brand">
                {day.avatarLabel}
              </Avatar>
            </div>
          ))}
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
}
