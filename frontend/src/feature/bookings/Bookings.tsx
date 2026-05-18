import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useMediaQuery } from '@mantine/hooks'
import { ActionIcon, Switch, Tooltip } from '@mantine/core'
import { ChevronLeft, ChevronRight, Settings } from 'lucide-react'
import { isAxiosError } from 'axios'
import { Availability } from './availability/Availability'
import { Appointments } from './Appointments'
import { BookingSettings } from './BookingSettings'
import { useBookingStore } from '@/store'
import { showNotification } from '@/utils/notifications'

type Tab = 'availability' | 'appointments' | 'settings'

const TABS: { key: Tab; label: string }[] = [
  { key: 'appointments', label: 'Appointments' },
  { key: 'availability', label: 'Availability' },
]

export const Bookings: React.FC = () => {
  const { chatbotId } = useParams<{ chatbotId: string }>()
  const { fetchBookingData, appointmentIsEnabled, updateAppointmentIsEnabled } = useBookingStore()
  const [activeTab, setActiveTab] = useState<Tab>('appointments')
  const [settingsCollapsed, setSettingsCollapsed] = useState(false)
  const isLargeScreen = useMediaQuery('(min-width: 1024px)')

  useEffect(() => {
    if (!chatbotId) return
    fetchBookingData(chatbotId).catch(err => {
      if (isAxiosError(err) && err.response && err.response.status < 500) {
        showNotification('error', 'Could not load booking settings. Please refresh.')
      }
    })
  }, [chatbotId, fetchBookingData])

  const toggleAppointmentFeature = async (isEnabled: boolean) => {
    if (!chatbotId) return
    try {
      await updateAppointmentIsEnabled(chatbotId, isEnabled)
      showNotification(
        'success',
        isEnabled ? 'Appointments enabled.' : 'Appointments disabled.'
      )
    } catch (err) {
      if (isAxiosError(err) && err.response) {
        const status = err.response.status
        if (status === 404) {
          showNotification('error', 'This chatbot no longer exists.')
        } else if (status < 500) {
          showNotification('error', 'Could not update appointments setting. Please try again.')
        }
      }
    }
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 min-w-0 border-r border-r-border-week w-full h-full flex flex-col">
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
        className={`relative hidden lg:block shrink-0 h-full overflow-hidden bg-background-dark-week transition-[width] duration-300 ease-in-out ${
          settingsCollapsed ? 'lg:w-12' : 'lg:w-[35vw]'
        }`}
      >
        {/* Collapsed strip — fades in after the width finishes shrinking, fades out fast when expanding. */}
        <div
          className={`absolute inset-y-0 left-0 w-12 flex flex-col items-center py-4 gap-3 transition-opacity ${
            settingsCollapsed
              ? 'opacity-100 duration-200 delay-300'
              : 'opacity-0 pointer-events-none duration-150'
          }`}
        >
          <Tooltip label="Expand settings" position="left">
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={() => setSettingsCollapsed(false)}
              aria-label="Expand settings"
            >
              <ChevronLeft size={18} />
            </ActionIcon>
          </Tooltip>
          <Settings size={18} className="text-gray-500" />
        </div>

        {/* Expanded content — fixed width so it doesn't reflow while the parent width animates.
            On expand the opacity ramps slowly (0→0.5 for 80% of the time, 0.5→1 in the last 20%)
            so the reflowing layout is masked until the panel is nearly at full width. */}
        <div
          className={`absolute inset-y-0 right-0 w-[35vw] flex flex-col px-6 py-6 ${
            settingsCollapsed
              ? 'opacity-0 pointer-events-none transition-opacity duration-150'
              : 'settings-expand-fade-in'
          } ${appointmentIsEnabled ? '' : 'opacity-50 pointer-events-none'}`}
        >
          <div className="flex items-center justify-between mb-4 shrink-0">
            <div className="flex items-center gap-2">
              <Settings size={16} className="text-gray-500" />
              <span className="text-sm font-semibold text-gray-700">Appointment Settings</span>
            </div>
            <Tooltip label="Collapse settings" position="left">
              <ActionIcon
                variant="subtle"
                color="gray"
                onClick={() => setSettingsCollapsed(true)}
                aria-label="Collapse settings"
              >
                <ChevronRight size={18} />
              </ActionIcon>
            </Tooltip>
          </div>
          <div className="flex-1 min-h-0">
            <BookingSettings />
          </div>
        </div>
      </div>
    </div>
  )
}
