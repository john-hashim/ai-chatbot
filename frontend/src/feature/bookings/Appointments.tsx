import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Loader } from '@mantine/core'
import { Calendar, Clock, Mail } from 'lucide-react'
import { useBookingStore } from '@/store'
import type { Appointment } from '@/types/bookings'

type AppointmentTab = 'upcoming' | 'past'

const TABS: { key: AppointmentTab; label: string }[] = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
]

export const Appointments: React.FC = () => {
  const { chatbotId } = useParams<{ chatbotId: string }>()
  const { appointments, fetchingAppointments, fetchAppointments } = useBookingStore()
  const [activeTab, setActiveTab] = useState<AppointmentTab>('upcoming')

  useEffect(() => {
    if (chatbotId) {
      fetchAppointments(chatbotId)
    }
  }, [chatbotId, fetchAppointments])

  const items = activeTab === 'upcoming' ? appointments : []

  return (
    <div className="lg:m-5 m-2 min-h-[calc(100%-40px)] border border-border-week bg-white rounded-xl">
      <div className="flex border-b border-border-week px-4">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="px-4 py-3 font-medium"
          >
            <span
              className={`pb-2 border-b-2 text-sm cursor-pointer transition-colors duration-350 ${
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </span>
          </button>
        ))}
      </div>

      <div className="p-4">
        {fetchingAppointments && activeTab === 'upcoming' ? (
          <div className="flex items-center justify-center py-16">
            <Loader size="sm" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-sm text-gray-400">
            <Calendar size={32} className="mb-2 opacity-50" />
            {activeTab === 'upcoming' ? 'No upcoming appointments' : 'No past appointments'}
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {items.map(appt => (
              <AppointmentRow key={appt.id} appointment={appt} />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

const AppointmentRow: React.FC<{ appointment: Appointment }> = ({ appointment }) => {
  return (
    <li className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border border-border-week rounded-lg p-4 hover:bg-background-dark-week transition-colors">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-sm">
          <Calendar size={14} className="text-gray-500" />
          <span>{appointment.date}</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <Clock size={14} className="text-gray-500" />
          <span>{appointment.timeslot}</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-sm text-gray-600">
        <Mail size={14} className="text-gray-500" />
        <span>{appointment.email}</span>
      </div>
    </li>
  )
}
