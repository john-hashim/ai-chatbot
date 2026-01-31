import { chatbotService } from '@/api/services/chatbot'
import { ChatbotWidget } from '@/components/common/ChatbotWidget'
import { useApi } from '@/hooks/useApi'
import { useStore } from '@/store'
import type { ApiResponse } from '@/types/api'
import type { ChatMessage } from '@/types/chatbot'
import { useState } from 'react'

export const PlaygroundPreview: React.FC = () => {
  const { currentChatbot } = useStore()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  const { execute: executePostMessage } = useApi<
    ApiResponse<{ sessionId: string; message: ChatMessage }>,
    [string, string, string?]
  >(chatbotService.postMessage)

  const handleSendMessage = async (message: string) => {
    if (!currentChatbot) return
    setGenerating(true)
    const userMessage: ChatMessage = {
      id: Math.random().toString(),
      sessionId: sessionId || '',
      role: 'user',
      content: message,
      createdAt: new Date().toISOString(),
      model: null,
      temperature: null,
      tokensUsed: null,
      responseTime: null,
      sources: [],
      feedback: null,
    }
    const loaderMessage: ChatMessage = {
      id: Math.random().toString(),
      sessionId: sessionId || '',
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
      model: null,
      temperature: null,
      tokensUsed: null,
      responseTime: null,
      sources: [],
      feedback: null,
    }

    setMessages(prev => [...prev, userMessage, loaderMessage])

    try {
      const result = await executePostMessage(currentChatbot.id, message, sessionId || undefined)

      if (result.data) {
        if (!sessionId) {
          setSessionId(result.data.sessionId)
        }
        setMessages(prev => [...prev.slice(0, -2), result.data!.message, loaderMessage])
      }
    } catch {
      setMessages(prev => prev.slice(0, -1))
    }
  }

  const handleReset = () => {
    setMessages([])
    setSessionId(null)
  }

  return (
    <div className="flex h-full items-center p-6">
      <div className="mx-auto h-full max-h-180 w-full max-w-102 overflow-hidden rounded-[20px] border border-border-week">
        <ChatbotWidget
          name={currentChatbot?.name || 'Chatbot'}
          profilePicture={currentChatbot?.profilePicture}
          appearance={currentChatbot?.appearance ?? 'light'}
          brandColor={currentChatbot?.brandColor ?? '#000000'}
          brandColorForHeader={currentChatbot?.brandColorForHeader ?? false}
          initialMessages={currentChatbot?.initialMessages}
          suggestedMessages={currentChatbot?.suggestedMessages}
          showSuggestedAfterFirst={currentChatbot?.showSuggestedAfterFirst}
          messagePlaceholder={currentChatbot?.messagePlaceholder ?? undefined}
          dismissibleNotice={currentChatbot?.dismissibleNotice}
          footer={currentChatbot?.footer}
          messages={messages}
          onSendMessage={handleSendMessage}
          onReset={handleReset}
          generating={generating}
        />
      </div>
    </div>
  )
}
