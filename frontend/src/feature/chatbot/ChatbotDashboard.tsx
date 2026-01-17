import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useChatbotStore } from '@/store'
import { usePageTitle } from '@/hooks/usePageTitle'

export const ChatbotDashboard: React.FC = () => {
  const { chatbotId } = useParams()
  const { getChatbot, currentChatbot } = useChatbotStore()

  usePageTitle(currentChatbot?.name || 'Dashboard')

  useEffect(() => {
    if (chatbotId) {
      getChatbot(chatbotId)
    }
  }, [chatbotId, getChatbot])

  return <div>hello {currentChatbot?.name}</div>
}
