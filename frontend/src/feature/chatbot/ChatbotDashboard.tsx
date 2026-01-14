import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  MessageSquare,
  Palette,
  Bot,
  History,
  BarChart3,
  Settings,
  ChevronLeft,
} from 'lucide-react'
import { Logo } from '@/components/common/logo'

type TabType = 'chat' | 'customize' | 'ai-model' | 'history' | 'analytics' | 'settings'

interface SidebarTab {
  id: TabType
  label: string
  icon: React.ElementType
}

const sidebarTabs: SidebarTab[] = [
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'customize', label: 'Customize', icon: Palette },
  { id: 'ai-model', label: 'AI Model', icon: Bot },
  { id: 'history', label: 'History', icon: History },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export const ChatbotDashboard: React.FC = () => {
  const { chatbotId } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabType>('chat')

  const renderTabContent = () => {
    switch (activeTab) {
      case 'chat':
        return (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageSquare className="h-16 w-16 text-text-secondary mb-4" />
            <h2 className="text-2xl font-semibold text-text-primary mb-2">Chat Interface</h2>
            <p className="text-text-secondary max-w-md">
              Test and interact with your chatbot here. Send messages and see how your AI responds.
            </p>
          </div>
        )
      case 'customize':
        return (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Palette className="h-16 w-16 text-text-secondary mb-4" />
            <h2 className="text-2xl font-semibold text-text-primary mb-2">Customize Appearance</h2>
            <p className="text-text-secondary max-w-md">
              Customize your chatbot's appearance, colors, branding, and widget styling.
            </p>
          </div>
        )
      case 'ai-model':
        return (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Bot className="h-16 w-16 text-text-secondary mb-4" />
            <h2 className="text-2xl font-semibold text-text-primary mb-2">AI Model Settings</h2>
            <p className="text-text-secondary max-w-md">
              Configure AI model parameters, temperature, system prompts, and response behavior.
            </p>
          </div>
        )
      case 'history':
        return (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <History className="h-16 w-16 text-text-secondary mb-4" />
            <h2 className="text-2xl font-semibold text-text-primary mb-2">Chat History</h2>
            <p className="text-text-secondary max-w-md">
              View previous conversations and chat sessions with your chatbot.
            </p>
          </div>
        )
      case 'analytics':
        return (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <BarChart3 className="h-16 w-16 text-text-secondary mb-4" />
            <h2 className="text-2xl font-semibold text-text-primary mb-2">Analytics</h2>
            <p className="text-text-secondary max-w-md">
              Track usage metrics, popular questions, response quality, and user engagement.
            </p>
          </div>
        )
      case 'settings':
        return (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Settings className="h-16 w-16 text-text-secondary mb-4" />
            <h2 className="text-2xl font-semibold text-text-primary mb-2">Settings</h2>
            <p className="text-text-secondary max-w-md">
              Manage general settings, integrations, API keys, and deployment options.
            </p>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border-week bg-background-dark-week flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-border-week flex items-center justify-between">
          <Logo height={32} width={24} fontSize={20} logoIcon={false} />
          <button
            onClick={() => navigate('/landing')}
            className="p-1.5 hover:bg-icon-bg-hover rounded cursor-pointer border-0 bg-transparent"
            title="Back to Dashboard"
          >
            <ChevronLeft className="h-5 w-5 text-text-weak hover:text-icon-hover" />
          </button>
        </div>

        {/* Chatbot ID Display */}
        <div className="px-4 py-3 border-b border-border-week">
          <p className="text-xs text-text-secondary">Chatbot ID</p>
          <p className="text-sm text-text-primary truncate font-mono">{chatbotId}</p>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 p-2">
          <ul className="space-y-1">
            {sidebarTabs.map(tab => {
              const IconComponent = tab.icon
              const isActive = activeTab === tab.id
              return (
                <li key={tab.id}>
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors border-0 cursor-pointer ${
                      isActive
                        ? 'bg-primary text-white'
                        : 'bg-transparent text-text-secondary hover:bg-icon-bg-hover hover:text-text-primary'
                    }`}
                  >
                    <IconComponent className="h-5 w-5" />
                    <span className="text-sm font-medium">{tab.label}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border-week">
          <p className="text-xs text-text-secondary text-center">
            Powered by AI
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-14 border-b border-border-week flex items-center px-6">
          <h1 className="text-lg font-semibold text-text-primary capitalize">
            {sidebarTabs.find(t => t.id === activeTab)?.label}
          </h1>
        </header>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-auto">
          {renderTabContent()}
        </div>
      </main>
    </div>
  )
}
