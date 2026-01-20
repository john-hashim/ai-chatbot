import { useEffect } from 'react'
import { useParams, Outlet } from 'react-router-dom'
import { useChatbotStore } from '@/store'
import { usePageTitle } from '@/hooks/usePageTitle'
import { Box, Flex } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { ChatbotSidebar } from './components/ChatbotSidebar'

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
    <Flex h="calc(100vh - 60px)" style={{ position: 'relative' }}>
      <ChatbotSidebar />
      <Box style={{ flex: 1, padding: 24, overflowY: 'auto', marginLeft: isMobile ? 0 : 60 }}>
        <Outlet />
      </Box>
    </Flex>
  )
}
