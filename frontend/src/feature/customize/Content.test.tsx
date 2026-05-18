import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MantineProvider } from '@mantine/core'
import { FormProvider, useForm } from 'react-hook-form'
import { Content } from './Content'
import type { ChatbotFormValues } from './Customize'

vi.mock('@/components/common/TextEditor', () => ({
  TextEditor: ({
    value,
    onChange,
    placeholder,
  }: {
    value: string
    onChange: (v: string) => void
    placeholder?: string
  }) => (
    <textarea
      data-testid={`text-editor-${placeholder ?? 'editor'}`}
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
    />
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
  const methods = useForm<ChatbotFormValues>({
    mode: 'onChange',
    defaultValues: { ...defaults, ...values },
  })
  return (
    <FormProvider {...methods}>
      <Content />
    </FormProvider>
  )
}

const renderContent = (values?: Partial<ChatbotFormValues>) =>
  render(
    <MantineProvider>
      <Harness values={values} />
    </MantineProvider>
  )

describe('Content', () => {
  it('renders the chatbot name input with the current value', () => {
    renderContent({ name: 'Luna' })
    expect((screen.getByPlaceholderText('Luna AI') as HTMLInputElement).value).toBe('Luna')
  })

  it('renders the seeded initial message and no remove button when only one', () => {
    renderContent({ initialMessages: ['Hi!'] })
    const inputs = screen.getAllByPlaceholderText('Enter a message...')
    expect(inputs).toHaveLength(1)
    expect((inputs[0] as HTMLInputElement).value).toBe('Hi!')
  })

  it('adds an initial message when the add button is clicked', async () => {
    renderContent()
    await userEvent.click(screen.getByRole('button', { name: /Add Initial Message/i }))
    expect(screen.getAllByPlaceholderText('Enter a message...')).toHaveLength(2)
  })

  it('removes an extra initial message when the X is clicked', async () => {
    renderContent({ initialMessages: ['Hi!', 'Second'] })
    expect(screen.getAllByPlaceholderText('Enter a message...')).toHaveLength(2)
    // Two remove buttons rendered (one per row when length > 1)
    const removeButtons = screen
      .getAllByRole('button')
      .filter(b => b.querySelector('svg.lucide-x'))
    await userEvent.click(removeButtons[1])
    expect(screen.getAllByPlaceholderText('Enter a message...')).toHaveLength(1)
  })

  it('adds and removes suggested messages', async () => {
    renderContent()
    await userEvent.click(screen.getByRole('button', { name: /Add suggested message/i }))
    const suggested = screen.getAllByPlaceholderText('Add suggested message')
    expect(suggested).toHaveLength(1)

    const removeButtons = screen
      .getAllByRole('button')
      .filter(b => b.querySelector('svg.lucide-x'))
    await userEvent.click(removeButtons[removeButtons.length - 1])
    expect(screen.queryByPlaceholderText('Add suggested message')).not.toBeInTheDocument()
  })

  it('hides the autoshow-delay input when the switch is off', () => {
    renderContent({ autoshowInitialPopup: false })
    expect(screen.queryByPlaceholderText('0')).not.toBeInTheDocument()
  })

  it('shows the autoshow-delay input when the switch is on', () => {
    renderContent({ autoshowInitialPopup: true, autoshowDelaySeconds: 5 })
    expect(screen.getByPlaceholderText('0')).toBeInTheDocument()
  })

  it('renders dismissibleNotice and footer text editors', () => {
    renderContent({ dismissibleNotice: 'notice', footer: 'foot' })
    const editors = screen.getAllByTestId('text-editor-')
    expect(editors).toHaveLength(2)
    expect((editors[0] as HTMLTextAreaElement).value).toBe('notice')
    expect((editors[1] as HTMLTextAreaElement).value).toBe('foot')
  })
})
