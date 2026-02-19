export interface ChatbotConfig {
  id: string
  name: string
  appearance: string
  brandColor: string
  brandColorForHeader: boolean
  profilePicture: string | null
  initialMessages: string[]
  suggestedMessages: string[]
  showSuggestedAfterFirst: boolean
  messagePlaceholder: string | null
  dismissibleNotice: string | null
  footer: string | null
  chatIcon: string | null
  chatBubbleButtonColor: string | null
  chatBubbleButtonPosition: string | null
  autoshowDelaySeconds: number | null
  autoshowInitialPopup: boolean
}

export async function fetchConfig(
  apiBase: string,
  embedKey: string
): Promise<ChatbotConfig> {
  const res = await fetch(`${apiBase}/api/embed/${embedKey}/config`)
  if (!res.ok) throw new Error('Failed to fetch config')
  const json = await res.json()
  return json.data
}

export async function sendFeedback(
  apiBase: string,
  embedKey: string,
  sessionId: string,
  messageId: string,
  feedback: 'like' | 'dislike' | null
): Promise<void> {
  await fetch(
    `${apiBase}/api/embed/${embedKey}/${sessionId}/${messageId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedback }),
    }
  )
}
