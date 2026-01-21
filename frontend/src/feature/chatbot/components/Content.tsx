import type React from 'react'
import { useFormContext, Controller, useFieldArray } from 'react-hook-form'
import type { ChatbotFormValues } from '../pages/Customize'
import { ActionIcon, Button, TextInput } from '@mantine/core'
import { X } from 'lucide-react'

export const Content: React.FC = () => {
  const {
    control,
    formState: { errors },
  } = useFormContext<ChatbotFormValues>()

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'initialMessages' as never,
  })

  return (
    <div className="p-6">
      <div className="pb-6">
        <p className="text-text-secondary font-medium text-sm">Chatbot's name?</p>
        <Controller
          name="name"
          control={control}
          rules={{
            required: 'Please provide your chatbot name',
            maxLength: {
              value: 40,
              message: 'Chatbot name must be less than 40 characters',
            },
          }}
          render={({ field }) => (
            <TextInput
              {...field}
              className="mt-1"
              type="text"
              id="chatbotname"
              placeholder="Luna AI"
              maxLength={40}
              error={errors.name?.message}
            />
          )}
        />
      </div>
      <div className="border-b border-border-week"></div>
      <div className="py-6">
        <p className="text-text-secondary font-medium text-sm">Initial Messages</p>
        <div className="flex flex-col gap-2 mt-2">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-2">
              <Controller
                name={`initialMessages.${index}`}
                control={control}
                rules={
                  index === 0
                    ? { required: 'Please provide at least one initial message' }
                    : undefined
                }
                render={({ field }) => (
                  <TextInput
                    {...field}
                    className="flex-1"
                    type="text"
                    placeholder="Enter a message..."
                    error={index === 0 ? errors.initialMessages?.[0]?.message : undefined}
                  />
                )}
              />
              {fields.length > 1 && (
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  onClick={() => remove(index)}
                >
                  <X size={16} />
                </ActionIcon>
              )}
            </div>
          ))}
        </div>
        <Button
          className="mt-4"
          variant="secondary"
          onClick={() => append('')}
        >
          + Add Initial Message
        </Button>
      </div>
    </div>
  )
}
