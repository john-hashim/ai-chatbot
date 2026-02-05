import type React from 'react'
import { useState } from 'react'
import { useMediaQuery } from '@mantine/hooks'
import { ChatsList } from '../components/ChatsList'
import { ChatDetails } from '../components/ChatDetails'

export const Chats: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chatslist' | 'chatdetails'>('chatslist')
  const isLargeScreen = useMediaQuery('(min-width: 1024px)')

  return (
    <div className="flex h-full">
      <div className="lg:w-[500px] border-r border-r-border-week w-full h-full flex flex-col relative overflow-auto">
        <p className="py-5 px-6 font-semibold text-2xl">Chats</p>
        <div className="flex-1 flex flex-col min-h-0">
          {!isLargeScreen && (
            <div className="flex border-b border-border-week">
              <button onClick={() => setActiveTab('chatslist')} className="px-6 py-2 font-medium">
                <span
                  className={`pb-2 border-b-2 text-sm cursor-pointer ${
                    activeTab === 'chatslist'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Chats List
                </span>
              </button>
              <button onClick={() => setActiveTab('chatdetails')} className="px-6 py-2 font-medium">
                <span
                  className={`pb-2 border-b-2 text-sm cursor-pointer ${
                    activeTab === 'chatdetails'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Chat Details
                </span>
              </button>
            </div>
          )}
          <div className="flex-1 min-h-0">
            {activeTab === 'chatslist' && (
              <div className="h-full">
                <ChatsList />
              </div>
            )}
            {activeTab === 'chatdetails' && (
              <div className="h-full">
                <ChatDetails />
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex-1 h-full hidden lg:block">
        <ChatDetails />
      </div>
    </div>
  )
}
