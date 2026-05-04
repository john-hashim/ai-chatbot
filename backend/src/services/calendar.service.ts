import crypto from 'crypto'
import { OAuth2Client } from 'google-auth-library'
import { prisma } from '../prisma/client.js'

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
]

const STATE_SECRET =
  process.env.OAUTH_STATE_SECRET || crypto.randomBytes(32).toString('hex')
const STATE_TTL_MS = 10 * 60 * 1000

export function getOAuth2Client(): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = process.env.GOOGLE_CALENDAR_REDIRECT_URI
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      'Google OAuth not configured: set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALENDAR_REDIRECT_URI'
    )
  }
  return new OAuth2Client({ clientId, clientSecret, redirectUri })
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', STATE_SECRET).update(payload).digest('base64url')
}

export function buildState(chatbotId: string): string {
  const nonce = crypto.randomBytes(8).toString('hex')
  const exp = Date.now() + STATE_TTL_MS
  const payload = `${chatbotId}:${nonce}:${exp}`
  return `${Buffer.from(payload).toString('base64url')}.${sign(payload)}`
}

export function verifyState(state: string): { chatbotId: string } | null {
  const parts = state.split('.')
  if (parts.length !== 2) return null
  const [b64, sig] = parts as [string, string]
  let payload: string
  try {
    payload = Buffer.from(b64, 'base64url').toString()
  } catch {
    return null
  }
  const expected = sign(payload)
  const sigBuf = Buffer.from(sig)
  const expBuf = Buffer.from(expected)
  if (sigBuf.length !== expBuf.length) return null
  if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null

  const [chatbotId, , expStr] = payload.split(':')
  if (!chatbotId || !expStr) return null
  const exp = Number(expStr)
  if (!Number.isFinite(exp) || Date.now() > exp) return null
  return { chatbotId }
}

export function buildAuthorizeUrl(chatbotId: string): string {
  return getOAuth2Client().generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
    state: buildState(chatbotId),
    include_granted_scopes: true,
  })
}

export async function exchangeCode(code: string) {
  const { tokens } = await getOAuth2Client().getToken(code)
  return tokens
}

export async function fetchAccountEmail(accessToken: string): Promise<string> {
  const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error(`userinfo failed: ${res.status}`)
  const data = (await res.json()) as { email?: string }
  if (!data.email) throw new Error('userinfo missing email')
  return data.email
}

export type CalendarEventInput = {
  summary: string
  description?: string
  // Local wall-clock ISO without offset, e.g. "2026-05-10T01:30:00"
  startDateTime: string
  endDateTime: string
  timeZone: string
  attendees: { email: string; displayName?: string }[]
  location?: string | undefined
  // When true, requests Google to create a Google Meet conference for the event.
  withGoogleMeet?: boolean
}

// Drop the integration so the UI prompts to reconnect instead of failing forever.
const clearIntegration = (chatbotId: string) =>
  prisma.calendarIntegration.deleteMany({ where: { chatbotId } }).catch(() => undefined)

export async function createCalendarEvent(chatbotId: string, event: CalendarEventInput) {
  const integration = await prisma.calendarIntegration.findUnique({ where: { chatbotId } })
  if (!integration || integration.provider !== 'google') return null
  if (!integration.refreshToken) throw new Error('No refresh token stored for calendar integration')

  const client = getOAuth2Client()
  client.setCredentials({
    access_token: integration.accessToken,
    refresh_token: integration.refreshToken,
    expiry_date: integration.tokenExpiry.getTime(),
  })

  // Persist auto-refreshed tokens so we don't refresh on every call.
  client.on('tokens', tokens => {
    if (!tokens.access_token) return
    prisma.calendarIntegration
      .update({
        where: { chatbotId },
        data: {
          accessToken: tokens.access_token,
          tokenExpiry: new Date(tokens.expiry_date ?? Date.now() + 3600 * 1000),
          ...(tokens.refresh_token ? { refreshToken: tokens.refresh_token } : {}),
        },
      })
      .catch(err => console.error('Failed to persist refreshed calendar token:', err))
  })

  let token: string | null | undefined
  try {
    token = (await client.getAccessToken()).token
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (/invalid_grant|invalid_token|unauthorized_client/i.test(msg)) {
      await clearIntegration(chatbotId)
    }
    throw err
  }
  if (!token) throw new Error('Could not obtain Google access token')

  const calendarId = integration.calendarId || 'primary'
  // conferenceDataVersion=1 is required for Google to honor conferenceData.createRequest.
  const url =
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events` +
    `?sendUpdates=all${event.withGoogleMeet ? '&conferenceDataVersion=1' : ''}`

  const body: Record<string, unknown> = {
    summary: event.summary,
    start: { dateTime: event.startDateTime, timeZone: event.timeZone },
    end: { dateTime: event.endDateTime, timeZone: event.timeZone },
    attendees: event.attendees.map(a => ({ email: a.email, displayName: a.displayName })),
    reminders: { useDefault: true },
  }
  if (event.description) body.description = event.description
  if (event.location) body.location = event.location
  if (event.withGoogleMeet) {
    body.conferenceData = {
      createRequest: {
        requestId: crypto.randomUUID(),
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    }
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) await clearIntegration(chatbotId)
    throw new Error(`Calendar API ${res.status}: ${await res.text().catch(() => '')}`)
  }

  return (await res.json()) as {
    id: string
    htmlLink?: string
    hangoutLink?: string
    conferenceData?: { entryPoints?: { entryPointType?: string; uri?: string }[] }
  }
}

export async function deleteCalendarEvent(chatbotId: string, eventId: string): Promise<boolean> {
  const integration = await prisma.calendarIntegration.findUnique({ where: { chatbotId } })
  if (!integration || integration.provider !== 'google') return false
  if (!integration.refreshToken) throw new Error('No refresh token stored for calendar integration')

  const client = getOAuth2Client()
  client.setCredentials({
    access_token: integration.accessToken,
    refresh_token: integration.refreshToken,
    expiry_date: integration.tokenExpiry.getTime(),
  })

  client.on('tokens', tokens => {
    if (!tokens.access_token) return
    prisma.calendarIntegration
      .update({
        where: { chatbotId },
        data: {
          accessToken: tokens.access_token,
          tokenExpiry: new Date(tokens.expiry_date ?? Date.now() + 3600 * 1000),
          ...(tokens.refresh_token ? { refreshToken: tokens.refresh_token } : {}),
        },
      })
      .catch(err => console.error('Failed to persist refreshed calendar token:', err))
  })

  let token: string | null | undefined
  try {
    token = (await client.getAccessToken()).token
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (/invalid_grant|invalid_token|unauthorized_client/i.test(msg)) {
      await clearIntegration(chatbotId)
    }
    throw err
  }
  if (!token) throw new Error('Could not obtain Google access token')

  const calendarId = integration.calendarId || 'primary'
  // sendUpdates=all triggers Google's cancellation email to attendees.
  const url =
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}` +
    `/events/${encodeURIComponent(eventId)}?sendUpdates=all`

  const res = await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })

  // 410 Gone = already deleted on Google's side; treat as success so DB cleanup proceeds.
  if (res.status === 404 || res.status === 410) return true
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) await clearIntegration(chatbotId)
    throw new Error(`Calendar API ${res.status}: ${await res.text().catch(() => '')}`)
  }
  return true
}
