import type React from 'react'
import { useFormContext, Controller, useFieldArray, useWatch } from 'react-hook-form'
import type { ChatbotFormValues } from './Customize'
import { ActionIcon, Button, HoverCard, TextInput, Text, Switch, NumberInput } from '@mantine/core'
import { InfoIcon, X } from 'lucide-react'
import { TextEditor } from '@/components/common/TextEditor'

export const Content: React.FC = () => {
  const {
    control,
    formState: { errors },
  } = useFormContext<ChatbotFormValues>()

  const autoshowInitialPopup = useWatch({ control, name: 'autoshowInitialPopup' })

  const {
    fields: initialMessagesFields,
    append: appendInitialMessages,
    remove: removeInitialMessages,
  } = useFieldArray({
    control,
    name: 'initialMessages' as never,
  })

  const {
    fields: suggestedMessagesFields,
    append: appendSuggestedMessages,
    remove: removeSuggestedMessages,
  } = useFieldArray({
    control,
    name: 'suggestedMessages' as never,
  })

  return (
    <div className="p-6 pb-28">
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
              className="mt-2"
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
      <div className="py-6 border-b border-border-week">
        <p className="text-text-secondary font-medium text-sm">Initial Messages</p>
        <div className="flex flex-col gap-2 mt-2">
          {initialMessagesFields.map((field, index) => (
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
              {initialMessagesFields.length > 1 && (
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  onClick={() => removeInitialMessages(index)}
                >
                  <X size={16} />
                </ActionIcon>
              )}
            </div>
          ))}
        </div>
        <Button className="mt-4" variant="secondary" onClick={() => appendInitialMessages('')}>
          + Add Initial Message
        </Button>
      </div>
      <div className="py-6 border-b border-border-week">
        <p className="text-text-secondary font-medium text-sm inline-flex items-center gap-1">
          Suggested messages
          <span className="inline-flex items-center">
            <HoverCard width={280} shadow="md">
              <HoverCard.Target>
                <InfoIcon className="cursor-pointer w-4 h-4 ml-2" />
              </HoverCard.Target>
              <HoverCard.Dropdown>
                <Text size="sm">
                  Guide users with short suggested messages at the bottom of the chat. Keep each
                  under 40 characters and show no more than four suggestions for the best
                  experience.
                </Text>
              </HoverCard.Dropdown>
            </HoverCard>
          </span>
        </p>
        <div className="my-4 px-4 py-2 bg-background-dark-week flex justify-between items-center">
          <span className="text-text-secondary font-medium text-sm inline-flex items-center w-3/4">
            Keep showing the suggested messages after the user's first message
            <span className="inline-flex items-center">
              <HoverCard width={280} shadow="md">
                <HoverCard.Target>
                  <InfoIcon className="cursor-pointer w-4 h-4" />
                </HoverCard.Target>
                <HoverCard.Dropdown>
                  <p className="text-xs">
                    When enabled, suggested messages appear throughout the conversation and not only
                    at the start, helping users stay engaged with relevant options.
                  </p>
                </HoverCard.Dropdown>
              </HoverCard>
            </span>
          </span>
          <div>
            <Controller
              name="showSuggestedAfterFirst"
              control={control}
              render={({ field: { value, onChange } }) => (
                <Switch
                  checked={value}
                  onChange={event => onChange(event.currentTarget.checked)}
                  color="teal"
                />
              )}
            />
          </div>
        </div>
        <div className="flex flex-col gap-2 mt-2">
          {suggestedMessagesFields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-2">
              <Controller
                name={`suggestedMessages.${index}`}
                control={control}
                rules={{
                  maxLength: {
                    value: 40,
                    message: 'Suggested messages must be less than 40 characters',
                  },
                }}
                render={({ field }) => (
                  <TextInput
                    {...field}
                    className="flex-1"
                    type="text"
                    placeholder="Add suggested message"
                  />
                )}
              />
              <ActionIcon
                variant="subtle"
                color="gray"
                onClick={() => removeSuggestedMessages(index)}
              >
                <X size={16} />
              </ActionIcon>
            </div>
          ))}
        </div>
        <Button className="mt-4" variant="secondary" onClick={() => appendSuggestedMessages('')}>
          + Add suggested message
        </Button>
      </div>
      <div className="py-6">
        <p className="text-text-secondary font-medium text-sm">Message placeholder</p>
        <Controller
          name="messagePlaceholder"
          control={control}
          rules={{
            maxLength: {
              value: 40,
              message: 'Chatbot name must be less than 40 characters',
            },
          }}
          render={({ field }) => (
            <TextInput
              {...field}
              value={field.value ?? ''}
              className="mt-2"
              type="text"
              id="messagePlaceholder"
              placeholder="Message.."
              maxLength={40}
            />
          )}
        />
      </div>
      <div className="border-b border-border-week"></div>
      <div className="py-6 border-b border-border-week">
        <p className="text-text-secondary font-medium text-sm">Dismissible notice</p>
        <Controller
          name="dismissibleNotice"
          control={control}
          render={({ field }) => (
            <TextEditor
              value={field.value ?? ''}
              onChange={field.onChange}
              variant="simple"
              showCharCount
              placeholder=""
              maxLength={200}
              showEmoji={false}
              minHeight="50px"
              className="mt-2"
              showUndoRedo
              enterEnabled={false}
              infoText="You can use this to show a dismissible notice that automatically disappears after the user sends a message."
            />
          )}
        />
      </div>
      <div className="py-6 border-b border-border-week">
        <p className="text-text-secondary font-medium text-sm">Footer</p>
        <Controller
          name="footer"
          control={control}
          render={({ field }) => (
            <TextEditor
              value={field.value ?? ''}
              onChange={field.onChange}
              placeholder=""
              variant="simple"
              showCharCount
              maxLength={200}
              showEmoji={false}
              minHeight="50px"
              className="mt-2"
              showUndoRedo
              enterEnabled={false}
              infoText="You can use this to display a disclaimer or include a link to your privacy policy."
            />
          )}
        />
      </div>
      <div className="py-6">
        <div className="flex justify-between items-center">
          <p className="text-text-secondary w-3/4 font-medium text-sm">
            Auto show initial messages pop-ups after set duration ( in seconds )
          </p>
          <Controller
            name="autoshowInitialPopup"
            control={control}
            render={({ field: { value, onChange } }) => (
              <div className="flex items-center gap-2">
                <Switch
                  checked={value}
                  onChange={event => onChange(event.currentTarget.checked)}
                  color="teal"
                />
              </div>
            )}
          />
        </div>
        {autoshowInitialPopup && (
          <Controller
            name="autoshowDelaySeconds"
            control={control}
            render={({ field }) => (
              <NumberInput
                value={field.value ?? 0}
                onChange={value => field.onChange(value === '' ? 0 : value)}
                className="mt-4"
                min={0}
                placeholder="0"
              />
            )}
          />
        )}
      </div>
    </div>
  )
}
