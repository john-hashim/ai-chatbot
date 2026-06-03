import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useChatbotStore, useModelsStore } from '@/store'
import { type InstructionType } from '@/constants/instructions'
import { showNotification } from '@/utils/notifications'
import { TuneAgentForm } from '../tune-agent/TuneAgentForm'

interface AgentTuningProps {
  embedded?: boolean
}

export const AgentTuning: React.FC<AgentTuningProps> = ({ embedded = false }) => {
  const { chatbotId } = useParams()
  const { models, groupedModels, defaultModelId, isLoadingModels, fetchModels } = useModelsStore()
  const { currentChatbot, getChatbot, updateChatbot } = useChatbotStore()

  useEffect(() => {
    fetchModels()
  }, [fetchModels])

  useEffect(() => {
    if (chatbotId && currentChatbot?.id !== chatbotId) getChatbot(chatbotId)
  }, [chatbotId, currentChatbot?.id, getChatbot])

  const savedModel = currentChatbot?.selectedModel ?? defaultModelId ?? null
  const savedInstructionType = (currentChatbot?.instructionType as InstructionType) ?? 'manual'

  // Optimistic overrides so the selects update instantly while the save runs in
  // the background. null means "no pending change — show the saved value".
  const [modelOverride, setModelOverride] = useState<string | null>(null)
  const [instructionOverride, setInstructionOverride] = useState<InstructionType | null>(null)

  const model = modelOverride ?? savedModel
  const instructionType = instructionOverride ?? savedInstructionType

  const modelLabel = useMemo(
    () => models.find(m => m.id === model)?.label ?? 'your model',
    [models, model]
  )

  const runSave = async (
    payload: Parameters<typeof updateChatbot>[0],
    onError: string,
    onSuccess?: string
  ) => {
    try {
      await updateChatbot(payload)
      if (onSuccess) showNotification('success', onSuccess)
    } catch (err) {
      console.error('Failed to save chatbot:', err)
      showNotification('error', onError)
    }
  }

  const handleModelChange = async (id: string | null) => {
    setModelOverride(id)
    const label = models.find(m => m.id === id)?.label ?? 'model'
    await runSave(
      { selectedModel: id },
      'Could not update model. Please try again.',
      `Model changed to ${label}`
    )
    setModelOverride(null)
  }

  const handleInstructionTypeChange = async (type: InstructionType) => {
    setInstructionOverride(type)
    await runSave(
      { instructionType: type },
      'Could not update instruction type.',
      'Instructions updated successfully'
    )
    setInstructionOverride(null)
  }

  const handleCustomInstructionChange = (prompt: string | null) =>
    runSave(
      { customInstruction: prompt },
      'Could not save prompt. Please try again.',
      prompt ? 'Agent prompt saved' : undefined
    )

  const form = (
    <TuneAgentForm
      model={model}
      onModelChange={handleModelChange}
      instructionType={instructionType}
      onInstructionTypeChange={handleInstructionTypeChange}
      savedCustomInstruction={currentChatbot?.customInstruction ?? null}
      onCustomInstructionChange={handleCustomInstructionChange}
      models={models}
      groupedModels={groupedModels}
      isLoadingModels={isLoadingModels}
      modelLabel={modelLabel}
      hideContinue
      hideHeader={embedded}
      hideReset={embedded}
      compact={embedded}
    />
  )

  if (embedded) return <div className="h-full min-h-0 flex">{form}</div>

  return (
    <div className="h-full py-6 px-4 lg:px-64 min-h-0 flex">
      <div className="border flex-1 border-border-week rounded-2xl flex overflow-hidden min-h-0">
        {form}
      </div>
    </div>
  )
}
