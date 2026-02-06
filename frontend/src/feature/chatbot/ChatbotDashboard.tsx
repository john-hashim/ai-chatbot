import { useEffect } from 'react'
import { useParams, Outlet } from 'react-router-dom'
import { useChatbotStore } from '@/store'
import { usePageTitle } from '@/hooks/usePageTitle'
import { Flex } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { ChatbotSidebar } from './ChatbotSidebar'

export const ChatbotDashboard: React.FC = () => {
  const { chatbotId } = useParams()
  const { getChatbot, currentChatbot } = useChatbotStore()
  const isMobile = useMediaQuery('(max-width: 768px)')

  usePageTitle(currentChatbot?.name || 'Dashboard')

  useEffect(() => {
    if (chatbotId) {
      getChatbot(chatbotId)
    }
  }, [chatbotId, getChatbot])

  return (
    <Flex style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
      <ChatbotSidebar />
      <div className="flex-1 overflow-y-auto" style={{ marginLeft: isMobile ? 0 : 60 }}>
        <Outlet />
      </div>
    </Flex>
  )
}
