export interface ChatMessage {
  id?: string
  role: 'user' | 'assistant'
  content: string
  feedback?: 'like' | 'dislike' | null
  isAction?: boolean
  actionType?: string | null
  actionMeta?: unknown
}

interface StreamCallbacks {
  onSessionId: (sessionId: string) => void
  onToken: (token: string) => void
  onDone: (message: ChatMessage) => void
  onError: (error: string) => void
}

export async function streamChat(
  apiBase: string,
  embedKey: string,
  message: string,
  sessionId: string | null,
  callbacks: StreamCallbacks
): Promise<void> {
  const res = await fetch(`${apiBase}/api/embed/${embedKey}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      sessionId,
      source: 'embed',
    }),
  })

  if (!res.ok || !res.body) {
    callbacks.onError('Failed to connect')
    return
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let completed = false

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      try {
        const data = JSON.parse(line.slice(6))
        switch (data.type) {
          case 'session':
            callbacks.onSessionId(data.sessionId)
            break
          case 'token':
            callbacks.onToken(data.token)
            break
          case 'done':
            completed = true
            callbacks.onDone({
              id: data.message.id,
              role: 'assistant',
              content: data.message.content,
              feedback: null,
              isAction: data.message.isAction ?? false,
              actionType: data.message.actionType ?? null,
              actionMeta: data.message.actionMeta ?? null,
            })
            break
          case 'error':
            completed = true
            callbacks.onError(data.message)
            break
        }
      } catch {
        // skip malformed SSE lines
      }
    }
  }

  // Stream ended without a done/error event (connection dropped)
  if (!completed) {
    callbacks.onError('Connection lost')
  }
}
