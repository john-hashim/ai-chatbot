import { useEffect, useState } from 'react'
import { useMediaQuery } from '@mantine/hooks'
import { Button, Transition } from '@mantine/core'
import { Style } from '../components/Style'
import { Preview } from '../components/Preview'
import { Content } from '../components/Content'
import type { Chatbot } from '@/types/chatbot'
import { useStore } from '@/store'
import { FormProvider, useForm } from 'react-hook-form'
import { showLoadingNotification } from '@/utils/notifications'

export type ChatbotFormValues = Pick<
  Chatbot,
  | 'name'
  | 'brandColor'
  | 'initialMessages'
  | 'suggestedMessages'
  | 'showSuggestedAfterFirst'
  | 'messagePlaceholder'
  | 'dismissibleNotice'
  | 'footer'
  | 'autoshowDelaySeconds'
  | 'autoshowInitialPopup'
  | 'appearance'
  | 'brandColorForHeader'
  | 'chatBubbleButtonColor'
  | 'profilePicture'
  | 'chatIcon'
  | 'chatBubbleButtonPosition'
>

export const Customize: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'content' | 'style' | 'preview'>('content')
  const [isSaving, setIsSaving] = useState(false)
  const isLargeScreen = useMediaQuery('(min-width: 1024px)')
  const { currentChatbot, updateChatbot } = useStore()

  const methods = useForm<ChatbotFormValues>({
    mode: 'onChange',
    defaultValues: {
      name: currentChatbot?.name ?? '',
      brandColor: currentChatbot?.brandColor ?? '#2563eb',
      initialMessages: currentChatbot?.initialMessages?.length
        ? currentChatbot.initialMessages
        : ['Hi! What can I help you with?'],
      suggestedMessages: currentChatbot?.suggestedMessages ?? [],
      showSuggestedAfterFirst: currentChatbot?.showSuggestedAfterFirst ?? false,
      messagePlaceholder: currentChatbot?.messagePlaceholder ?? '',
      dismissibleNotice: currentChatbot?.dismissibleNotice ?? '',
      footer: currentChatbot?.footer ?? '',
      autoshowDelaySeconds: currentChatbot?.autoshowDelaySeconds ?? 0,
      autoshowInitialPopup: currentChatbot?.autoshowInitialPopup ?? false,
      appearance: currentChatbot?.appearance ?? 'light',
      brandColorForHeader: currentChatbot?.brandColorForHeader ?? true,
      chatBubbleButtonColor: currentChatbot?.chatBubbleButtonColor ?? '#000000',
      profilePicture: currentChatbot?.profilePicture ?? null,
      chatIcon: currentChatbot?.chatIcon ?? null,
      chatBubbleButtonPosition: currentChatbot?.chatBubbleButtonPosition ?? 'left',
    },
  })

  const {
    formState: { isDirty },
    reset,
    handleSubmit,
    watch,
  } = methods

  const nameValue = watch('name')
  const initialMessages = watch('initialMessages')

  useEffect(() => {
    if (currentChatbot) {
      reset({
        name: currentChatbot.name,
        brandColor: currentChatbot.brandColor,
        initialMessages: currentChatbot.initialMessages?.length
          ? currentChatbot.initialMessages
          : ['Hi! What can I help you with?'],
        suggestedMessages: currentChatbot?.suggestedMessages ?? [],
        showSuggestedAfterFirst: currentChatbot?.showSuggestedAfterFirst ?? false,
        messagePlaceholder: currentChatbot?.messagePlaceholder ?? '',
        dismissibleNotice: currentChatbot?.dismissibleNotice ?? '',
        footer: currentChatbot?.footer ?? '',
        autoshowDelaySeconds: currentChatbot?.autoshowDelaySeconds ?? 0,
        autoshowInitialPopup: currentChatbot?.autoshowInitialPopup ?? false,
        appearance: currentChatbot?.appearance ?? 'light',
        brandColorForHeader: currentChatbot?.brandColorForHeader ?? true,
        chatBubbleButtonColor: currentChatbot?.chatBubbleButtonColor ?? '#000000',
        profilePicture: currentChatbot?.profilePicture ?? null,
        chatIcon: currentChatbot?.chatIcon ?? null,
        chatBubbleButtonPosition: currentChatbot?.chatBubbleButtonPosition ?? 'left',
      })
    }
  }, [currentChatbot, reset])

  const onSave = async (data: ChatbotFormValues) => {
    const notification = showLoadingNotification('Saving', 'Saving chatbot...')
    try {
      setIsSaving(true)
      const filteredInitialMessages = data.initialMessages.filter(msg => msg.trim())
      const filteredSuggestedMessages = data.suggestedMessages.filter(msg => msg.trim())
      await updateChatbot({
        ...data,
        initialMessages: filteredInitialMessages,
        suggestedMessages: filteredSuggestedMessages,
      })
      notification.success('Chatbot saved successfully')
    } catch (error) {
      console.error('Failed to update chatbot:', error)
      notification.error('Failed to save chatbot. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const onCancel = () => {
    reset()
  }

  return (
    <FormProvider {...methods}>
      <div className="flex h-full">
        <div className="lg:w-[500px] border-r border-r-border-week w-full h-full flex flex-col relative">
          <p className="py-5 px-6 font-semibold text-2xl">Customize your chatbot</p>
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex border-b border-border-week">
              <button onClick={() => setActiveTab('content')} className="px-6 py-2 font-medium">
                <span
                  className={`pb-2 border-b-2 text-sm cursor-pointer ${
                    activeTab === 'content'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Content
                </span>
              </button>
              <button onClick={() => setActiveTab('style')} className="px-6 py-2 font-medium">
                <span
                  className={`pb-2 border-b-2 text-sm cursor-pointer ${
                    activeTab === 'style'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Style
                </span>
              </button>
              {!isLargeScreen && (
                <button onClick={() => setActiveTab('preview')} className="px-6 py-2 font-medium">
                  <span
                    className={`pb-2 border-b-2 text-sm cursor-pointer ${
                      activeTab === 'preview'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Preview
                  </span>
                </button>
              )}
            </div>
            <div className="flex-1 min-h-0 overflow-auto">
              {activeTab === 'content' && (
                <div className="h-full">
                  <Content />
                </div>
              )}
              {activeTab === 'style' && (
                <div className="h-full">
                  <Style />
                </div>
              )}
              {activeTab === 'preview' && (
                <div className="h-full bg-[radial-gradient(circle,#ebebeb_2px,#fafafa_0)] bg-size-[30px_30px]">
                  <Preview />
                </div>
              )}
            </div>
          </div>
          <Transition mounted={isDirty} transition="slide-up" duration={300} timingFunction="ease">
            {styles => (
              <div
                style={styles}
                className="absolute z-1 bottom-0 left-0 right-0 px-6 py-4 border-t border-t-border-week rounded-t-2xl bg-white shadow-[0_0_16px_rgb(0_0_0/0.1)]"
              >
                <p className="text-sm mb-3">You have unsaved changes. Do you wish to save them?</p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="xs"
                    onClick={onCancel}
                    disabled={isSaving}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="xs"
                    onClick={handleSubmit(onSave)}
                    loading={isSaving}
                    disabled={!nameValue?.trim() || !initialMessages?.[0]?.trim()}
                    className="flex-1"
                  >
                    Save
                  </Button>
                </div>
              </div>
            )}
          </Transition>
        </div>
        <div className="flex-1 h-full hidden lg:block bg-[radial-gradient(circle,#ebebeb_2px,#fafafa_0)] bg-size-[30px_30px]">
          <Preview />
        </div>
      </div>
    </FormProvider>
  )
}
