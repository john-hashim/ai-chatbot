import { useMemo, useState } from 'react'
import { Button } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { isAxiosError } from 'axios'
import { File, HelpCircle, Link, Loader2, Type } from 'lucide-react'
import { UploadFile } from '../sources/File'
import { UploadQandA } from '../sources/QandA'
import { UploadText } from '../sources/Text'
import { UploadLinks } from '../sources/Links'
import { useChatbotStore } from '@/store'
import { useFormat } from '@/hooks/useFormats'
import { showNotification } from '@/utils/notifications'

type Tab = 'files' | 'qa' | 'text' | 'links' | 'details'

const DataSourcesPanel: React.FC<{
  dataSources: { icon: React.ElementType; label: string; count: number; size: number }[]
  totalSize: number
  formatFileSize: (bytes: number) => string
  lastTrained: Date | null
  untrainedCount: number
  onRetrain: () => void
  isTraining: boolean
}> = ({
  dataSources,
  totalSize,
  formatFileSize,
  lastTrained,
  untrainedCount,
  onRetrain,
  isTraining,
}) => (
  <div>
    <p className="py-2 font-bold text-lg text-text-primary">Data Sources</p>
    <div className="mt-4 flex flex-col gap-1">
      {dataSources
        .filter(source => source.count > 0)
        .map(source => (
          <div
            key={source.label}
            className="flex items-center justify-between px-4 py-3 border border-border-week bg-white rounded-lg"
          >
            <div className="flex items-center gap-2 text-sm text-text-primary">
              <source.icon size={16} />
              <span>
                &nbsp;
                {source.count}&nbsp;{source.label}
              </span>
            </div>
            <span className="text-sm text-text-primary font-medium">
              {formatFileSize(source.size)}
            </span>
          </div>
        ))}
    </div>
    <div className="mt-3 flex flex-col gap-3 border border-border-week bg-white rounded-lg px-4 py-3">
      <div className="flex items-center justify-between text-sm text-text-primary font-semibold">
        <span>Total Size</span>
        <span>{formatFileSize(totalSize)} / 400 KB</span>
      </div>
      <Button fullWidth onClick={onRetrain} loading={isTraining} disabled={isTraining}>
        Retrain Agent
      </Button>
      <div className="flex items-center justify-between text-xs text-text-primary">
        <span>
          Last trained: {lastTrained ? new Date(lastTrained).toLocaleDateString() : 'Never'}
        </span>
        {untrainedCount > 0 && (
          <span>
            {untrainedCount} untrained document{untrainedCount > 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
    {isTraining && (
      <div className="mt-3 flex items-center gap-3 border border-border-week bg-white rounded-lg px-4 py-3">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <div className="text-sm text-text-primary">
          <p className="font-medium">Training in progress</p>
          <p className="text-xs mt-0.5">This may take a while based on your knowledge base size.</p>
        </div>
      </div>
    )}
  </div>
)

export const KnowledgeBase: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('files')
  const isLargeScreen = useMediaQuery('(min-width: 1024px)')
  const { currentChatbot, getChatbot, trainChatbotDocuments } = useChatbotStore()
  const { formatFileSize } = useFormat()
  const [isTraining, setIsTraining] = useState(false)

  const handleRetrain = async () => {
    if (!currentChatbot?.id) return
    setIsTraining(true)
    try {
      await trainChatbotDocuments(currentChatbot.id)
      showNotification('success', 'Training complete.')
      getChatbot(currentChatbot.id).catch(error => {
        if (isAxiosError(error) && error.response && error.response.status < 500) {
          showNotification('error', 'Could not refresh chatbot. Please try again.')
        }
      })
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) {
        showNotification('error', 'This chatbot no longer exists.')
      } else if (isAxiosError(error) && error.response && error.response.status < 500) {
        showNotification('error', 'Training failed. Please try again.')
      }
    } finally {
      setIsTraining(false)
    }
  }

  const sizeByType = useMemo(() => {
    const docs = currentChatbot?.documents || []
    return {
      file: docs.filter(d => d.type === 'document').reduce((sum, d) => sum + d.size, 0),
      qa: docs.filter(d => d.type === 'q&a').reduce((sum, d) => sum + d.size, 0),
      text: docs.filter(d => d.type === 'text').reduce((sum, d) => sum + d.size, 0),
      link: docs.filter(d => d.type === 'website').reduce((sum, d) => sum + d.size, 0),
    }
  }, [currentChatbot?.documents])

  const dataSources = [
    { icon: File, label: 'File', count: currentChatbot?.fileCount || 0, size: sizeByType.file },
    { icon: HelpCircle, label: 'Q&A', count: currentChatbot?.QandACount || 0, size: sizeByType.qa },
    { icon: Type, label: 'Text', count: currentChatbot?.textCount || 0, size: sizeByType.text },
    { icon: Link, label: 'Link', count: currentChatbot?.linkCount || 0, size: sizeByType.link },
  ]

  const untrainedCount = useMemo(() => {
    return (currentChatbot?.documents || []).filter(d => d.status !== 'trained').length
  }, [currentChatbot?.documents])

  const tabs: { key: Tab; label: string }[] = [
    { key: 'files', label: 'Files' },
    { key: 'qa', label: 'Q&A' },
    { key: 'text', label: 'Text' },
    { key: 'links', label: 'Links' },
  ]

  return (
    <div className="flex h-full">
      <div className="flex-1 border-r border-r-border-week w-full h-full flex flex-col">
        <p className="pt-8 pb-2 px-6 font-semibold text-2xl">Knowledge Base</p>
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
              <button onClick={() => setActiveTab('details')} className="px-6 py-2 font-medium">
                <span
                  className={`pb-2 border-b-2 text-sm cursor-pointer transition-colors duration-350 ${
                    activeTab === 'details'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Details
                </span>
              </button>
            )}
          </div>
          <div className="flex-1 min-h-0 overflow-auto py-6 px-4">
            {activeTab === 'files' && (
              <div className="h-full">
                <UploadFile />
              </div>
            )}
            {activeTab === 'qa' && (
              <div className="h-full">
                <UploadQandA />
              </div>
            )}
            {activeTab === 'text' && (
              <div className="h-full">
                <UploadText />
              </div>
            )}
            {activeTab === 'links' && (
              <div className="h-full">
                <UploadLinks />
              </div>
            )}
            {activeTab === 'details' && (
              <div className="h-full p-6 bg-background-dark-week">
                <DataSourcesPanel
                  dataSources={dataSources}
                  totalSize={currentChatbot?.totalSize || 0}
                  formatFileSize={formatFileSize}
                  lastTrained={currentChatbot?.lastTrained || null}
                  untrainedCount={untrainedCount}
                  onRetrain={handleRetrain}
                  isTraining={isTraining}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="lg:w-[35%] h-full hidden px-6 py-6 lg:flex lg:flex-col bg-background-dark-week">
        <DataSourcesPanel
          dataSources={dataSources}
          totalSize={currentChatbot?.totalSize || 0}
          formatFileSize={formatFileSize}
          lastTrained={currentChatbot?.lastTrained || null}
          untrainedCount={untrainedCount}
          onRetrain={handleRetrain}
          isTraining={isTraining}
        />
      </div>
    </div>
  )
}
