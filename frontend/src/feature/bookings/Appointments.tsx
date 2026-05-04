import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button, Loader, Text } from '@mantine/core'
import { modals } from '@mantine/modals'
import { Calendar, Clock, MapPin, Phone, Video } from 'lucide-react'
import { useBookingStore } from '@/store'
import { showLoadingNotification } from '@/utils/notifications'
import type { Appointment, LocationType } from '@/types/bookings'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

type AppointmentTab = 'upcoming' | 'past'

const TABS: { key: AppointmentTab; label: string }[] = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
]

export const Appointments: React.FC = () => {
  const { chatbotId } = useParams<{ chatbotId: string }>()
  const {
    upcomingAppointments,
    pastAppointments,
    fetchingAppointments,
    appointmentsError,
    fetchAppointments,
  } = useBookingStore()
  const [activeTab, setActiveTab] = useState<AppointmentTab>('upcoming')

  useEffect(() => {
    if (chatbotId) {
      fetchAppointments(chatbotId, activeTab === 'upcoming' ? 'UPCOMING' : 'PAST')
    }
  }, [chatbotId, activeTab, fetchAppointments])

  const items = activeTab === 'upcoming' ? upcomingAppointments : pastAppointments

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
        {fetchingAppointments ? (
          <div className="flex items-center justify-center py-16">
            <Loader size="sm" />
          </div>
        ) : appointmentsError ? (
          <div className="flex flex-col items-center justify-center py-16 text-sm text-red-500">
            {appointmentsError}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-sm text-gray-400">
            <Calendar size={32} className="mb-2 opacity-50" />
            {activeTab === 'upcoming' ? 'No upcoming appointments' : 'No past appointments'}
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {items.map(appt => (
              <AppointmentRow
                key={appt.id}
                appointment={appt}
                showCancel={activeTab === 'upcoming'}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

const LOCATION_LABELS: Record<LocationType, string> = {
  GOOGLE_MEET: 'Google Meet',
  ZOOM: 'Zoom',
  IN_PERSON: 'In person',
  PHONE: 'Phone call',
}

const deriveName = (email: string): string => {
  const local = email.split('@')[0] ?? email
  return (
    local
      .split(/[._-]+/)
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ') || email
  )
}

const AppointmentRow: React.FC<{ appointment: Appointment; showCancel: boolean }> = ({
  appointment,
  showCancel,
}) => {
  const { chatbotId } = useParams<{ chatbotId: string }>()
  const { cancelAppointment, cancellingAppointmentId } = useBookingStore()
  const name = appointment.name ?? deriveName(appointment.email)
  const { locationType, locationAddress, locationPhone } = appointment
  const locationLabel = locationType ? LOCATION_LABELS[locationType] : 'No location set'
  const locationDetail =
    locationType === 'IN_PERSON' ? locationAddress : locationType === 'PHONE' ? locationPhone : null
  const LocationIcon =
    locationType === 'IN_PERSON' ? MapPin : locationType === 'PHONE' ? Phone : Video
  const isCancelling = cancellingAppointmentId === appointment.id

  const handleCancel = () => {
    if (!chatbotId) return
    modals.openConfirmModal({
      title: 'Cancel appointment',
      centered: true,
      children: (
        <Text size="sm">
          {`Cancel the appointment with ${name} on ${dayjs(appointment.date).format('MMM D, YYYY')} at ${dayjs(
            `${appointment.date}T${appointment.timeslot}`
          ).format('h:mm A')}? This will remove it from Google Calendar and notify the invitee.`}
        </Text>
      ),
      labels: { confirm: 'Cancel appointment', cancel: 'Keep' },
      confirmProps: { color: 'red', variant: 'filled' },
      onConfirm: async () => {
        const notification = showLoadingNotification('Cancelling', 'Please wait...')
        try {
          await cancelAppointment(chatbotId, appointment.id)
          notification.success('Appointment cancelled')
        } catch (e) {
          notification.error(`Failed to cancel: ${e instanceof Error ? e.message : e}`)
        }
      },
    })
  }

  return (
    <li className="flex flex-row items-center gap-6 border border-border-week rounded-lg p-4 hover:bg-background-dark-week transition-colors">
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-sm font-medium truncate">{name}</span>
        <span className="text-xs text-gray-500 truncate">{appointment.email}</span>
      </div>

      <div className="flex flex-col gap-1 shrink-0">
        <div className="flex items-center gap-1.5 text-sm">
          <Calendar size={14} className="text-gray-500" />
          <span>{dayjs(appointment.date).format('MMM D, YYYY')}</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <Clock size={14} className="text-gray-500" />
          <span>{dayjs(`${appointment.date}T${appointment.timeslot}`).format('h:mm A')}</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-sm text-gray-600 min-w-0 shrink-0 max-w-[220px]">
        <LocationIcon size={14} className="text-gray-500 shrink-0" />
        <div className="flex flex-col min-w-0">
          <span className="truncate">{locationLabel}</span>
          {locationDetail && (
            <span className="text-xs text-gray-400 truncate">{locationDetail}</span>
          )}
        </div>
      </div>

      {showCancel && (
        <div className="ml-auto shrink-0">
          <Button
            variant="outline"
            color="red"
            size="xs"
            onClick={handleCancel}
            loading={isCancelling}
          >
            Cancel
          </Button>
        </div>
      )}
    </li>
  )
}
