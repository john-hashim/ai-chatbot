import { Select, Textarea } from '@mantine/core'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import type { PlaygroundFormValues } from '../pages/Playground'
import { INSTRUCTION_OPTIONS, getInstructionByType } from '@/constants/instructions'
import { useStore } from '@/store'
import { formatRelativeDate } from '@/hooks/useRelativeDate'

const selectData = INSTRUCTION_OPTIONS.map(opt => ({
  value: opt.value,
  label: opt.label,
}))

export const PlaygroundSettings: React.FC = () => {
  const { control } = useFormContext<PlaygroundFormValues>()

  const instructionType = useWatch({ name: 'instructionType', control })
  const selectedOption = getInstructionByType(instructionType)

  const { currentChatbot } = useStore()

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
