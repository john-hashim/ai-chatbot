import type React from 'react'
import { useCallback, useEffect, useState } from 'react'
import { useMediaQuery } from '@mantine/hooks'
import { Button, Menu, Tooltip } from '@mantine/core'
import { Download, FileJson, FileSpreadsheet, FileText, SlidersHorizontal } from 'lucide-react'
import { ChatsList } from '../components/ChatsList'
import { ChatDetails } from '../components/ChatDetails'
import { useStore } from '@/store'
import { useApi } from '@/hooks/useApi'
import { chatbotService } from '@/api/services/chatbot'

export const Chats: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chatslist' | 'chatdetails'>('chatslist')
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const isLargeScreen = useMediaQuery('(min-width: 1024px)')
  const { currentChatbot, chatSessions, getChatSessions } = useStore()
  const { execute: exportJSON, loading: jsonLoading } = useApi(chatbotService.exportChatsAsJSON)
  const { execute: exportCSV, loading: csvLoading } = useApi(chatbotService.exportChatsAsCSV)
  const { execute: exportPDF, loading: pdfLoading } = useApi(chatbotService.exportChatsAsPDF)

  const downloadBlob = useCallback((blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const handleExport = useCallback(async (format: 'json' | 'csv' | 'pdf') => {
    if (!currentChatbot?.id) return
    const exportFn = { json: exportJSON, csv: exportCSV, pdf: exportPDF }[format]
    const ext = { json: 'json', csv: 'csv', pdf: 'pdf' }[format]
    const blob = await exportFn(currentChatbot.id)
    downloadBlob(blob as unknown as Blob, `chats-export.${ext}`)
  }, [currentChatbot?.id, exportJSON, exportCSV, exportPDF, downloadBlob])

  useEffect(() => {
    if (currentChatbot?.id) {
      getChatSessions(currentChatbot.id)
    }
  }, [currentChatbot?.id, getChatSessions])

  useEffect(() => {
    if (chatSessions.length > 0 && !selectedSessionId) {
      setSelectedSessionId(chatSessions[0].id)
    }
  }, [chatSessions, selectedSessionId])

  return (
    <div className="flex h-full">
      <div className="lg:w-[500px] border-r bg-background-dark-week border-r-border-week w-full h-full flex flex-col relative overflow-auto">
        <div className="py-5 px-6 flex items-center justify-between">
          <p className="font-semibold text-2xl">Chat Logs</p>
          <div className="flex gap-2">
            <Tooltip label="Filter">
              <Button variant="secondary" size="compact-sm" radius="md">
                <SlidersHorizontal size={16} strokeWidth={1.5} />
              </Button>
            </Tooltip>
            <Menu shadow="md" width={180}>
              <Menu.Target>
                <Tooltip label="Export">
                  <Button variant="default" size="compact-sm" radius="md">
                    <Download size={16} strokeWidth={1.5} />
                  </Button>
                </Tooltip>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item leftSection={<FileSpreadsheet size={14} />} disabled={csvLoading} onClick={() => handleExport('csv')}>
                  Export as CSV
                </Menu.Item>
                <Menu.Item leftSection={<FileText size={14} />} disabled={pdfLoading} onClick={() => handleExport('pdf')}>
                  Export as PDF
                </Menu.Item>
                <Menu.Item leftSection={<FileJson size={14} />} disabled={jsonLoading} onClick={() => handleExport('json')}>
                  Export as JSON
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </div>
        </div>
        <div className="flex-1 flex flex-col min-h-0">
          {!isLargeScreen && (
            <div className="flex border-b border-border-week">
              <button onClick={() => setActiveTab('chatslist')} className="px-6 py-2 font-medium">
                <span
                  className={`pb-2 border-b-2 text-sm cursor-pointer ${
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
                  className={`pb-2 border-b-2 text-sm cursor-pointer ${
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
                  selectedSessionId={selectedSessionId}
                  onSelectSession={setSelectedSessionId}
                />
              </div>
            )}
            {activeTab === 'chatdetails' && (
              <div className="h-full">
                <ChatDetails />
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex-1 h-full hidden lg:block">
        <ChatDetails />
      </div>
    </div>
  )
}
