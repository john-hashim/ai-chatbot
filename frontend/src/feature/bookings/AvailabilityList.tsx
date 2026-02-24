import type React from 'react'
import { Calendar1, Clock } from 'lucide-react'

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
