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
  await fetch(`${apiBase}/api/embed/${embedKey}/${sessionId}/${messageId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ feedback }),
  })
}

export interface ChatSessionMessage {
  id: string
  sessionId: string
  role: 'user' | 'assistant'
  content: string
  feedback?: 'like' | 'dislike' | null
  isAction?: boolean
  actionType?: string | null
  actionMeta?: unknown
  createdAt: string
}

export interface ChatSessionSummary {
  id: string
  chatbotId: string
  source: string
  createdAt: string
  updatedAt: string
  messages?: ChatSessionMessage[]
  _count?: { messages: number }
}

export async function fetchChatSessions(
  apiBase: string,
  embedKey: string,
  identifier: string
): Promise<ChatSessionSummary[]> {
  const res = await fetch(`${apiBase}/api/embed/${embedKey}/end-user-sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier }),
  })
  if (!res.ok) throw new Error('Failed to fetch sessions')
  const json = await res.json()
  return json.data ?? []
}

export async function fetchChatSession(
  apiBase: string,
  embedKey: string,
  sessionId: string
): Promise<{ id: string; messages: ChatSessionMessage[] }> {
  const res = await fetch(`${apiBase}/api/embed/${embedKey}/sessions/${sessionId}`)
  if (!res.ok) throw new Error('Failed to fetch session')
  const json = await res.json()
  return json.data?.chatSession
}

export interface BookingMessage {
  id: string
  sessionId: string
  role: 'user' | 'assistant'
  content: string
  sources: string[]
  createdAt: string
}

export async function getTimeSlotsForDate(
  apiBase: string,
  embedKey: string,
  sessionId: string,
  date: string
): Promise<{ date: string; timeslots: string[]; message: BookingMessage }> {
  const res = await fetch(`${apiBase}/api/embed/${embedKey}/booking/timeslots`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, date }),
  })
  if (!res.ok) throw new Error('Failed to fetch time slots')
  const json = await res.json()
  return json.data
}

export async function cancelBookingFlow(
  apiBase: string,
  embedKey: string,
  sessionId: string
): Promise<BookingMessage> {
  const res = await fetch(`${apiBase}/api/embed/${embedKey}/booking/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  })
  if (!res.ok) throw new Error('Failed to cancel booking')
  const json = await res.json()
  return json.data.message
}
