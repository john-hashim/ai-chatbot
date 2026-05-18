import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { FormProvider, useForm } from 'react-hook-form'
import { Preview } from './Preview'
import type { ChatbotFormValues } from './Customize'

vi.mock('@/components/common/ChatbotWidget', () => ({
  ChatbotWidget: (props: {
    name: string
    initialMessages: string[]
    suggestedMessages: string[]
    appearance: string
    brandColor: string
  }) => (
    <div data-testid="chatbot-widget">
      <span data-testid="cw-name">{props.name}</span>
      <span data-testid="cw-appearance">{props.appearance}</span>
      <span data-testid="cw-brand">{props.brandColor}</span>
      <span data-testid="cw-initial">{props.initialMessages.join(',')}</span>
      <span data-testid="cw-suggested">{props.suggestedMessages.join(',')}</span>
    </div>
  ),
  ChatBubbleButton: ({ color, icon }: { color: string; icon: string | null }) => (
    <div data-testid="bubble" data-color={color} data-icon={icon ?? ''} />
  ),
}))

const defaults: ChatbotFormValues = {
  name: 'Bot',
  brandColor: '#2563eb',
  initialMessages: ['Hi!'],
  suggestedMessages: [],
  showSuggestedAfterFirst: false,
  messagePlaceholder: '',
  dismissibleNotice: '',
  footer: '',
  autoshowDelaySeconds: 0,
  autoshowInitialPopup: false,
  appearance: 'light',
  brandColorForHeader: true,
  chatBubbleButtonColor: '#000000',
  profilePicture: null,
  chatIcon: null,
  chatBubbleButtonPosition: 'left',
}

const Harness: React.FC<{ values?: Partial<ChatbotFormValues> }> = ({ values }) => {
  const methods = useForm<ChatbotFormValues>({ defaultValues: { ...defaults, ...values } })
  return (
    <FormProvider {...methods}>
      <Preview />
    </FormProvider>
  )
}

const renderPreview = (values?: Partial<ChatbotFormValues>) =>
  render(
    <MantineProvider>
      <Harness values={values} />
    </MantineProvider>
  )

describe('Preview', () => {
  it('forwards form values to ChatbotWidget', () => {
    renderPreview({ name: 'Luna', appearance: 'dark', brandColor: '#abcdef' })
    expect(screen.getByTestId('cw-name')).toHaveTextContent('Luna')
    expect(screen.getByTestId('cw-appearance')).toHaveTextContent('dark')
    expect(screen.getByTestId('cw-brand')).toHaveTextContent('#abcdef')
  })

  it('falls back to "Chatbot" when name is empty', () => {
    renderPreview({ name: '' })
    expect(screen.getByTestId('cw-name')).toHaveTextContent('Chatbot')
  })

  it('filters out blank initial / suggested messages', () => {
    renderPreview({
      initialMessages: ['hello', '   ', ''],
      suggestedMessages: ['', 'pick me', '  '],
    })
    expect(screen.getByTestId('cw-initial')).toHaveTextContent('hello')
    expect(screen.getByTestId('cw-suggested')).toHaveTextContent('pick me')
  })

  it('passes chat bubble color and icon to the bubble button', () => {
    renderPreview({ chatBubbleButtonColor: '#ff0000', chatIcon: 'icon-url' })
    const bubble = screen.getByTestId('bubble')
    expect(bubble.getAttribute('data-color')).toBe('#ff0000')
    expect(bubble.getAttribute('data-icon')).toBe('icon-url')
  })

  it('positions the bubble container on the left by default', () => {
    const { container } = renderPreview({ chatBubbleButtonPosition: 'left' })
    expect(container.querySelector('.justify-start')).toBeTruthy()
    expect(container.querySelector('.justify-end')).toBeFalsy()
  })

  it('positions the bubble container on the right when configured', () => {
    const { container } = renderPreview({ chatBubbleButtonPosition: 'right' })
    expect(container.querySelector('.justify-end')).toBeTruthy()
  })
})
