import type React from 'react'
import { useCallback, useEffect, useState } from 'react'
import { useMediaQuery } from '@mantine/hooks'
import { Button, Menu, Modal, Text, Tooltip } from '@mantine/core'
import { Download, FileJson, FileSpreadsheet, FileText, RefreshCw } from 'lucide-react'
import { ChatsList } from './ChatsList'
import { ChatDetails } from './ChatDetails'
import { useStore } from '@/store'
import { useShallow } from 'zustand/react/shallow'
import { useApi } from '@/hooks/useApi'
import { chatService } from '@/api/services/chat'
import { type ChatSession } from '@/types/chatbot'
import type { ApiResponse } from '@/types/api'
import { showNotification } from '@/utils/notifications'

export const Chats: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chatslist' | 'chatdetails'>('chatslist')
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const isLargeScreen = useMediaQuery('(min-width: 1024px)')
  const {
    currentChatbot,
    chatSessions,
    isLoadingSessions,
    isLoadingSessionDetails,
    getChatSessions,
    getSessionDetails,
  } = useStore(
    useShallow(state => ({
      currentChatbot: state.currentChatbot,
      chatSessions: state.chatSessions,
      isLoadingSessions: state.isLoadingSessions,
      isLoadingSessionDetails: state.isLoadingSessionDetails,
      getChatSessions: state.getChatSessions,
      getSessionDetails: state.getSessionDetails,
    }))
  )
  const { execute: exportJSON, loading: jsonLoading } = useApi(chatService.exportChatsAsJSON)
  const { execute: exportCSV, loading: csvLoading } = useApi(chatService.exportChatsAsCSV)
  const { execute: exportPDF, loading: pdfLoading } = useApi(chatService.exportChatsAsPDF)
  const { execute: excuteDeleteChatSession, loading: sessionDeleting } = useApi<
    ApiResponse<null>,
    [string, string]
  >(chatService.deleteChatSession)

  const handleRefresh = useCallback(() => {
    if (!currentChatbot?.id) return
    getChatSessions(currentChatbot.id)
  }, [currentChatbot?.id, getChatSessions])

  const downloadBlob = useCallback((blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const handleExport = useCallback(
    async (format: 'json' | 'csv' | 'pdf') => {
      if (!currentChatbot?.id) return
      const exportFn = { json: exportJSON, csv: exportCSV, pdf: exportPDF }[format]
      const ext = { json: 'json', csv: 'csv', pdf: 'pdf' }[format]
      const blob = await exportFn(currentChatbot.id)
      downloadBlob(blob as unknown as Blob, `chats-export.${ext}`)
    },
    [currentChatbot?.id, exportJSON, exportCSV, exportPDF, downloadBlob]
  )

  useEffect(() => {
    if (currentChatbot?.id) {
      getChatSessions(currentChatbot.id)
    }
  }, [currentChatbot?.id, getChatSessions])

  useEffect(() => {
    if (chatSessions.length > 0 && !selectedSession) {
      setSelectedSession(chatSessions[0])
    }
  }, [chatSessions, selectedSession])

  // Fetch full messages when selected session changes
  useEffect(() => {
    if (selectedSession?.id && currentChatbot?.id) {
      getSessionDetails(currentChatbot.id, selectedSession.id)
    }
  }, [selectedSession?.id, currentChatbot?.id, getSessionDetails])

  // Sync selectedSession with store after messages are fetched
  useEffect(() => {
    if (selectedSession) {
      const updated = chatSessions.find(s => s.id === selectedSession.id)
      if (updated && updated !== selectedSession) setSelectedSession(updated)
    }
  }, [chatSessions, selectedSession])

  const handleSelectSession = useCallback(
    (id: string) => {
      const session = chatSessions.find(s => s.id === id) ?? null
      setSelectedSession(session)
    },
    [chatSessions]
  )

  const handleSessionDelete = useCallback(() => {
    if (currentChatbot && selectedSession) {
      setDeleteModalOpen(true)
    }
  }, [currentChatbot, selectedSession])

  const confirmDelete = async () => {
    if (currentChatbot && selectedSession) {
      try {
        const result = await excuteDeleteChatSession(currentChatbot.id, selectedSession.id)
        if (result.status === 'success') {
          showNotification('success', `Conversation deleted successfully`)
          setDeleteModalOpen(false)
          await getChatSessions(currentChatbot.id)
          setSelectedSession(null)
        }
      } catch (error) {
        showNotification('error', `Failed to delete Conversation: ${error}`)
      }
    }
  }

  return (
    <div className="flex h-full">
      <div className="lg:w-[500px] border-r bg-background-dark-week border-r-border-week w-full h-full flex flex-col relative overflow-auto">
        <div className="py-5 px-6 flex items-center justify-between">
          <p className="font-semibold text-2xl">Chat Logs</p>
          <div className="flex gap-2">
            {/* TODO: Add filter button in phase 2
            <Tooltip label="Filter">
              <Button variant="secondary" size="compact-sm" radius="md">
                <SlidersHorizontal size={16} strokeWidth={1.5} />
              </Button>
            </Tooltip>
            */}
            <Tooltip label="Refresh">
              <Button variant="secondary" size="compact-sm" radius="md" onClick={handleRefresh}>
                <RefreshCw
                  size={16}
                  strokeWidth={1.5}
                  className={isLoadingSessions ? 'animate-spin' : ''}
                />
              </Button>
            </Tooltip>
            {chatSessions?.length > 0 && (
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
                    disabled={csvLoading}
                    onClick={() => handleExport('csv')}
                  >
                    Export as CSV
                  </Menu.Item>
                  <Menu.Item
                    leftSection={<FileText size={14} />}
                    disabled={pdfLoading}
                    onClick={() => handleExport('pdf')}
                  >
                    Export as PDF
                  </Menu.Item>
                  <Menu.Item
                    leftSection={<FileJson size={14} />}
                    disabled={jsonLoading}
                    onClick={() => handleExport('json')}
                  >
                    Export as JSON
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            )}
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
                  chatSessions={chatSessions}
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
        <ChatDetails session={selectedSession} handleSessionDelete={handleSessionDelete} loading={isLoadingSessionDetails} />
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
