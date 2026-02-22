import { useEffect, useState } from 'react'
import { useParams, Outlet } from 'react-router-dom'
import { useChatbotStore } from '@/store'
import { usePageTitle } from '@/hooks/usePageTitle'
import { Flex } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { ChatbotSidebar } from './ChatbotSidebar'

export const ChatbotDashboard: React.FC = () => {
  const { chatbotId } = useParams()
  const { getChatbot, currentChatbot } = useChatbotStore()
  // Single media query listener — passed to sidebar instead of duplicating it there
  const isMobile = useMediaQuery('(max-width: 768px)') ?? false
  const [sidebarPinned, setSidebarPinned] = useState(false)

  usePageTitle(currentChatbot?.name || 'Dashboard')

  useEffect(() => {
    if (chatbotId) {
      getChatbot(chatbotId)
    }
  }, [chatbotId, getChatbot])

  return (
    <Flex style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
      <ChatbotSidebar pinned={sidebarPinned} isMobile={isMobile} onPinnedChange={setSidebarPinned} />
      <div
        className="flex-1 overflow-y-auto"
        style={{
          marginLeft: isMobile ? 0 : sidebarPinned ? 220 : 60,
          transition: 'margin-left 400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <Outlet />
      </div>
    </Flex>
  )
}
