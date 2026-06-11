import { useEffect, useMemo, useState } from 'react'
import { Logo } from '@/components/common/logo'
import { Tooltip } from '@mantine/core'
import { ArrowLeft, X } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useChatbotStore, useModelsStore } from '@/store'
import { type InstructionType } from '@/constants/instructions'
import { TuneAgentForm } from './TuneAgentForm'
import { TuneAgentTips } from './TuneAgentTips'

export const TuneAgent: React.FC = () => {
  usePageTitle('Tune Your Agent')
  const navigate = useNavigate()
  const { chatbotId } = useParams()

  const { models, groupedModels, defaultModelId, isLoadingModels, fetchModels } = useModelsStore()
  const { currentChatbot, getChatbot, updateChatbot } = useChatbotStore()
  const [model, setModel] = useState<string | null>(null)
  const [instructionType, setInstructionType] = useState<InstructionType | null>(null)

  useEffect(() => {
    fetchModels()
  }, [fetchModels])

  // Ensure the chatbot we're tuning is loaded (this route lives outside the
  // dashboard layout that normally sets currentChatbot).
  useEffect(() => {
    if (chatbotId && currentChatbot?.id !== chatbotId) getChatbot(chatbotId)
  }, [chatbotId, currentChatbot?.id, getChatbot])

  // Default to the chatbot's saved model, falling back to the API default.
  useEffect(() => {
    if (model) return
    const initial = currentChatbot?.selectedModel ?? defaultModelId
    if (initial) setModel(initial)
  }, [currentChatbot?.selectedModel, defaultModelId, model])

  // Seed the instruction type once the chatbot loads. Land on the recommended
  // Custom flow when the chatbot is still untouched (server default 'base'
  // with no generated custom instruction) — the selection is only persisted
  // when the user interacts or completes the question flow.
  useEffect(() => {
    if (instructionType || !currentChatbot) return
    const saved = currentChatbot.instructionType as InstructionType
    const untouched = saved === 'base' && !currentChatbot.customInstruction
    setInstructionType(untouched ? 'manual' : saved)
  }, [currentChatbot, instructionType])

  const modelLabel = useMemo(
    () => models.find(m => m.id === model)?.label ?? 'your model',
    [models, model]
  )

  // Persist the model selection to the chatbot immediately on change.
  const handleModelChange = async (id: string | null) => {
    const previous = model
    setModel(id)
    try {
      await updateChatbot({ selectedModel: id })
    } catch (error) {
      console.error('Failed to update model:', error)
      setModel(previous)
    }
  }

  // Persist the instruction type the same way the model is saved. Switching to a
  // preset (non-custom) clears any previously generated custom prompt.
  const handleInstructionTypeChange = async (type: InstructionType) => {
    const previous = instructionType
    setInstructionType(type)
    try {
      await updateChatbot({ instructionType: type })
    } catch (error) {
      console.error('Failed to update instruction type:', error)
      setInstructionType(previous)
    }
  }

  // Save the generated custom prompt to the chatbot (null clears it on reset).
  const handleCustomInstructionChange = async (prompt: string | null) => {
    try {
      await updateChatbot({ customInstruction: prompt })
    } catch (error) {
      console.error('Failed to save custom instruction:', error)
    }
  }

  return (
    <div className="flex flex-col h-screen min-h-0">
      <header className="px-5 py-2 flex items-center justify-between shrink-0">
        <Tooltip label="Go Back" position="bottom-start">
          <button
            className="p-1 hover:bg-icon-bg-hover rounded cursor-pointer border-0 bg-transparent"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5 text-text-weak hover:text-icon-hover" />
          </button>
        </Tooltip>
        <Logo height={40} width={28} fontSize={25} logoIcon={false} />
        <Tooltip label="Close" position="bottom-end">
          <button
            className="border-0 bg-transparent p-0 cursor-pointer"
            onClick={() => navigate('/landing')}
          >
            <X className="h-5 w-5 text-text-weak hover:text-icon-hover" />
          </button>
        </Tooltip>
      </header>
      <div className="lg:px-32 px-6 flex-1 pt-1 pb-15 flex min-h-0">
        <div className="border flex-1 border-border-week lg:mt-0 rounded-2xl flex overflow-hidden min-h-0">
          <div className="lg:w-3/5 w-full border-r border-border-week min-h-0 flex">
            <TuneAgentForm
              model={model}
              onModelChange={handleModelChange}
              instructionType={instructionType ?? 'manual'}
              onInstructionTypeChange={handleInstructionTypeChange}
              savedCustomInstruction={currentChatbot?.customInstruction ?? null}
              onCustomInstructionChange={handleCustomInstructionChange}
              models={models}
              groupedModels={groupedModels}
              isLoadingModels={isLoadingModels}
              modelLabel={modelLabel}
            />
          </div>
          <div className="w-2/5 hidden lg:flex min-h-0">
            <TuneAgentTips modelLabel={modelLabel} />
          </div>
        </div>
      </div>
    </div>
  )
}
