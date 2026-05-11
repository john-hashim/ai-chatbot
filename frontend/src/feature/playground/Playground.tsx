import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import { useMediaQuery } from '@mantine/hooks'
import { Button, Transition } from '@mantine/core'
import { FormProvider, useForm } from 'react-hook-form'
import { PlaygroundSettings } from './PlaygroundSettings'
import { PlaygroundPreview } from './PlaygroundPreview'
import { useChatbotStore } from '@/store'
import { showLoadingNotification } from '@/utils/notifications'
import type { Chatbot } from '@/types/chatbot'

export type PlaygroundFormValues = Pick<
  Chatbot,
  'instructionType' | 'customInstruction' | 'selectedModel'
>

export const Playground: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'settings' | 'preview'>('settings')
  const [isSaving, setIsSaving] = useState(false)
  const isLargeScreen = useMediaQuery('(min-width: 1024px)')
  const { currentChatbot, updateChatbot } = useChatbotStore()

  const methods = useForm<PlaygroundFormValues>({
    mode: 'onChange',
    defaultValues: {
      instructionType: currentChatbot?.instructionType ?? 'base',
      customInstruction: currentChatbot?.customInstruction ?? '',
      selectedModel: currentChatbot?.selectedModel ?? null,
    },
  })

  const {
    formState: { isDirty },
    reset,
    handleSubmit,
  } = methods

  useEffect(() => {
    if (currentChatbot) {
      reset({
        instructionType: currentChatbot.instructionType ?? 'base',
        customInstruction: currentChatbot.customInstruction ?? '',
        selectedModel: currentChatbot.selectedModel ?? null,
      })
    }
  }, [currentChatbot, reset])

  const onSave = async (data: PlaygroundFormValues) => {
    const notification = showLoadingNotification('Saving', 'Saving playground settings...')
    try {
      setIsSaving(true)
      await updateChatbot({
        instructionType: data.instructionType,
        customInstruction: data.instructionType === 'manual' ? data.customInstruction : undefined,
        selectedModel: data.selectedModel,
      })
      notification.success('Settings saved successfully')
    } catch (error) {
      console.error('Failed to save playground settings:', error)
      notification.error('Failed to save settings. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const onCancel = () => {
    reset()
  }

  const saveRef = useRef(() => {})
  saveRef.current = () => {
    if (isDirty && !isSaving) {
      handleSubmit(onSave)()
    }
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        const target = event.target as HTMLElement
        if (target.tagName === 'TEXTAREA') return
        event.preventDefault()
        saveRef.current()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <FormProvider {...methods}>
      <div className="flex h-full">
        <div className="lg:w-[500px] border-r border-r-border-week w-full h-full flex flex-col relative  overflow-auto">
          <p className="pt-8 pb-2 px-6 font-semibold text-2xl">Playground</p>
          <div className="flex-1 flex flex-col min-h-0">
            {!isLargeScreen && (
              <div className="flex border-b border-border-week">
                <button onClick={() => setActiveTab('settings')} className="px-6 py-2 font-medium">
                  <span
                    className={`pb-2 border-b-2 text-sm cursor-pointer transition-colors duration-350 ${
                      activeTab === 'settings'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Settings
                  </span>
                </button>
                <button onClick={() => setActiveTab('preview')} className="px-6 py-2 font-medium">
                  <span
                    className={`pb-2 border-b-2 text-sm cursor-pointer transition-colors duration-350 ${
                      activeTab === 'preview'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Preview
                  </span>
                </button>
              </div>
            )}
            <div className="flex-1 min-h-0">
              {activeTab === 'settings' && (
                <div className="h-full">
                  <PlaygroundSettings />
                </div>
              )}
              {activeTab === 'preview' && (
                <div className="h-full bg-[radial-gradient(circle,#ebebeb_2px,#fafafa_0)] bg-size-[30px_30px]">
                  <PlaygroundPreview />
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
          <PlaygroundPreview />
        </div>
      </div>
    </FormProvider>
  )
}
