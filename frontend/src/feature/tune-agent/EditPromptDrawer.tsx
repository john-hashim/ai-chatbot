import { useEffect, useRef, useState } from 'react'
import { Drawer, Button, Textarea } from '@mantine/core'

interface EditPromptDrawerProps {
  opened: boolean
  initialPrompt: string
  onClose: () => void
  onSave: (prompt: string) => void
}

export const EditPromptDrawer: React.FC<EditPromptDrawerProps> = ({
  opened,
  initialPrompt,
  onClose,
  onSave,
}) => {
  const [draft, setDraft] = useState(initialPrompt)
  // Snapshot the prompt at the moment the drawer opens. Without this, a parent
  // re-render that changes `initialPrompt` (e.g. another save propagating in)
  // would clobber the user's in-progress edits.
  const initialPromptRef = useRef(initialPrompt)
  initialPromptRef.current = initialPrompt
  const wasOpenedRef = useRef(false)

  useEffect(() => {
    if (opened && !wasOpenedRef.current) {
      setDraft(initialPromptRef.current)
    }
    wasOpenedRef.current = opened
  }, [opened])

  const trimmed = draft.trim()
  const isDirty = trimmed !== initialPromptRef.current.trim()

  const handleSave = () => {
    if (!trimmed || !isDirty) return
    onSave(draft)
    onClose()
  }

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size="lg"
      title="Edit Agent Prompt"
      padding="lg"
      overlayProps={{ opacity: 0.3, blur: 1 }}
      styles={{
        content: { display: 'flex', flexDirection: 'column' },
        body: {
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <Textarea
        value={draft}
        onChange={e => setDraft(e.currentTarget.value)}
        placeholder="Write your custom agent prompt…"
        autosize={false}
        styles={{
          root: { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' },
          wrapper: { flex: 1, minHeight: 0, display: 'flex' },
          input: { flex: 1, fontFamily: 'inherit', fontSize: 12, lineHeight: 1.6 },
        }}
      />
      <div className="flex shrink-0 justify-end gap-2 pt-3">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={!isDirty || !trimmed}>
          Save Prompt
        </Button>
      </div>
    </Drawer>
  )
}
