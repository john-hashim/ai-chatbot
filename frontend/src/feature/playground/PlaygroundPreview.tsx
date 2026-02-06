import { streamChat } from '@/api/services/chat'
import { ChatbotWidget } from '@/components/common/ChatbotWidget'
import { useStore } from '@/store'
import type { ChatMessage } from '@/types/chatbot'
import { useRef, useState } from 'react'

export const PlaygroundPreview: React.FC = () => {
  const { currentChatbot } = useStore()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const assistantIdRef = useRef<string>('')

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
      confidenceScore: null,
      feedback: null,
    }

    const assistantId = Math.random().toString()
    assistantIdRef.current = assistantId
    const assistantMessage: ChatMessage = {
      id: assistantId,
      sessionId: sessionId || '',
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
      model: null,
      temperature: null,
      tokensUsed: null,
      responseTime: null,
      sources: [],
      confidenceScore: null,
      feedback: null,
    }

    setMessages(prev => [...prev, userMessage, assistantMessage])

    try {
      await streamChat(currentChatbot.id, message, sessionId || undefined, {
        onSessionId: (sid: string) => {
          setSessionId(sid)
        },
        onToken: (token: string) => {
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantIdRef.current
                ? { ...msg, content: msg.content + token }
                : msg
            )
          )
        },
        onDone: (finalMessage: ChatMessage) => {
          setMessages(prev =>
            prev.map(msg => (msg.id === assistantIdRef.current ? finalMessage : msg))
          )
          setGenerating(false)
        },
        onError: (error: string) => {
          console.error('Stream error:', error)
          setMessages(prev => prev.filter(msg => msg.id !== assistantIdRef.current))
          setGenerating(false)
        },
      }, 'playground')
    } catch {
      setMessages(prev => prev.filter(msg => msg.id !== assistantIdRef.current))
      setGenerating(false)
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
