import { useEffect, useMemo } from 'react'
import { CheckIcon, Select, Textarea } from '@mantine/core'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import type { PlaygroundFormValues } from './Playground'
import { INSTRUCTION_OPTIONS, getInstructionByType } from '@/constants/instructions'
import { useChatbotStore, useModelsStore } from '@/store'
import { formatRelativeDate } from '@/hooks/useRelativeDate'
import claudeIcon from '@/assets/icons/claude.svg'
import deepseekIcon from '@/assets/icons/deepseek.svg'
import geminiIcon from '@/assets/icons/gemini.svg'
import metaIcon from '@/assets/icons/meta.svg'
import openaiIcon from '@/assets/icons/openai.svg'

const selectData = INSTRUCTION_OPTIONS.map(opt => ({
  value: opt.value,
  label: opt.label,
}))

const VENDOR_ICONS: Record<string, string> = {
  Anthropic: claudeIcon,
  DeepSeek: deepseekIcon,
  Google: geminiIcon,
  Meta: metaIcon,
  OpenAI: openaiIcon,
}

const ModelIcon: React.FC<{ src?: string; alt: string }> = ({ src, alt }) =>
  src ? <img src={src} alt={alt} className="h-4 w-4 object-contain" /> : null

export const PlaygroundSettings: React.FC = () => {
  const { control } = useFormContext<PlaygroundFormValues>()

  const instructionType = useWatch({ name: 'instructionType', control })
  const selectedOption = getInstructionByType(instructionType)

  const { currentChatbot } = useChatbotStore()
  const { models, groupedModels, defaultModelId, isLoadingModels, fetchModels } = useModelsStore()

  useEffect(() => {
    fetchModels()
  }, [fetchModels])

  const vendorByModelId = useMemo(() => {
    const map = new Map<string, string>()
    for (const m of models) map.set(m.id, m.vendor)
    return map
  }, [models])

  const iconForModelId = (id: string | null | undefined) => {
    if (!id) return undefined
    const vendor = vendorByModelId.get(id)
    return vendor ? VENDOR_ICONS[vendor] : undefined
  }

  return (
    <div className="flex flex-col gap-5 p-6">
      <div className="flex h-[68px] flex-col justify-between rounded-lg bg-background-dark-week px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-700"></span>
          <p className="font-medium text-sm text-green-700">Trained</p>
        </div>
        <p className="flex items-center gap-1 font-medium text-text-weak text-xs">
          Last trained <span>{formatRelativeDate(currentChatbot?.lastTrained)}</span> • 8 KB
        </p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-text-secondary">AI Model</label>
        <Controller
          name="selectedModel"
          control={control}
          render={({ field }) => {
            const selectedValue = field.value ?? defaultModelId
            const selectedIcon = iconForModelId(selectedValue)
            return (
              <Select
                data={groupedModels}
                value={selectedValue}
                onChange={val => field.onChange(val ?? null)}
                allowDeselect={false}
                checkIconPosition="right"
                placeholder={isLoadingModels ? 'Loading models...' : 'Select a model'}
                disabled={groupedModels.length === 0}
                leftSection={selectedIcon ? <ModelIcon src={selectedIcon} alt="" /> : undefined}
                renderOption={({ option, checked }) => {
                  const icon = iconForModelId(option.value)
                  return (
                    <div className="flex w-full items-center gap-2">
                      <ModelIcon src={icon} alt="" />
                      <span className="flex-1 truncate">{option.label}</span>
                      {checked && <CheckIcon size={12} />}
                    </div>
                  )
                }}
              />
            )
          }}
        />
        <p className="mt-1 text-xs text-text-weak">Premium models use more credits per message.</p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-text-secondary">
          System Instruction
        </label>
        <Controller
          name="instructionType"
          control={control}
          render={({ field }) => (
            <Select
              data={selectData}
              value={field.value}
              onChange={val => field.onChange(val ?? 'base')}
              allowDeselect={false}
              checkIconPosition="right"
            />
          )}
        />
        {selectedOption && (
          <p className="mt-1 text-xs text-text-weak">{selectedOption.description}</p>
        )}
      </div>

      {instructionType === 'manual' ? (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">
            Custom Instruction
          </label>
          <Controller
            name="customInstruction"
            control={control}
            render={({ field }) => (
              <Textarea
                value={field.value ?? ''}
                onChange={field.onChange}
                placeholder="Enter your custom system instruction..."
                minRows={8}
                maxRows={16}
                autosize
              />
            )}
          />
        </div>
      ) : (
        selectedOption && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">
              Instruction Preview
            </label>
            <div className="rounded-lg border border-border-week bg-background-dark-week p-3 overflow-auto max-h-40">
              <pre className="whitespace-pre-wrap text-xs leading-relaxed text-zinc-600">
                {selectedOption.instruction}
              </pre>
            </div>
          </div>
        )
      )}
    </div>
  )
}
