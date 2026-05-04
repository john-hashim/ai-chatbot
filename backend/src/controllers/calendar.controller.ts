import type { Request, Response, NextFunction } from 'express'
import { prisma } from '../prisma/client.js'
import { ApiStatus, type ApiResponse } from '../types/api.js'
import * as calendarService from '../services/calendar.service.js'

const FRONTEND_URL = process.env.FRONTEND_URL || '*'

// Validates :chatbotId param + ownership in one shot. Writes the error
// response itself; handlers just early-return on null.
async function requireOwnedChatbot(req: Request, res: Response): Promise<string | null> {
  const { chatbotId } = req.params
  if (!chatbotId) {
    res.status(400).json({
      status: ApiStatus.FAILURE,
      message: 'chatbotId is required',
    } satisfies ApiResponse)
    return null
  }
  const chatbot = await prisma.chatbot.findFirst({
    where: { id: chatbotId, userId: req.user.id },
  })
  if (!chatbot) {
    res.status(404).json({
      status: ApiStatus.FAILURE,
      message: 'Chatbot not found',
    } satisfies ApiResponse)
    return null
  }
  return chatbotId
}

export const getAuthorizeUrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const chatbotId = await requireOwnedChatbot(req, res)
    if (!chatbotId) return
    return res.status(200).json({
      status: ApiStatus.SUCCESS,
      message: 'Authorize URL generated',
      data: { url: calendarService.buildAuthorizeUrl(chatbotId) },
    } satisfies ApiResponse)
  } catch (err) {
    next(err)
  }
}

export const handleCallback = async (req: Request, res: Response) => {
  // Inline JSON inside <script> must escape '<' so a hostile string
  // containing '</script>' can't break out. JSON.stringify alone doesn't escape it.
  const safeJson = (v: unknown) =>
    JSON.stringify(v).replace(/</g, '\\u003c').replace(/-->/g, '--\\>')

  const respond = (payload: Record<string, unknown>) => {
    try {
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      return res.send(`<!doctype html>
<html><head><meta charset="utf-8"><title>Connecting…</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;color:#374151;">
<div style="text-align:center;">
  <p>${(payload.success as boolean) ? 'Calendar connected. You can close this window.' : 'Could not connect calendar. You can close this window.'}</p>
</div>
<script>
  try {
    if (window.opener) {
      window.opener.postMessage(${safeJson({ type: 'calendar-connect', ...payload })}, ${safeJson(FRONTEND_URL)});
    }
  } catch (e) {}
  setTimeout(function(){ try { window.close() } catch (e) {} }, 400);
</script>
</body></html>`)
    } catch (err) {
      console.error('Calendar callback respond failed:', err)
    }
  }

  const error = req.query.error
  const code = typeof req.query.code === 'string' ? req.query.code : ''
  const state = typeof req.query.state === 'string' ? req.query.state : ''

  if (error) return respond({ success: false, error: String(error) })
  if (!code || !state) return respond({ success: false, error: 'missing_params' })

  try {
    const verified = calendarService.verifyState(state)
    if (!verified) return respond({ success: false, error: 'invalid_state' })

    const tokens = await calendarService.exchangeCode(code)
    if (!tokens.access_token) return respond({ success: false, error: 'no_access_token' })

    const accountEmail = await calendarService.fetchAccountEmail(tokens.access_token)
    const tokenExpiry = new Date(tokens.expiry_date ?? Date.now() + 3600 * 1000)

    await prisma.calendarIntegration.upsert({
      where: { chatbotId: verified.chatbotId },
      create: {
        chatbotId: verified.chatbotId,
        provider: 'google',
        accountEmail,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? '',
        tokenExpiry,
        scope: tokens.scope ?? null,
      },
      update: {
        accountEmail,
        accessToken: tokens.access_token,
        ...(tokens.refresh_token ? { refreshToken: tokens.refresh_token } : {}),
        tokenExpiry,
        scope: tokens.scope ?? null,
      },
    })

    return respond({ success: true, email: accountEmail })
  } catch (err) {
    console.error('Calendar OAuth callback failed:', err)
    return respond({ success: false, error: 'callback_failed' })
  }
}

export const getStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const chatbotId = await requireOwnedChatbot(req, res)
    if (!chatbotId) return
    const integration = await prisma.calendarIntegration.findUnique({
      where: { chatbotId },
      select: { provider: true, accountEmail: true },
    })
    return res.status(200).json({
      status: ApiStatus.SUCCESS,
      message: 'OK',
      data: { integration },
    } satisfies ApiResponse)
  } catch (err) {
    next(err)
  }
}

export const disconnect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const chatbotId = await requireOwnedChatbot(req, res)
    if (!chatbotId) return
    await prisma.calendarIntegration.deleteMany({ where: { chatbotId } })
    return res.status(200).json({
      status: ApiStatus.SUCCESS,
      message: 'Disconnected',
    } satisfies ApiResponse)
  } catch (err) {
    next(err)
  }
}
