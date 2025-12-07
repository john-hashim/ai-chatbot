import { Logo } from '@/components/common/logo'
import { Button, Tooltip } from '@mantine/core'
import { ArrowLeft, X, File, Text, MessageSquare, Link, PlusIcon, Pencil } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UploadFile } from '../sources/File'
import { UploadLinks } from '../sources/Links'
import { UploadText } from '../sources/Text'
import { UploadQandA } from '../sources/QandA'

export const ChatbotKnowledgeBaseSetup: React.FC = () => {
  const navigate = useNavigate()

  const [sources, setSources] = useState([
    { name: 'File', icon: File, count: 0, isSelected: false },
    { name: 'Text', icon: Text, count: 0, isSelected: false },
    { name: 'Q&A', icon: MessageSquare, count: 0, isSelected: false },
    { name: 'Links', icon: Link, count: 0, isSelected: false },
  ])

  const handleSourceClick = (index: number) => {
    setSources(prevSources =>
      prevSources.map((source, i) =>
        i === index
          ? { ...source, isSelected: !source.isSelected }
          : { ...source, isSelected: false }
      )
    )
  }

  const unselectSource = () => {
    setSources(prevSources => prevSources.map(source => ({ ...source, isSelected: false })))
  }

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
            className="p-1 hover:bg-icon-bg-hover rounded cursor-pointer border-0 bg-transparent"
            onClick={() => navigate('/landing')}
          >
            <X className="h-5 w-5 text-text-weak hover:text-icon-hover" />
          </button>
        </Tooltip>
      </header>
      <div className="lg:px-32 px-6 flex-1 pt-1 pb-15 flex flex-wrap div-fade-animation">
        <div className="border flex-1 border-border-week lg:mt-0 rounded-2xl flex overflow-hidden div-fade-animation">
          <div
            className={`${sources.some(source => source.isSelected) && 'hidden lg:block lg:w-1/2 border-r'} w-full h-full border-border-week lg:p-20 px-8 py-12 div-fade-animation`}
          >
            <p className="text-3xl font-semibold text-center sm:text-left">Train your Agent</p>
            <p className="text-xs font-light text-center mt-1 sm:text-left">
              Provide documents or URLs to help your Agent learn and answer accurately.
            </p>
            <ul className="mt-6 list-none">
              {sources.map((source, index) => {
                const IconComponent = source.icon
                return (
                  <li
                    key={index}
                    className={`${source.isSelected && `bg-background-dark-week rounded`} flex items-center justify-between p-2 mt-8 border-b w-full border-border-week`}
                  >
                    <div className="flex items-center">
                      <IconComponent className="h-4 w-4 text-text-secondary" />
                      &nbsp;
                      <span className="text-text-primary text-md">
                        {source.count > 0 && `${source.count}`}
                        &nbsp;{source.name}
                      </span>
                    </div>

                    <button
                      onClick={() => handleSourceClick(index)}
                      className="p-1 hover:bg-icon-bg-hover border border-border-week rounded cursor-pointer bg-transparent"
                    >
                      {source.isSelected ? (
                        <X className="h-4 w-4 text-text-weak hover:text-icon-hover" />
                      ) : source.count > 0 ? (
                        <Pencil className="h-4 w-4 text-text-weak hover:text-icon-hover" />
                      ) : (
                        <PlusIcon className="h-4 w-4 text-text-weak hover:text-icon-hover" />
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
            <div className="mt-14 flex justify-center items-center">
              <Button type="submit" variant="default" style={{ width: '75%' }}>
                Train & Continue
              </Button>
            </div>
          </div>

          {sources.some(source => source.isSelected) && (
            <div className="w-full lg:w-1/2 h-full div-fade-animation p-3">
              <button
                className="p-1 hover:bg-icon-bg-hover rounded cursor-pointer border-0 bg-transparent ml-auto flex justify-end"
                onClick={() => unselectSource()}
              >
                <X className="h-4 w-4 text-text-weak hover:text-icon-hover" />
              </button>
              <div>
                {sources.map(source => {
                  if (!source.isSelected) return null
                  switch (source.name) {
                    case 'File':
                      return <UploadFile key={source.name} />
                    case 'Links':
                      return <UploadLinks key={source.name} />
                    case 'Text':
                      return <UploadText key={source.name} />
                    case 'Q&A':
                      return <UploadQandA key={source.name} />
                    default:
                      return null
                  }
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
