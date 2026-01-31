import { ChatbotWidget, type ChatMessage } from '@/components/common/ChatbotWidget'
import { useStore } from '@/store'
import { useState } from 'react'

const dummyChats: ChatMessage[] = [
  {
    id: '1',
    role: 'user',
    content: 'Can you help me understand how your pricing works?',
    createdAt: new Date('2024-01-28T10:01:00'),
  },
  {
    id: '2',
    role: 'assistant',
    content:
      'Of course! We offer three pricing tiers:\n\n• **Starter** - $9/month\n• **Pro** - $29/month\n• **Enterprise** - Custom pricing\n\nWould you like more details on any specific plan?',
    createdAt: new Date('2024-01-28T10:01:15'),
    model: 'gpt-4',
    temperature: 0.7,
    tokensUsed: 58,
    responseTime: 1200,
    sources: ['doc-pricing-001', 'doc-faq-003'],
    feedback: 'like',
  },
  {
    id: '3',
    role: 'user',
    content: 'Can you help me understand how your pricing works?',
    createdAt: new Date('2024-01-28T10:01:00'),
  },
  {
    id: '4',
    role: 'assistant',
    content:
      'Of course! We offer three pricing tiers:\n\n• **Starter** - $9/month\n• **Pro** - $29/month\n• **Enterprise** - Custom pricing\n\nWould you like more details on any specific plan?',
    createdAt: new Date('2024-01-28T10:01:15'),
    model: 'gpt-4',
    temperature: 0.7,
    tokensUsed: 58,
    responseTime: 1200,
    sources: ['doc-pricing-001', 'doc-faq-003'],
    feedback: 'like',
  },
]

export const PlaygroundPreview: React.FC = () => {
  const { currentChatbot } = useStore()
  const [messages, setMessages] = useState<ChatMessage[]>(dummyChats)
  const [generating, setGenerating] = useState<boolean>(false)

  const handleSendMessage = (message: string) => {
    const newMessage: ChatMessage = {
      id: Math.random().toString(),
      role: 'user',
      content: message,
      createdAt: new Date(),
      model: 'gpt-4',
      temperature: 0.7,
      tokensUsed: 58,
      responseTime: 1200,
      sources: ['doc-pricing-001', 'doc-faq-003'],
      feedback: 'like',
    }
    const dummyLoader: ChatMessage = {
      id: Math.random().toString(),
      role: 'assistant',
      content: '',
      createdAt: new Date(),
      model: 'gpt-4',
      temperature: 0.7,
      tokensUsed: 58,
      responseTime: 1200,
      sources: ['doc-pricing-001', 'doc-faq-003'],
      feedback: 'like',
    }
    setMessages([...messages, newMessage, dummyLoader])
    setGenerating(true)
  }

  const handleReset = () => {
    console.log('Reset conversation')
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
