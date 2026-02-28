import { Button, TextInput } from '@mantine/core'
import { useRef, useState } from 'react'
import { Tabs } from '@mantine/core'
import { Info, Link, Loader2 } from 'lucide-react'
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
    if (!url.trim()) return

    const notification = showLoadingNotification(
      activeTab === 'url' ? 'Crawling Website' : 'Loading Sitemap',
      'Please wait while we fetch and process the content'
    )
    try {
      if (currentChatbot) {
        const data = {
          url: url.trim(),
          subtype: activeTab,
        }

        const resp = await executeWebsiteCrawl(data, currentChatbot.id)
        if (resp.status === 'success' && resp.data) {
          await addDocument()
          tableRef.current?.reset()
          setUrl('')
          notification.success('Website content added successfully')
        } else {
          notification.error('Failed to fetch website content')
        }
      }
    } catch (e) {
      console.log(e)
      notification.error('Failed to fetch website content')
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
