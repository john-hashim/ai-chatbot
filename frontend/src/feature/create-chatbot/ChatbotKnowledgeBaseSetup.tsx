import { Logo } from '@/components/common/logo'
import { Button, Tooltip } from '@mantine/core'
import {
  ArrowLeft,
  X,
  File,
  Text,
  MessageSquare,
  Link,
  PlusIcon,
  Pencil,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { UploadFile } from '../sources/File'
import { UploadLinks } from '../sources/Links'
import { UploadText } from '../sources/Text'
import { UploadQandA } from '../sources/QandA'
import { useChatbotStore } from '@/store'
import { useFormat } from '@/hooks/useFormats'
import { usePageTitle } from '@/hooks/usePageTitle'
import { showNotification } from '@/utils/notifications'
import { isAxiosError } from 'axios'

export const ChatbotKnowledgeBaseSetup: React.FC = () => {
  usePageTitle('Setup Knowledge Base')
  const navigate = useNavigate()
  const [sources, setSources] = useState([
    { name: 'File', icon: File, count: 0, isSelected: false },
    { name: 'Text', icon: Text, count: 0, isSelected: false },
    { name: 'Q&A', icon: MessageSquare, count: 0, isSelected: false },
    { name: 'Links', icon: Link, count: 0, isSelected: false },
  ])
  const { chatbotId } = useParams()
  const { getChatbot, currentChatbot, trainChatbotDocuments } = useChatbotStore()
  const { formatFileSize } = useFormat()
  const MAX_STORAGE_MB = 400

  const [isTraining, setIsTraining] = useState(false)

  const handleTrainAndContinue = async () => {
    if (!chatbotId) return

    setIsTraining(true)
    try {
      await trainChatbotDocuments(chatbotId)
      showNotification('success', 'Training complete.')
      navigate(`/chatbot/${chatbotId}`)
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) {
        showNotification('error', 'This chatbot no longer exists.')
      } else if (isAxiosError(error) && error.response && error.response.status < 500) {
        showNotification('error', 'Training failed. Please try again.')
      }
      // 5xx / network already surfaced by the interceptor — stay silent here.
    } finally {
      setIsTraining(false)
    }
  }

  useEffect(() => {
    if (!chatbotId) return
    getChatbot(chatbotId).catch(error => {
      if (isAxiosError(error) && error.response?.status === 404) {
        showNotification('error', 'This chatbot no longer exists.')
      } else if (isAxiosError(error) && error.response && error.response.status < 500) {
        showNotification('error', 'Could not load chatbot. Please try again.')
      }
    })
  }, [chatbotId, getChatbot])

  useEffect(() => {
    if (currentChatbot) {
      setSources(prevSources =>
        prevSources.map(source => {
          switch (source.name) {
            case 'File':
              return { ...source, count: currentChatbot.fileCount || 0 }
            case 'Text':
              return { ...source, count: currentChatbot.textCount || 0 }
            case 'Q&A':
              return { ...source, count: currentChatbot.QandACount || 0 }
            case 'Links':
              return { ...source, count: currentChatbot.linkCount || 0 }
            default:
              return source
          }
        })
      )
    }
  }, [currentChatbot])

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
      <div className="lg:px-32 px-6 pt-1 pb-15 flex flex-wrap div-fade-animation">
        <div className="border flex-1 border-border-week lg:mt-0 rounded-2xl flex overflow-hidden div-fade-animation">
          <div
            className={`${sources.some(source => source.isSelected) && 'hidden lg:block lg:w-1/2 border-r'} w-full h-full border-border-week lg:p-20 px-8 py-12 div-fade-animation`}
          >
            <p className="text-3xl font-semibold text-center sm:text-left">Train your Agent</p>
            <p className="text-xs font-light text-center mt-1 sm:text-left">
              Provide documents or URLs to help your Agent learn and answer accurately. You can
              always add more later.
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
                      {source.count > 0 ? (
                        <CheckCircle2 className="h-6 w-6 text-white fill-green-800" />
                      ) : (
                        <IconComponent className="h-4 w-4 text-text-secondary" />
                      )}
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
                        <Pencil className="h-4 w-4 fill-text-weak hover:text-icon-hover" />
                      ) : (
                        <PlusIcon className="h-4 w-4 text-text-weak hover:text-icon-hover" />
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
            <div className="mt-14 flex flex-col items-center gap-2">
              <p className="text-xs text-text-secondary">
                {formatFileSize(currentChatbot?.totalSize || 0)} / {MAX_STORAGE_MB} MB used
              </p>
              <Button
                type="button"
                variant="default"
                style={{ width: '75%' }}
                onClick={handleTrainAndContinue}
                disabled={isTraining}
              >
                {isTraining ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Training...
                  </>
                ) : (
                  'Train & Continue'
                )}
              </Button>
            </div>
          </div>

          {sources.some(source => source.isSelected) && (
            <div className="w-full lg:w-1/2 max-h-[82vh] overflow-y-auto div-fade-animation p-3">
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
