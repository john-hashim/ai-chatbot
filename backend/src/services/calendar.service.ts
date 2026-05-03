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
}

export async function createCalendarEvent(chatbotId: string, event: CalendarEventInput) {
  const integration = await prisma.calendarIntegration.findUnique({ where: { chatbotId } })
  if (!integration) return null
  if (integration.provider !== 'google') return null
  if (!integration.refreshToken) {
    throw new Error('No refresh token stored for calendar integration')
  }

  const client = getOAuth2Client()
  client.setCredentials({
    access_token: integration.accessToken,
    refresh_token: integration.refreshToken,
    expiry_date: integration.tokenExpiry.getTime(),
  })

  // The OAuth client emits 'tokens' when it auto-refreshes; persist the new
  // access token so subsequent requests don't keep re-refreshing.
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
    const accessTokenRes = await client.getAccessToken()
    token = accessTokenRes.token
  } catch (err) {
    // Refresh token was revoked or no longer valid — clear the integration so
    // the next page load shows "Connect" instead of repeatedly failing.
    const msg = err instanceof Error ? err.message : ''
    if (/invalid_grant|invalid_token|unauthorized_client/i.test(msg)) {
      await prisma.calendarIntegration
        .deleteMany({ where: { chatbotId } })
        .catch(() => undefined)
    }
    throw err
  }
  if (!token) throw new Error('Could not obtain Google access token')

  const calendarId = integration.calendarId || 'primary'
  const url =
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events` +
    `?sendUpdates=all`

  const body: Record<string, unknown> = {
    summary: event.summary,
    start: { dateTime: event.startDateTime, timeZone: event.timeZone },
    end: { dateTime: event.endDateTime, timeZone: event.timeZone },
    attendees: event.attendees.map(a => ({ email: a.email, displayName: a.displayName })),
    reminders: { useDefault: true },
  }
  if (event.description) body.description = event.description

  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    let text = ''
    try {
      text = await res.text()
    } catch {
      /* ignore */
    }
    if (res.status === 401 || res.status === 403) {
      await prisma.calendarIntegration
        .deleteMany({ where: { chatbotId } })
        .catch(() => undefined)
    }
    throw new Error(`Calendar API ${res.status}: ${text}`)
  }

  return (await res.json()) as { id: string; htmlLink?: string }
}
