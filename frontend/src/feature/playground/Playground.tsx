import type React from 'react'
import { useState } from 'react'
import { useMediaQuery } from '@mantine/hooks'
import { PlaygroundPreview } from './PlaygroundPreview'
import { AgentTuning } from '../agent-tuning/AgentTuning'
import { useChatbotStore } from '@/store'
import { formatRelativeDate } from '@/hooks/useRelativeDate'

export const Playground: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'settings' | 'preview'>('settings')
  const isLargeScreen = useMediaQuery('(min-width: 1024px)')
  const { currentChatbot } = useChatbotStore()

  const trainedCard = (
    <div className="mx-6 mt-2 mb-3 flex h-[68px] shrink-0 flex-col justify-between rounded-lg bg-background-dark-week px-4 py-3">
      <div className="flex items-center gap-1.5">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-700"></span>
        <p className="font-medium text-sm text-green-700">Trained</p>
      </div>
      <p className="flex items-center gap-1 font-medium text-text-weak text-xs">
        Last trained <span>{formatRelativeDate(currentChatbot?.lastTrained)}</span> • 8 KB
      </p>
    </div>
  )

  return (
    <div className="flex h-full">
      <div className="lg:w-[500px] border-r border-r-border-week w-full h-full flex flex-col relative overflow-hidden">
        <p className="pt-8 pb-2 px-6 font-semibold text-2xl">Playground</p>
        <div className="flex-1 flex flex-col min-h-0">
          {!isLargeScreen && (
            <div className="flex border-b border-border-week">
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
              <button onClick={() => setActiveTab('preview')} className="px-6 py-2 font-medium">
                <span
                  className={`pb-2 border-b-2 text-sm cursor-pointer transition-colors duration-350 ${
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
          <div className="flex-1 min-h-0">
            {activeTab === 'settings' && (
              <div className="h-full flex flex-col min-h-0">
                {trainedCard}
                <div className="flex-1 min-h-0">
                  <AgentTuning embedded />
                </div>
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
