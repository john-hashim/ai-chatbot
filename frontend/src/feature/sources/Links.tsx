import { Button, TextInput, Checkbox, Select, Text, Tooltip, Menu } from '@mantine/core'
import { useRef, useState } from 'react'
import { Tabs } from '@mantine/core'
import {
  Info,
  Link,
  // ListTree,
  Loader2,
  Search,
  ChevronDown,
  Ellipsis,
  Trash,
  SearchX,
} from 'lucide-react'
import { useApi } from '@/hooks/useApi'
import type { ApiResponse } from '@/types/api'
import { chatbotService } from '@/api/services/chatbot'
import { useChatbotStore } from '@/store'
import type { Document, SortOption } from '@/types/document'
import { useFormat } from '@/hooks/useFormats'
import { showLoadingNotification } from '@/utils/notifications'
import classes from '@/theme.module.css'
import { modals } from '@mantine/modals'
import { TagComponent } from '@/components/common/tag'

export const UploadLinks: React.FC = () => {
  const [url, setUrl] = useState('')
  const [activeTab, setActiveTab] = useState<'url' | 'sitemap'>('url')
  const {
    currentChatbot,
    addDocument,
    deleteDocument,
    deleteMultipleDocuments,
    setDocumentFilters,
    documentFilters,
    getChatbot,
  } = useChatbotStore()
  const { formatFileSize } = useFormat()
  const [documentToDelete, setDocumentsToDelete] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)

  const { execute: executeWebsiteCrawl, loading } = useApi<
    ApiResponse<Document>,
    [{ url: string; subtype: 'url' | 'sitemap' }, string]
  >(chatbotService.uploadWebsiteUrl)

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
          setDocumentsToDelete([])
          setSelectAll(false)
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

  const handleSelectedDocuments = (id: string) => {
    let updated: string[]
    if (documentToDelete.includes(id)) {
      updated = documentToDelete.filter(docId => docId !== id)
    } else {
      updated = [...documentToDelete, id]
    }
    setDocumentsToDelete(updated)

    if (currentChatbot) {
      const websiteDocsCount = currentChatbot.documents.filter(doc => doc.type === 'website').length
      setSelectAll(updated.length === websiteDocsCount)
    }
  }

  const handleSelectAll = () => {
    if (selectAll) {
      setDocumentsToDelete([])
      setSelectAll(false)
    } else {
      if (currentChatbot) {
        const allIds = currentChatbot.documents
          .filter(doc => doc.type === 'website')
          .map(doc => doc.id)
        setDocumentsToDelete(allIds)
        setSelectAll(true)
      }
    }
  }

  const handleDeleteSingle = async (documentId: string, documentName: string) => {
    modals.openConfirmModal({
      title: 'Delete website source',
      centered: true,
      children: (
        <Text size="sm">
          {`Are you sure you want to delete "${documentName}"? This action cannot be undone.`}
        </Text>
      ),
      labels: { confirm: 'Delete Document', cancel: 'Cancel' },
      confirmProps: { color: 'red', variant: 'filled' },
      onConfirm: async () => {
        const notification = showLoadingNotification('Deleting website source', 'Please wait...')
        try {
          await deleteDocument(documentId)
          notification.success('Website source deleted successfully')
          setDocumentsToDelete([])
        } catch (e) {
          notification.error(`Failed to delete: ${e}`)
          setDocumentsToDelete([])
        }
      },
      onCancel: () => console.log('cancelled'),
    })
  }

  const handleDeleteMultiple = async () => {
    modals.openConfirmModal({
      title: 'Delete website sources',
      centered: true,
      children: (
        <Text size="sm">
          {`Are you sure you want to delete ${documentToDelete.length} website source(s)? This action cannot be undone.`}
        </Text>
      ),
      labels: { confirm: 'Delete Documents', cancel: 'Cancel' },
      confirmProps: { color: 'red', variant: 'filled' },
      onConfirm: async () => {
        const notification = showLoadingNotification(
          'Deleting website sources',
          `Deleting ${documentToDelete.length} source(s)...`
        )
        try {
          const deletedCount = await deleteMultipleDocuments(documentToDelete)
          setDocumentsToDelete([])
          setSelectAll(false)
          notification.success(`Successfully deleted ${deletedCount} source(s)`)
        } catch (e) {
          notification.error(`Failed to delete: ${e}`)
        }
      },
      onCancel: () => console.log('cancelled'),
    })
  }

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null)

  const handleSearch = (query: string) => {
    setDocumentFilters({ ...documentFilters, searchParam: query })
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => {
      getChatbot()
    }, 300)
  }

  const handleSortChange = (value: string | null) => {
    if (value) {
      setDocumentFilters({ ...documentFilters, sortBy: value as SortOption })
      getChatbot()
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
        <div>
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <p className="text-md font-semibold text-center sm:text-left">Website sources</p>
              <div>
                <TextInput
                  className="mt-1"
                  type="text"
                  id="search-website"
                  placeholder="Search"
                  leftSection={<Search size={16} />}
                  value={documentFilters.searchParam}
                  onChange={e => handleSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-6">
              <div className="flex items-center justify-between gap-2">
                <Checkbox
                  label={<span className="text-xs sm:text-sm">Select All</span>}
                  checked={selectAll}
                  onChange={handleSelectAll}
                />
                <div className="flex items-center">
                  <p className="text-xs sm:text-sm mr-2 hidden sm:block">Sort By:</p>
                  <div style={{ width: 'fit-content', minWidth: '100px' }}>
                    <Select
                      placeholder="Sort"
                      data={[
                        'Default',
                        'Oldest',
                        'Newest',
                        'Alphabetical(A-Z)',
                        'Alphabetical(Z-A)',
                      ]}
                      checkIconPosition="right"
                      classNames={{ input: classes.selectInputBorderless }}
                      rightSection={<ChevronDown size={16} />}
                      comboboxProps={{ width: 200, position: 'bottom-end' }}
                      value={documentFilters.sortBy}
                      onChange={handleSortChange}
                    />
                  </div>
                </div>
              </div>
              {documentToDelete.length > 0 && (
                <div className="mt-3 div-fade-animation">
                  <Button
                    color="#ff0000"
                    variant="filled"
                    size="xs"
                    leftSection={<Trash size={14} />}
                    onClick={handleDeleteMultiple}
                  >
                    Delete Selected ({documentToDelete.length})
                  </Button>
                </div>
              )}
            </div>
          </div>
          <div className="border-b mt-2 border-border-week"></div>
          {currentChatbot.documents && currentChatbot.documents.length > 0 ? (
            currentChatbot.documents
              .filter(document => document.type === 'website')
              .map(document => (
                <div key={document.id}>
                  <div className="py-4 font-semibold flex justify-between items-center">
                    <div className="flex">
                      <div>
                        <Checkbox
                          label={document.name}
                          checked={documentToDelete.includes(document.id)}
                          onChange={() => handleSelectedDocuments(document.id)}
                        />
                        <p className="text-text-weak font-normal ml-8 text-xs">
                          {formatFileSize(document.size)}
                        </p>
                      </div>
                      <Tooltip label="Not Trained yet" position="bottom-end">
                        <div className="ml-2">
                          <TagComponent text="new" className="cursor-pointer" color="#97f4b9" />
                        </div>
                      </Tooltip>
                    </div>
                    <Menu shadow="md" width={200}>
                      <Menu.Target>
                        <Ellipsis className="h-4 w-4 text-icon cursor-pointer" />
                      </Menu.Target>

                      <Menu.Dropdown>
                        <Menu.Item
                          color="red"
                          onClick={() => handleDeleteSingle(document.id, document.name)}
                          leftSection={<Trash size={14} />}
                        >
                          Delete
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </div>
                  <div className="border-b mt-2 border-border-week"></div>
                </div>
              ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-text-weak">
              <SearchX className="h-6 w-6 mb-3 opacity-50" />
              <p className="text-lg font-medium">No results found</p>
            </div>
          )}
        </div>
      ) : (
        ''
      )}
    </div>
  )
}
