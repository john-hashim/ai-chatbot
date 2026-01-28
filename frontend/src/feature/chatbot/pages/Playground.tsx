import type React from 'react'
import { useState } from 'react'
import { PlaygroundSettings } from '../components/PlaygroundSettings'
import { PlaygroundPreview } from '../components/PlaygroundPreview'
import { useMediaQuery } from '@mantine/hooks'

export const Playground: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'settings' | 'preview'>('settings')
  const isLargeScreen = useMediaQuery('(min-width: 1024px)')

  return (
    <div className="flex h-full">
      <div className="lg:w-[500px] border-r border-r-border-week w-full h-full flex flex-col relative">
        <p className="py-5 px-6 font-semibold text-2xl">Playground</p>
        <div className="flex-1 flex flex-col min-h-0">
          {!isLargeScreen && (
            <div className="flex border-b border-border-week">
              <button onClick={() => setActiveTab('settings')} className="px-6 py-2 font-medium">
                <span
                  className={`pb-2 border-b-2 text-sm cursor-pointer ${
                    activeTab === 'settings'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  settings
                </span>
              </button>
              <button onClick={() => setActiveTab('preview')} className="px-6 py-2 font-medium">
                <span
                  className={`pb-2 border-b-2 text-sm cursor-pointer ${
                    activeTab === 'preview'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Preview
                </span>
              </button>
            </div>
          )}
          <div className="flex-1 min-h-0 overflow-auto">
            {activeTab === 'settings' && (
              <div className="h-full">
                <PlaygroundSettings />
              </div>
            )}
            {activeTab === 'preview' && (
              <div className="h-full bg-[radial-gradient(circle,#ebebeb_2px,#fafafa_0)] bg-size-[30px_30px]">
                <PlaygroundPreview />
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex-1 h-full hidden lg:block bg-[radial-gradient(circle,#ebebeb_2px,#fafafa_0)] bg-size-[30px_30px]">
        <PlaygroundPreview />
      </div>
    </div>
  )
}
