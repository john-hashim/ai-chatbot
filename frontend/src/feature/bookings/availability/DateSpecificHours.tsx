import { memo } from 'react'
import { Calendar1 } from 'lucide-react'

export const DateSpecificHours = memo(() => {
  return (
    <div className="lg:w-1/2 p-6">
      <div className="flex items-center gap-2">
        <Calendar1 size={18} className="text-text-weak" />
        <p className="font-bold text-sm">Date Specific Hours</p>
      </div>
      <p className="text-xs mt-1 font-light text-text-weak max-w-2/3 mx-auto sm:mx-0">
        Adjust hours for specific days
      </p>
    </div>
  )
})
