import { ChatbotSkeleton } from '@/components/common/ChatbotSkeleton'
import { Button, Menu, Text } from '@mantine/core'
import { useChatbotStore, useUserStore } from '@/store'
import { format, getHours } from 'date-fns'
import { Plus, TrendingUp, Ellipsis, Trash } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useApi } from '@/hooks/useApi'
import { usePageTitle } from '@/hooks/usePageTitle'
import { formatRelativeDate } from '@/hooks/useRelativeDate'
import type { ApiResponse } from '@/types/api'
import { chatbotService } from '@/api/services/chatbot'
import { modals } from '@mantine/modals'
import { showNotification } from '@/utils/notifications'
import { Outline } from '@/components/layout/Outline'

export const Landing: React.FC = () => {
  usePageTitle('Chatbots')
  const day = format(new Date(), 'eeee')
  const date = format(new Date(), 'MMMM dd')
  const {
    getChatbots,
    clearCurrentChatbot,
    setCurrentChatbot,
    resetDocumentFilters,
    currentChatbot,
    chatbots,
    deleteChatbot,
  } = useChatbotStore()
  const { user } = useUserStore()
  const navigate = useNavigate()

  const { execute: excuteDeleteChatbot } = useApi<ApiResponse<null>, [string]>(
    chatbotService.deleteChatbot
  )

  useEffect(() => {
    resetDocumentFilters()
    getChatbots()
    clearCurrentChatbot()
  }, [clearCurrentChatbot, getChatbots, resetDocumentFilters])

  const firstName = user?.name.split(' ')[0]
  const formattedFirstName = firstName
    ? firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase()
    : ''

  const currentHour = getHours(new Date())
  let greeting = 'Good evening'
  if (currentHour >= 5 && currentHour < 12) {
    greeting = 'Good morning'
  } else if (currentHour >= 12 && currentHour < 18) {
    greeting = 'Good afternoon'
  }

  const handleDeleteChatbot = async (id: string, name: string) => {
    modals.openConfirmModal({
      title: 'Delete Chatbot',
      centered: true,
      children: (
        <Text size="sm">
          Are you sure you want to delete "{name}"? This action will permanently delete the chatbot
          and all its documents. This cannot be undone.
        </Text>
      ),
      labels: { confirm: 'Delete Chatbot', cancel: 'Cancel' },
      confirmProps: { color: 'red', variant: 'filled' },
      onConfirm: async () => {
        try {
          deleteChatbot(id)
          const response = await excuteDeleteChatbot(id)
          if (response?.status === 'success') {
            if (currentChatbot?.id === id) {
              clearCurrentChatbot()
            }
            getChatbots()
          } else {
            showNotification('error', 'Failed to delete chatbot')
            getChatbots()
          }
        } catch (error) {
          showNotification('error', `Failed to delete chatbot: ${error}`)
          getChatbots()
        }
      },
    })
  }

  return (
    <main className="px-5 py-6 lg:px-10">
      {chatbots && chatbots.length > 0 ? (
        <div>
          <div className="mt-5 flex items-center justify-between">
            <p className="text-3xl font-semibold">Chatbots</p>
            <Button
              className="cursor-pointer"
              onClick={() => navigate('/chatbot/new')}
              leftSection={<Plus size={18} />}
              variant="default"
            >
              New AI Chatbot
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 mt-6">
            {chatbots.map(chatbot => (
              <div
                onClick={() => {
                  setCurrentChatbot(chatbot.id)
                  navigate(`/chatbot/${chatbot.id}/playground`)
                }}
                key={chatbot.id}
                className="border border-border-week hover:cursor-pointer div-fade-animation hover:border-border-strong rounded-lg overflow-hidden relative max-w-sm"
              >
                <div
                  className="h-40 overflow-hidden"
                  style={{
                    backgroundImage: `
                      radial-gradient(ellipse 80% 60% at 90% 20%, ${chatbot.brandColor}40, transparent 70%),
                      radial-gradient(ellipse 60% 50% at 70% 80%, ${chatbot.brandColor}30, transparent 60%),
                      radial-gradient(ellipse 50% 40% at 30% 30%, ${chatbot.brandColor}25, transparent 50%)
                    `,
                    paddingTop: '15px',
                  }}
                >
                  <Outline
                    name={chatbot.name}
                    profilePicture={chatbot.profilePicture}
                    brandColor={chatbot.brandColor}
                    appearance={chatbot.appearance}
                    brandColorForHeader={chatbot.brandColorForHeader}
                    isPreview={true}
                  />
                </div>

                <div className="p-4 flex items-center justify-between border-t border-border-week">
                  <div>
                    <h3 className="text-sm font-semibold">{chatbot.name}</h3>
                    <p className="text-text-weak text-sm mt-1">
                      {chatbot.lastTrained === null
                        ? 'Not Trained Yet'
                        : `Last trained ${formatRelativeDate(chatbot.lastTrained)}`}
                    </p>
                  </div>

                  <Menu shadow="md" width={200}>
                    <Menu.Target>
                      <button
                        onClick={e => e.stopPropagation()}
                        className="hover:bg-gray-100 rounded p-1 transition-colors"
                      >
                        <Ellipsis className="h-4 w-4 text-gray-700 cursor-pointer" />
                      </button>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item
                        color="red"
                        onClick={e => {
                          e.stopPropagation()
                          handleDeleteChatbot(chatbot.id, chatbot.name)
                        }}
                        leftSection={<Trash size={14} />}
                      >
                        Delete
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <time className="text-sm font-medium block">
            <span>{day}</span>, <span>{date}</span>
          </time>
          <h1 className="text-3xl mt-2">
            {greeting}, {formattedFirstName}
          </h1>
          <div className="h-[50vh] mt-6 flex flex-wrap">
            <article className="border border-purple-strong bg-purple-week cursor-pointer hover:bg-purple-strong sm:w-full lg:w-1/4 lg:mr-6 h-full rounded-2xl flex items-center justify-center flex-col p-6 overflow-visible">
              <div className="w-32 aspect-375/667 mb-4 shadow-[0_0_18px_0_var(--color-purple-glow)] rounded-2xl overflow-hidden bg-[#F8F9FA]">
                <ChatbotSkeleton />
              </div>
              <h3 className="text-lg font-semibold text-center mb-2">
                Build your first AI chatbot
              </h3>
              <p className="text-sm text-center text-gray-600">
                Connect your data, choose your tone, and go live in minutes
              </p>
            </article>

            <section className="border h-full flex-1 border-border-week mt-4 lg:mt-0 rounded-2xl flex items-center justify-center flex-col">
              <TrendingUp size={50} className="mb-1" />
              <p className="text-s">Let's get started! Create your first AI chatbot</p>
              <Button
                className="cursor-pointer mt-2"
                onClick={() => navigate('/chatbot/new')}
                leftSection={<Plus size={18} />}
              >
                New AI Chatbot
              </Button>
            </section>
          </div>
        </div>
      )}
    </main>
  )
}
