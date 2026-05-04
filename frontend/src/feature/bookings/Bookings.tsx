import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useMediaQuery } from '@mantine/hooks'
import { Availability } from './availability/Availability'
import { Appointments } from './Appointments'
import { BookingSettings } from './BookingSettings'
import { useBookingStore } from '@/store'
import { Switch, Tooltip } from '@mantine/core'

type Tab = 'availability' | 'appointments' | 'settings'

const TABS: { key: Tab; label: string }[] = [
  { key: 'availability', label: 'Availability' },
  { key: 'appointments', label: 'Appointments' },
]

export const Bookings: React.FC = () => {
  const { chatbotId } = useParams<{ chatbotId: string }>()
  const { fetchBookingData, appointmentIsEnabled, updateAppointmentIsEnabled } = useBookingStore()
  const [activeTab, setActiveTab] = useState<Tab>('availability')
  const isLargeScreen = useMediaQuery('(min-width: 1024px)')

  useEffect(() => {
    if (chatbotId) {
      fetchBookingData(chatbotId)
    }
  }, [chatbotId, fetchBookingData])

  const toggleAppointmentFeature = (isEnabled: boolean) => {
    if (chatbotId) {
      updateAppointmentIsEnabled(chatbotId, isEnabled)
    }
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 border-r border-r-border-week w-full h-full flex flex-col">
        <div className="flex items-center">
          <p className="pt-8 pb-2 px-6 font-semibold text-2xl">Appointments</p>
          <Tooltip
            label={`${appointmentIsEnabled ? 'Disable Appointments' : 'Enable Appointments'}`}
            position="top"
          >
            <div>
              {' '}
              <Switch
                onChange={event => toggleAppointmentFeature(event.currentTarget.checked)}
                checked={appointmentIsEnabled}
                className="pt-8 pb-2"
              />
            </div>
          </Tooltip>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex border-b border-border-week">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="px-6 py-2 font-medium"
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
            {!isLargeScreen && (
              <button onClick={() => setActiveTab('settings')} className="px-6 py-2 font-medium">
                <span
                  className={`pb-2 border-b-2 text-sm cursor-pointer transition-colors duration-350 ${
                    activeTab === 'settings'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Settings
                </span>
              </button>
            )}
          </div>
          <div className="flex-1 min-h-0 overflow-auto bg-background-dark-week">
            {activeTab === 'availability' && (
              <div
                className={`h-full ${appointmentIsEnabled ? '' : 'opacity-50 pointer-events-none'}`}
              >
                <Availability />
              </div>
            )}
            {activeTab === 'appointments' && (
              <div className="h-full">
                <Appointments />
              </div>
            )}
            {activeTab === 'settings' && (
              <div
                className={`h-full p-6 bg-background-dark-week ${appointmentIsEnabled ? '' : 'opacity-50 pointer-events-none'}`}
              >
                <BookingSettings />
              </div>
            )}
          </div>
        </div>
      </div>
      <div
        className={`lg:w-[35%] h-full hidden px-6 py-6 lg:flex lg:flex-col bg-background-dark-week ${appointmentIsEnabled ? '' : 'opacity-50 pointer-events-none'}`}
      >
        <BookingSettings />
      </div>
    </div>
  )
}
