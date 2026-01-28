import { useContrastColor } from '@/hooks/useContrastColor'
import { useStore } from '@/store'
import { RefreshCw } from 'lucide-react'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: Date
  model: string | null
  temperature: number | null
  tokensUsed: number | null
  responseTime: number | null
  sources: string[] | null
  feedback: 'like' | 'dislike' | null
}

const dummyChats: ChatMessage[] = [
  {
    id: '1',
    role: 'assistant',
    content: 'Hello! 👋\nHow are you today?\nHow can I assist you?',
    createdAt: new Date('2024-01-28T10:00:00'),
    model: 'gpt-4',
    temperature: 0.7,
    tokensUsed: 24,
    responseTime: 850,
    sources: null,
    feedback: null,
  },
  {
    id: '2',
    role: 'user',
    content: 'Can you help me understand how your pricing works?',
    createdAt: new Date('2024-01-28T10:01:00'),
    model: null,
    temperature: null,
    tokensUsed: null,
    responseTime: null,
    sources: null,
    feedback: null,
  },
  {
    id: '3',
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
  const primaryColor = currentChatbot?.brandColor ?? '#000000'
  const headerContrast = useContrastColor(primaryColor)

  const headerTextColor = currentChatbot?.brandColorForHeader
    ? headerContrast.contrastHex
    : currentChatbot?.appearance === 'dark'
      ? '#ffffff'
      : '#18181b'

  return (
    <div className="h-full flex items-center p-6">
      <div className="h-full mx-auto max-h-180 border-border-week border w-full max-w-102 overflow-hidden rounded-[20px rounded-[20px]">
        <div
          className={`${currentChatbot?.appearance === 'dark' ? 'bg-zinc-900' : 'bg-white'} h-full`}
        >
          <header
            className="flex items-center justify-between px-5"
            style={{
              background: currentChatbot?.brandColorForHeader
                ? `linear-gradient(0deg, rgba(255, 255, 255, 0) 29.14%, rgba(255, 255, 255, 0.16) 100%), ${currentChatbot.brandColor}`
                : '',
            }}
          >
            <div className="flex my-4 h-10 items-center gap-3">
              {currentChatbot?.profilePicture && (
                <img
                  src={currentChatbot.profilePicture}
                  alt="Chatbot"
                  className="h-10 w-10 rounded-full object-cover"
                />
              )}
              <div className="flex flex-col justify-center">
                <h1
                  className="font-medium text-sm tracking-tight"
                  style={{ color: headerTextColor }}
                >
                  {currentChatbot?.name || 'Chatbot'}
                </h1>
              </div>
            </div>
            <div className="flex items-center">
              <button
                className="flex h-9 w-9 items-center justify-center rounded-md p-1.5 opacity-70 hover:opacity-85"
                title="Reset conversation"
                style={{ color: headerTextColor }}
              >
                <RefreshCw className="h-5 w-5 transition-transform duration-700 ease-in-out hover:rotate-180" />
              </button>
            </div>
          </header>
          <div
            className={`flex-1 overflow-y-auto px-5 pt-5 ${
              currentChatbot?.appearance === 'dark'
                ? 'shadow-[inset_0_4px_6px_-1px_rgba(0,0,0,0.3)]'
                : 'shadow-inner'
            }`}
            style={{
              scrollbarColor: currentChatbot?.appearance === 'dark' ? '#52525b #27272a' : undefined,
              scrollbarWidth: 'thin',
            }}
          >
            {dummyChats.length > 0 && (
              <div className="px-5">
                {dummyChats.map(chat => (
                  <div className="px-5">{chat.content}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
