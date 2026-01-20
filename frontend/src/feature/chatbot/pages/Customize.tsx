import { useState } from 'react'
import { useMediaQuery } from '@mantine/hooks'

export const Customize: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'content' | 'style' | 'preview'>('content')
  const isLargeScreen = useMediaQuery('(min-width: 1024px)')

  return (
    <div className="flex h-full">
      <div className="lg:w-[500px] border-r border-r-border-week w-full h-full flex flex-col">
        <p className="py-5 px-6 font-semibold text-2xl">Customize your chatbot</p>
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex border-b border-border-week">
            <button onClick={() => setActiveTab('content')} className="px-6 py-2 font-medium">
              <span
                className={`pb-2 border-b-2 text-sm cursor-pointer ${
                  activeTab === 'content'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Content
              </span>
            </button>
            <button onClick={() => setActiveTab('style')} className="px-6 py-2 font-medium">
              <span
                className={`pb-2 border-b-2 text-sm cursor-pointer ${
                  activeTab === 'style'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Style
              </span>
            </button>
            {!isLargeScreen && (
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
            )}
          </div>
          <div className="flex-1 min-h-0 overflow-auto">
            {activeTab === 'content' && <div className="bg-amber-300"></div>}
            {activeTab === 'style' && (
              <div className="h-full">
                Style panel Lorem Ipsum is simply dummy text of the printing and typesetting
                industry
              </div>
            )}
            {activeTab === 'preview' && (
              <div className="h-full bg-[radial-gradient(circle,#ebebeb_2px,#fafafa_0)] bg-size-[30px_30px]">
                Preview panel
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex-1 h-full hidden lg:block bg-[radial-gradient(circle,#ebebeb_2px,#fafafa_0)] bg-size-[30px_30px]"></div>
    </div>
  )
}
