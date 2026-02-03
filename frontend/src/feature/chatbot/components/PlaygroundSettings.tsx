import { Select, Textarea } from '@mantine/core'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import type { PlaygroundFormValues } from '../pages/Playground'
import { INSTRUCTION_OPTIONS, getInstructionByType } from '@/constants/instructions'

const selectData = INSTRUCTION_OPTIONS.map(opt => ({
  value: opt.value,
  label: opt.label,
}))

export const PlaygroundSettings: React.FC = () => {
  const { control } = useFormContext<PlaygroundFormValues>()

  const instructionType = useWatch({ name: 'instructionType', control })
  const selectedOption = getInstructionByType(instructionType)

  return (
    <div className="flex flex-col gap-5 p-6">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-zinc-700">System Instruction</label>
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
          <p className="mt-1 text-xs text-zinc-500">{selectedOption.description}</p>
        )}
      </div>

      {instructionType === 'manual' ? (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">
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
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
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
