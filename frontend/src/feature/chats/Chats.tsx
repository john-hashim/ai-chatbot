import type React from 'react'
import { useCallback, useEffect, useState } from 'react'
import { useMediaQuery } from '@mantine/hooks'
import { Button, Menu, Modal, Select, Text, Tooltip } from '@mantine/core'
import { ChevronDown, Download, FileJson, FileSpreadsheet, FileText, RefreshCw } from 'lucide-react'
import { isAxiosError } from 'axios'
import { ChatsList } from './ChatsList'
import { ChatDetails } from './ChatDetails'
import { useChatbotStore } from '@/store'
import { type ChatSession } from '@/types/chatbot'
import { showNotification } from '@/utils/notifications'
import classes from '@/theme.module.css'
import type { ChatSessionSortOption } from '@/types/common'

type ExportFormat = 'json' | 'csv' | 'pdf'

export const Chats: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chatslist' | 'chatdetails'>('chatslist')
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [sessionDeleting, setSessionDeleting] = useState(false)
  const [exportLoading, setExportLoading] = useState<Record<ExportFormat, boolean>>({
    json: false,
    csv: false,
    pdf: false,
  })
  const isLargeScreen = useMediaQuery('(min-width: 1024px)')
  const {
    currentChatbot,
    chatSession,
    isLoadingSessions,
    isLoadingSessionDetails,
    getChatSessions,
    getSessionDetails,
    setChatSessionFilters,
    deleteChatSession,
    exportChats,
  } = useChatbotStore()

  const notifyFetchError = useCallback((error: unknown, fallback: string) => {
    if (isAxiosError(error) && error.response && error.response.status < 500) {
      showNotification('error', fallback)
    }
  }, [])

  const fetchSessions = useCallback(
    (chatbotId: string) => {
      getChatSessions(chatbotId).catch(error =>
        notifyFetchError(error, 'Could not load chat sessions. Please try again.')
      )
    },
    [getChatSessions, notifyFetchError]
  )

  const handleRefresh = useCallback(() => {
    if (!currentChatbot?.id) return
    fetchSessions(currentChatbot.id)
  }, [currentChatbot?.id, fetchSessions])

  const downloadBlob = useCallback((blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      if (!currentChatbot?.id) return
      setExportLoading(prev => ({ ...prev, [format]: true }))
      try {
        const blob = await exportChats(currentChatbot.id, format)
        downloadBlob(blob, `chats-export.${format}`)
        showNotification('success', `Chats exported as ${format.toUpperCase()}.`)
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 404) {
          showNotification('error', 'No chats available to export.')
        } else if (isAxiosError(error) && error.response && error.response.status < 500) {
          showNotification('error', `Could not export chats as ${format.toUpperCase()}.`)
        }
      } finally {
        setExportLoading(prev => ({ ...prev, [format]: false }))
      }
    },
    [currentChatbot?.id, exportChats, downloadBlob]
  )

  useEffect(() => {
    if (currentChatbot?.id) {
      fetchSessions(currentChatbot.id)
    }
  }, [currentChatbot?.id, fetchSessions])

  useEffect(() => {
    if (chatSession.chatSessions.length > 0 && !selectedSession) {
      setSelectedSession(chatSession.chatSessions[0])
    }
  }, [chatSession.chatSessions, selectedSession])

  useEffect(() => {
    if (selectedSession?.id && currentChatbot?.id) {
      getSessionDetails(currentChatbot.id, selectedSession.id).catch(error =>
        notifyFetchError(error, 'Could not load conversation details.')
      )
    }
  }, [selectedSession?.id, currentChatbot?.id, getSessionDetails, notifyFetchError])

  useEffect(() => {
    if (selectedSession) {
      const updated = chatSession.chatSessions.find(s => s.id === selectedSession.id)
      if (updated && updated !== selectedSession) setSelectedSession(updated)
    }
  }, [chatSession.chatSessions, selectedSession])

  const handleSelectSession = useCallback(
    (id: string) => {
      const session = chatSession.chatSessions.find(s => s.id === id) ?? null
      setSelectedSession(session)
    },
    [chatSession.chatSessions]
  )

  const handleSessionDelete = useCallback(() => {
    if (currentChatbot && selectedSession) {
      setDeleteModalOpen(true)
    }
  }, [currentChatbot, selectedSession])

  const confirmDelete = async () => {
    if (!currentChatbot || !selectedSession) return
    setSessionDeleting(true)
    try {
      await deleteChatSession(currentChatbot.id, selectedSession.id)
      showNotification('success', 'Conversation deleted successfully.')
      setDeleteModalOpen(false)
      setSelectedSession(null)
      fetchSessions(currentChatbot.id)
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) {
        showNotification('error', 'This conversation no longer exists.')
        setDeleteModalOpen(false)
      } else if (isAxiosError(error) && error.response && error.response.status < 500) {
        showNotification('error', 'Could not delete conversation. Please try again.')
      }
    } finally {
      setSessionDeleting(false)
    }
  }

  const handleSortChange = (value: string | null) => {
    if (value && !!currentChatbot?.id) {
      setChatSessionFilters({ ...chatSession.filters, sortBy: value as ChatSessionSortOption })
      fetchSessions(currentChatbot.id)
    }
  }

  return (
    <div className="flex h-full">
      <div className="lg:w-[500px] border-r bg-background-dark-week border-r-border-week w-full h-full flex flex-col relative overflow-auto">
        <div className="py-5 px-6 flex items-center justify-between">
          <p className="font-semibold text-2xl">Chat Logs</p>
          <div className="flex gap-2">
            <Tooltip label="Refresh">
              <Button variant="secondary" size="compact-sm" radius="md" onClick={handleRefresh}>
                <RefreshCw
                  size={16}
                  strokeWidth={1.5}
                  className={isLoadingSessions ? 'animate-spin' : ''}
                />
              </Button>
            </Tooltip>
            {chatSession.chatSessions?.length > 0 && (
              <Menu shadow="md" width={180}>
                <Menu.Target>
                  <Tooltip label="Export">
                    <Button variant="default" size="compact-sm" radius="md">
                      <Download size={16} strokeWidth={1.5} />
                    </Button>
                  </Tooltip>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item
                    leftSection={<FileSpreadsheet size={14} />}
                    disabled={exportLoading.csv}
                    onClick={() => handleExport('csv')}
                  >
                    Export as CSV
                  </Menu.Item>
                  <Menu.Item
                    leftSection={<FileText size={14} />}
                    disabled={exportLoading.pdf}
                    onClick={() => handleExport('pdf')}
                  >
                    Export as PDF
                  </Menu.Item>
                  <Menu.Item
                    leftSection={<FileJson size={14} />}
                    disabled={exportLoading.json}
                    onClick={() => handleExport('json')}
                  >
                    Export as JSON
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            )}
          </div>
        </div>
        <div className="mx-6 my-2 flex items-center justify-end">
          <p className="text-xs sm:text-sm mr-2 hidden sm:block">Sort By:</p>
          <div style={{ width: 'fit-content', minWidth: '100px' }}>
            <Select
              placeholder="Sort"
              data={['Default', 'Oldest', 'Newest']}
              checkIconPosition="right"
              classNames={{ input: classes.selectInputBorderless }}
              rightSection={<ChevronDown size={16} />}
              comboboxProps={{ width: 200, position: 'bottom-end' }}
              value={chatSession.filters.sortBy}
              onChange={handleSortChange}
            />
          </div>
        </div>
        <div className="flex-1 flex flex-col min-h-0">
          {!isLargeScreen && (
            <div className="flex border-b border-border-week">
              <button onClick={() => setActiveTab('chatslist')} className="px-6 py-2 font-medium">
                <span
                  className={`pb-2 border-b-2 text-sm cursor-pointer transition-colors duration-350 ${
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
                  className={`pb-2 border-b-2 text-sm cursor-pointer transition-colors duration-350 ${
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
                <ChatsList
                  chatSessions={chatSession.chatSessions}
                  selectedSessionId={selectedSession?.id ?? null}
                  onSelectSession={handleSelectSession}
                  loading={isLoadingSessions}
                />
              </div>
            )}
            {activeTab === 'chatdetails' && (
              <div className="h-full">
                <ChatDetails
                  session={selectedSession}
                  handleSessionDelete={handleSessionDelete}
                  loading={isLoadingSessionDetails}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex-1 h-full hidden lg:block">
        <ChatDetails
          session={selectedSession}
          handleSessionDelete={handleSessionDelete}
          loading={isLoadingSessionDetails}
        />
      </div>

      <Modal
        opened={deleteModalOpen}
        onClose={() => !sessionDeleting && setDeleteModalOpen(false)}
        title="Delete Conversation"
        centered
      >
        <Text size="sm">
          Are you sure you want to delete this conversation? This action cannot be undone.
        </Text>
        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="default"
            onClick={() => setDeleteModalOpen(false)}
            disabled={sessionDeleting}
          >
            Cancel
          </Button>
          <Button color="red" variant="filled" loading={sessionDeleting} onClick={confirmDelete}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  )
}
