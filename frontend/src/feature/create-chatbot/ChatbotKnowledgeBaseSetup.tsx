import { Logo } from '@/components/common/logo'
import { Button, Tooltip } from '@mantine/core'
import { ArrowLeft, X, File, Text, MessageSquare, Link, PlusIcon, Pencil } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export const ChatbotKnowledgeBaseSetup: React.FC = () => {
  const navigate = useNavigate()

  const [sources] = useState([
    { name: 'File', icon: File, count: 0 },
    { name: 'Text', icon: Text, count: 2 },
    { name: 'Q&A', icon: MessageSquare, count: 0 },
    { name: 'Links', icon: Link, count: 0 },
  ])

  return (
    <div className="flex flex-col h-screen">
      <header className="px-5 py-2 flex items-center justify-between">
        <Tooltip label="Go Back" position="bottom-start">
          <button
            className="p-1 hover:bg-icon-bg-hover rounded cursor-pointer border-0 bg-transparent"
            onClick={() => navigate('/landing')}
          >
            <ArrowLeft className="h-5 w-5 text-text-weak hover:text-icon-hover" />
          </button>
        </Tooltip>
        <Logo height={40} width={28} fontSize={25} logoIcon={false} />
        <Tooltip label="Close" position="bottom-end">
          <button
            className="border-0 bg-transparent p-0 cursor-pointer"
            onClick={() => navigate('/landing')}
          >
            <X className="h-5 w-5 text-text-weak hover:text-icon-hover" />
          </button>
        </Tooltip>
      </header>
      <div className="lg:px-32 px-6 flex-1 pt-1 pb-15 flex flex-wrap">
        <div className="border flex-1 border-border-week lg:mt-0 rounded-2xl flex overflow-hidden">
          <div className="lg:w-1/2 w-full h-full border-r border-border-week lg:p-20 px-8 py-12">
            <p className="text-3xl font-semibold text-center sm:text-left">Train your Agent</p>
            <p className="text-sm font-light text-center mt-3 sm:text-left">
              Provide documents or URLs to help your Agent learn and answer accurately.
            </p>
            <ul className="mt-10 list-none">
              {sources.map((source, index) => {
                const IconComponent = source.icon
                return (
                  <li
                    key={index}
                    className="flex items-center justify-between py-2 mt-8 border-b w-full border-border-week"
                  >
                    <div className="flex items-center">
                      <IconComponent className="h-5 w-5 text-text-primary" />
                      &nbsp;&nbsp;
                      <span className="text-text-primary text-md">
                        {source.count > 0 && `${source.count}`}
                        &nbsp;{source.name}
                      </span>
                    </div>

                    <button className="p-1 hover:bg-icon-bg-hover border border-border-week rounded cursor-pointer bg-transparent">
                      {source.count > 0 ? (
                        <Pencil className="h-4 w-4 text-text-weak hover:text-icon-hover" />
                      ) : (
                        <PlusIcon className="h-4 w-4 text-text-weak hover:text-icon-hover" />
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
            <div className="mt-24 flex justify-center items-center">
              <Button type="submit" variant="default" style={{ width: '75%' }}>
                Train & Continue to agent dashboard
              </Button>
            </div>
          </div>
          <div className="w-1/2 h-full hidden lg:block bg-[radial-gradient(circle,#ebebeb_2px,#fafafa_0)] bg-size-[30px_30px]"></div>
        </div>
      </div>
    </div>
  )
}
