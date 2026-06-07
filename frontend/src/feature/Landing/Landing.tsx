import { ChatbotSkeleton } from '@/components/common/ChatbotSkeleton'
import { Button, Menu, Text } from '@mantine/core'
import { useBookingStore, useChatbotStore, useModelsStore, useUserStore } from '@/store'
import { format, getHours } from 'date-fns'
import { Plus, TrendingUp, Ellipsis, Trash, AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { usePageTitle } from '@/hooks/usePageTitle'
import { formatRelativeDate } from '@/hooks/useRelativeDate'
import { modals } from '@mantine/modals'
import { showNotification } from '@/utils/notifications'
import { Outline } from '@/components/layout/Outline'
import { isAxiosError } from 'axios'

export const Landing: React.FC = () => {
  usePageTitle('Chatbots')
  const day = format(new Date(), 'eeee')
  const date = format(new Date(), 'MMMM dd')
  const {
    getChatbots,
    setCurrentChatbot,
    chatbots,
    deleteChatbot,
    clearChatbotState,
    isLoadingChatbot,
  } = useChatbotStore()
  const { clearAvailabilities, clearAppointments } = useBookingStore()
  const { clearModels } = useModelsStore()
  const { user } = useUserStore()
  const navigate = useNavigate()

  useEffect(() => {
    clearChatbotState()
    clearAvailabilities()
    clearAppointments()
    clearModels()
    getChatbots().catch(error => {
      // 401 / 5xx are handled by the axios interceptor.
      // Anything else here is unexpected (e.g. malformed payload).
      if (isAxiosError(error) && error.response && error.response.status < 500) {
        showNotification('error', 'Could not load chatbots. Please refresh.')
      }
    })
  }, [clearChatbotState, clearAvailabilities, clearAppointments, clearModels, getChatbots])

  const firstName = user?.name?.split(' ')[0]
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

  const handleDeleteChatbot = (id: string, name: string) => {
    const modalId = `delete-chatbot-${id}`
    modals.openConfirmModal({
      modalId,
      title: (
        <span
          className="flex items-center gap-2 text-xl font-semibold"
          style={{ color: 'var(--color-notification-red)' }}
        >
          <AlertTriangle size={22} strokeWidth={2.5} aria-hidden />
          Delete chatbot {name} ?
        </span>
      ),
      centered: true,
      closeOnConfirm: false,
      withCloseButton: false,
      padding: 'xl',
      styles: {
        header: { paddingBottom: 16 },
        body: { paddingTop: 0 },
      },
      children: (
        <Text size="sm" mb="xl" style={{ color: 'var(--color-text-weak)' }}>
          Are you sure you want to delete "{name}"? This action will permanently delete the chatbot
          and all its documents. This cannot be undone.
        </Text>
      ),
      labels: { confirm: 'Delete Chatbot', cancel: 'Cancel' },
      confirmProps: { color: 'var(--color-notification-red)', variant: 'filled' },
      cancelProps: { variant: 'secondary' },
      groupProps: { gap: 'sm' },
      onConfirm: async () => {
        modals.updateModal({
          modalId,
          confirmProps: {
            color: 'var(--color-notification-red)',
            variant: 'filled',
            loading: true,
          },
          cancelProps: { variant: 'secondary', disabled: true },
          closeOnClickOutside: false,
          closeOnEscape: false,
          withCloseButton: false,
        })
        try {
          await deleteChatbot(id)
          showNotification('success', `Chatbot deleted successfully.`)
        } catch (error) {
          if (isAxiosError(error) && error.response?.status === 404) {
            showNotification('error', 'This chatbot no longer exists.')
          } else if (isAxiosError(error) && error.response && error.response.status < 500) {
            showNotification('error', 'Could not delete chatbot. Please try again.')
          }
          // 5xx / network already surfaced by the interceptor — stay silent here.
        } finally {
          modals.close(modalId)
        }
      },
    })
  }

  return (
    <main className="px-5 py-6 lg:px-10">
      {isLoadingChatbot ? (
        <div>
          <div className="mt-5 flex items-center justify-between">
            <p className="text-3xl font-semibold">Chatbots</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 mt-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="border border-border-week rounded-lg overflow-hidden max-w-sm animate-pulse"
              >
                <div className="h-40 bg-gray-100" />
                <div className="p-4 border-t border-border-week">
                  <div className="h-3.5 bg-gray-200 rounded w-1/2 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : chatbots && chatbots.length > 0 ? (
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
            <article className="border border-purple-strong bg-purple-week cursor-pointer hover:bg-purple-strong lg:w-1/4 lg:mr-6 h-full rounded-2xl hidden lg:flex items-center justify-center flex-col p-6 overflow-visible">
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
                New AI Agent
              </Button>
            </section>
          </div>
        </div>
      )}
    </main>
  )
}
