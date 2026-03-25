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

export interface BookingMessage {
  id: string
  sessionId: string
  role: 'user' | 'assistant'
  content: string
  sources: string[]
  createdAt: string
}

export interface Appointment {
  id: string
  chatbotId: string
  sessionId: string
  email: string
  date: string
  timeslot: string
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED'
  createdAt: string
  updatedAt: string
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

export async function confirmBooking(
  apiBase: string,
  embedKey: string,
  sessionId: string,
  date: string,
  timeslot: string,
  email: string
): Promise<{ appointment: Appointment; message: BookingMessage }> {
  const res = await fetch(`${apiBase}/api/embed/${embedKey}/booking/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, date, timeslot, email }),
  })
  if (!res.ok) {
    const json = await res.json()
    throw new Error(json.message || 'Failed to confirm booking')
  }
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
