/**
 * Booking flow service
 *
 * Channel-agnostic state machine for the appointment booking flow.
 *
 * Hybrid design:
 *  - Structured payloads (rich UI clients) → deterministic JSON parse, no LLM.
 *  - Free-form text (WhatsApp, plain widgets, etc.) → single LLM classifier
 *    returns intent + extracted slots in one call.
 *  - Pure state machine (`advance`) consumes (state, draft) and decides which
 *    action handler to run. No I/O — fully unit-testable.
 */

import Groq from 'groq-sdk'
import { buildBookingClassifierPrompt } from '../constants/instructions.js'

// Mirrors the Prisma `BookingState` enum. Defined locally so this module is
// self-contained (and unit-testable) and isn't blocked on `prisma generate`.
// Values must stay in sync with prisma/schema.prisma.
export const BookingState = {
  IDLE: 'IDLE',
  AWAITING_DATE: 'AWAITING_DATE',
  AWAITING_TIME: 'AWAITING_TIME',
  AWAITING_CONTACT: 'AWAITING_CONTACT',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
} as const
export type BookingState = (typeof BookingState)[keyof typeof BookingState]

export type BookingDraft = {
  date?: string // YYYY-MM-DD
  time?: string // HH:mm
  name?: string
  email?: string
}

export type BookingAction =
  | 'BOOKING'
  | 'CONFIRM_DATE'
  | 'CONFIRM_TIME'
  | 'BOOKING_CONFIRM'
  | 'BOOKING_CANCEL'
  | 'NONE' // fall through to normal RAG chat

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const TIME_RE = /^\d{2}:\d{2}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// ---------------------------------------------------------------------------
// 1. Fast path: structured payload from rich UI clients (web buttons, WhatsApp
//    interactive replies, etc.). Skips the LLM entirely when the message is
//    already a JSON object with known booking keys.
// ---------------------------------------------------------------------------
export function parseStructuredPayload(message: string): BookingDraft | null {
  const trimmed = message.trimStart()
  console.log(trimmed)
  console.log(!trimmed.startsWith('{'))
  if (!trimmed.startsWith('{')) return null
  try {
    const parsed = JSON.parse(trimmed) as Record<string, unknown>
    const out: BookingDraft = {}
    if (
      typeof parsed.booking_confirm_date === 'string' &&
      DATE_RE.test(parsed.booking_confirm_date)
    ) {
      out.date = parsed.booking_confirm_date
    }
    if (
      typeof parsed.booking_confirm_time === 'string' &&
      TIME_RE.test(parsed.booking_confirm_time)
    ) {
      out.time = parsed.booking_confirm_time
    }
    if (typeof parsed.name === 'string' && parsed.name.trim()) {
      out.name = parsed.name.trim()
    }
    if (typeof parsed.email === 'string' && EMAIL_RE.test(parsed.email.trim())) {
      out.email = parsed.email.trim()
    }
    return Object.keys(out).length > 0 ? out : null
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// 2. Unified LLM classifier. Replaces the previous keyword-based intent and
//    cancel detectors and the slot-only extractor. One Groq call returns the
//    user's booking intent and any slots they mentioned.
//
//    Tolerant to typos ("bok appointment"), paraphrases ("can you fix a
//    time?"), and negation ("don't book yet" → cancel inside a flow, none
//    while IDLE) — the things keyword matching can't handle.
// ---------------------------------------------------------------------------
export type BookingIntent = 'start_booking' | 'cancel_booking' | 'provide_slot' | 'none'

export type Classification = {
  intent: BookingIntent
  slots: BookingDraft
}

const VALID_INTENTS = new Set<BookingIntent>([
  'start_booking',
  'cancel_booking',
  'provide_slot',
  'none',
])

export async function classifyMessage(
  message: string,
  state: BookingState,
  draft: BookingDraft
): Promise<Classification> {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

  const today = new Date().toISOString().split('T')[0] ?? ''
  const systemPrompt = buildBookingClassifierPrompt({ state, draft, today })

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      max_tokens: 200,
      temperature: 0,
      response_format: { type: 'json_object' },
    })

    const raw = completion.choices[0]?.message?.content ?? '{}'
    const parsed = JSON.parse(raw) as Record<string, unknown>

    let intent: BookingIntent = VALID_INTENTS.has(parsed.intent as BookingIntent)
      ? (parsed.intent as BookingIntent)
      : 'none'

    // Defensive: provide_slot only makes sense inside an active flow.
    if (state === BookingState.IDLE && intent === 'provide_slot') {
      intent = 'none'
    }

    const slots: BookingDraft = {}
    if (typeof parsed.date === 'string' && DATE_RE.test(parsed.date)) slots.date = parsed.date
    if (typeof parsed.time === 'string' && TIME_RE.test(parsed.time)) slots.time = parsed.time
    if (typeof parsed.name === 'string' && parsed.name.trim()) slots.name = parsed.name.trim()
    if (typeof parsed.email === 'string' && EMAIL_RE.test(parsed.email.trim())) {
      slots.email = parsed.email.trim()
    }

    return { intent, slots }
  } catch {
    return { intent: 'none', slots: {} }
  }
}

// ---------------------------------------------------------------------------
// 3. Pure state machine. Given the current state and the merged draft, decide
//    what state to move to and which action handler to run. No I/O — every
//    case is unit-testable.
//
//    Cancel and IDLE-entry are handled by the controller before calling this,
//    so `advance` only deals with in-flow progression.
// ---------------------------------------------------------------------------
export type AdvanceResult = {
  nextState: BookingState
  action: BookingAction
}

export function advance(state: BookingState, draft: BookingDraft): AdvanceResult {
  switch (state) {
    case BookingState.IDLE:
      // Controller decides whether to enter the flow; if it called advance
      // with IDLE, treat as a fresh booking start.
      return { nextState: BookingState.AWAITING_DATE, action: 'BOOKING' }

    case BookingState.AWAITING_DATE:
      if (draft.date) return { nextState: BookingState.AWAITING_TIME, action: 'CONFIRM_DATE' }
      // No date yet — re-show the date picker.
      return { nextState: BookingState.AWAITING_DATE, action: 'BOOKING' }

    case BookingState.AWAITING_TIME:
      if (draft.date && draft.time) {
        return { nextState: BookingState.AWAITING_CONTACT, action: 'CONFIRM_TIME' }
      }
      // Have date but no time — re-show the time picker for that date.
      if (draft.date) return { nextState: BookingState.AWAITING_TIME, action: 'CONFIRM_DATE' }
      // Lost the date somehow — regress to date pick.
      return { nextState: BookingState.AWAITING_DATE, action: 'BOOKING' }

    case BookingState.AWAITING_CONTACT:
      if (draft.date && draft.time && draft.name && draft.email) {
        return { nextState: BookingState.CONFIRMED, action: 'BOOKING_CONFIRM' }
      }
      // Missing name or email — re-prompt with the contact form.
      return { nextState: BookingState.AWAITING_CONTACT, action: 'CONFIRM_TIME' }

    case BookingState.CONFIRMED:
    case BookingState.CANCELLED:
      // Terminal states — controller resets to IDLE before next turn, so we
      // shouldn't normally reach here. Defensive fallback: act as IDLE.
      return { nextState: BookingState.AWAITING_DATE, action: 'BOOKING' }
  }
}

// ---------------------------------------------------------------------------
// 4. Helpers for the controller — keeping draft merging in one place so the
//    controller stays declarative.
// ---------------------------------------------------------------------------
export function mergeDraft(current: BookingDraft, incoming: BookingDraft): BookingDraft {
  const out: BookingDraft = { ...current }
  if (incoming.date !== undefined) out.date = incoming.date
  if (incoming.time !== undefined) out.time = incoming.time
  if (incoming.name !== undefined) out.name = incoming.name
  if (incoming.email !== undefined) out.email = incoming.email
  return out
}

export function isTerminal(state: BookingState): boolean {
  return state === BookingState.CONFIRMED || state === BookingState.CANCELLED
}
