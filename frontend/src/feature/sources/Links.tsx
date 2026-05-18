import { Button, TextInput } from '@mantine/core'
import { useRef, useState } from 'react'
import { Tabs } from '@mantine/core'
import { Info, Link, Loader2 } from 'lucide-react'
import { isAxiosError } from 'axios'
import { useApi } from '@/hooks/useApi'
import type { ApiResponse } from '@/types/api'
import { documentService } from '@/api/services/document'
import { useChatbotStore } from '@/store'
import type { Document } from '@/types/document'
import { showLoadingNotification } from '@/utils/notifications'
import { DocumentSourceTable } from './DocumentSourceTable'
import type { DocumentSourceTableRef } from './DocumentSourceTable'

export const UploadLinks: React.FC = () => {
  const [url, setUrl] = useState('')
  const [activeTab, setActiveTab] = useState<'url' | 'sitemap'>('url')
  const { currentChatbot, addDocument } = useChatbotStore()
  const tableRef = useRef<DocumentSourceTableRef>(null)

  const { execute: executeWebsiteCrawl, loading } = useApi<
    ApiResponse<Document>,
    [{ url: string; subtype: 'url' | 'sitemap' }, string]
  >(documentService.uploadWebsiteUrl)

  const handleSubmit = async () => {
    if (!url.trim() || !currentChatbot) return

    const notification = showLoadingNotification(
      activeTab === 'url' ? 'Crawling Website' : 'Loading Sitemap',
      'Please wait while we fetch and process the content'
    )

    try {
      await executeWebsiteCrawl({ url: url.trim(), subtype: activeTab }, currentChatbot.id)
      await addDocument()
      tableRef.current?.reset()
      setUrl('')
      notification.success('Website content added successfully')
    } catch (error) {
      if (isAxiosError(error)) {
        const status = error.response?.status
        // No response (network error) or 5xx — interceptor already toasted; stay silent.
        if (!status || status >= 500) {
          notification.update({ loading: false, message: '', autoClose: 1 })
          return
        }
        if (status === 400) {
          notification.error(
            error.response?.data?.message ?? 'Invalid URL. Please check and try again.'
          )
          return
        }
        if (status === 404) {
          notification.error('This chatbot no longer exists.')
          return
        }
      }
      notification.error('Could not fetch website content. Please try again.')
    }
  }

  return (
    <div className="px-4">
      <header className="text-center sm:text-left">
        <p className="text-2xl font-semibold">Website</p>
        <p className="text-sm mt-1 font-light text-text-weak max-w-2/3 mx-auto sm:mx-0">
          Enter your website URL so the AI can learn from your latest content.
        </p>
      </header>
      <Tabs
        value={activeTab}
        onChange={value => setActiveTab(value as 'url' | 'sitemap')}
        className="mt-10"
      >
        <Tabs.List>
          <Tabs.Tab value="url" leftSection={<Link size={15} />}>
            Website
          </Tabs.Tab>
          {/* Phase 2: Sitemap functionality */}
          {/* <Tabs.Tab value="sitemap" leftSection={<ListTree size={15} />}>
            Sitemap
          </Tabs.Tab> */}
        </Tabs.List>

        <Tabs.Panel value="url">
          <div className="mt-5">
            <p className="text-text-secondary text-sm">URL</p>
            <TextInput
              value={url}
              onChange={e => setUrl(e.target.value)}
              className="mt-1"
              type="text"
              id="url-input"
              placeholder="https://example.com/pricing"
            />
            <div className="my-2 py-2 flex items-center px-4 bg-background-dark-week rounded-xl text-sm text-text-weak">
              <span>
                <Info size={15} />
              </span>{' '}
              <p className="ml-2">
                Add a single webpage to your knowledge base. The content from this page will be
                extracted and processed.
              </p>
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <Button
              onClick={handleSubmit}
              variant="default"
              disabled={!url.trim() || loading}
              leftSection={loading ? <Loader2 size={16} className="animate-spin" /> : null}
            >
              {loading ? 'Fetching...' : 'Fetch data from link'}
            </Button>
          </div>
        </Tabs.Panel>

        <Tabs.Panel value="sitemap">
          <div className="mt-5">
            <p className="text-text-secondary text-sm">Sitemap URL</p>
            <TextInput
              value={url}
              onChange={e => setUrl(e.target.value)}
              className="mt-1"
              type="text"
              id="sitemap-input"
              placeholder="https://example.com/sitemap.xml"
            />
            <div className="my-2 py-2 flex items-center px-4 bg-background-dark-week rounded-xl text-sm text-text-weak">
              <span>
                <Info size={15} />
              </span>{' '}
              <p className="ml-2">
                Add multiple pages at once using a sitemap XML file (usually found at
                example.com/sitemap.xml). All pages listed will be crawled and added.
              </p>
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <Button
              onClick={handleSubmit}
              variant="default"
              disabled={!url.trim() || loading}
              leftSection={loading ? <Loader2 size={16} className="animate-spin" /> : null}
            >
              {loading ? 'Loading...' : 'Load Sitemap'}
            </Button>
          </div>
        </Tabs.Panel>
      </Tabs>

      {currentChatbot && currentChatbot.linkCount && currentChatbot.linkCount > 0 ? (
        <DocumentSourceTable ref={tableRef} documentType="website" title="Website sources" />
      ) : (
        ''
      )}
    </div>
  )
}
