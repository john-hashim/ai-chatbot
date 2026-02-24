import { useState } from 'react'
import { useMediaQuery } from '@mantine/hooks'
import { Availability } from './Availability'
import { Appointments } from './Appointments'
import { BookingSettings } from './BookingSettings'

type Tab = 'availability' | 'appointments' | 'settings'

export const Bookings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('availability')
  const isLargeScreen = useMediaQuery('(min-width: 1024px)')

  const tabs: { key: Tab; label: string }[] = [
    { key: 'availability', label: 'Availability' },
    { key: 'appointments', label: 'Appointments' },
  ]

  return (
    <div className="flex h-full">
      <div className="flex-1 border-r border-r-border-week w-full h-full flex flex-col">
        <p className="pt-8 pb-2 px-6 font-semibold text-2xl">Appointments</p>
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex border-b border-border-week">
            {tabs.map(tab => (
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
              <div className="h-full">
                <Availability />
              </div>
            )}
            {activeTab === 'appointments' && (
              <div className="h-full">
                <Appointments />
              </div>
            )}
            {activeTab === 'settings' && (
              <div className="h-full p-6 bg-background-dark-week">
                <BookingSettings />
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="lg:w-[35%] h-full hidden px-6 py-6 lg:flex lg:flex-col bg-background-dark-week">
        <BookingSettings />
      </div>
    </div>
  )
}
