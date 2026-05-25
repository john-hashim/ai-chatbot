import { useEffect, useMemo, useState } from 'react'
import { Logo } from '@/components/common/logo'
import { Tooltip } from '@mantine/core'
import { ArrowLeft, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useModelsStore } from '@/store'
import { TuneAgentForm } from './TuneAgentForm'
import { TuneAgentTips } from './TuneAgentTips'

export const TuneAgent: React.FC = () => {
  usePageTitle('Tune Your Agent')
  const navigate = useNavigate()

  const { models, groupedModels, defaultModelId, isLoadingModels, fetchModels } = useModelsStore()
  const [model, setModel] = useState<string | null>(null)

  useEffect(() => {
    fetchModels()
  }, [fetchModels])

  // Default to the API-provided default once models load (unless already chosen).
  useEffect(() => {
    if (!model && defaultModelId) setModel(defaultModelId)
  }, [defaultModelId, model])

  const modelLabel = useMemo(
    () => models.find(m => m.id === model)?.label ?? 'your model',
    [models, model],
  )

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
              onModelChange={setModel}
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
