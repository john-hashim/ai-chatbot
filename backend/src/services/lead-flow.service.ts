/**
 * Lead flow service
 *
 * Automated lead capture for chatbots with a Tune Agent custom instruction.
 * After a normal RAG turn, a single cheap LLM classifier reads the recent
 * conversation plus the chatbot's generated pipeline stages and decides:
 *   - is this visitor a lead yet (did they satisfy a qualification condition)?
 *   - which pipeline stage do they belong to?
 *   - what contact details have they shared?
 *
 * Runs fire-and-forget from the chat controller so it never delays the
 * visitor-facing stream. Gated to keep cost down: skipped entirely when the
 * chatbot has no automated pipeline, and skipped on early turns unless the
 * message already contains contact info or a lead already exists (in which
 * case we re-classify to keep the stage current).
 */

import { KanbanBoardType, LeadType } from '@prisma/client'
import { prisma } from '../prisma/client.js'
import { chatCompletion } from './chat.service.js'
import { captureLead } from './lead.service.js'

export type LeadClassification = {
  isLead: boolean
  stage: string | null
  name: string | null
  email: string | null
  phone: string | null
  summary: string | null
}

const EMAIL_RE = /[^\s@]+@[^\s@]+\.[^\s@]+/
const PHONE_RE = /(?:\+?\d[\d\s().-]{7,}\d)/
/** Don't classify before this many user messages unless contact info appears. */
const MIN_USER_MESSAGES = 3
/** How much conversation the classifier sees. */
const MAX_CLASSIFIER_MESSAGES = 20

function buildLeadClassifierPrompt(stages: string[]): string {
  return `You are a lead-qualification classifier for a business chatbot. You will receive the recent conversation between a website visitor and the chatbot. Decide whether the visitor qualifies as a LEAD and, if so, which pipeline stage they belong to.

Pipeline stages (in order): ${stages.map((s, i) => `${i + 1}. ${s}`).join(' ')}

A visitor is a lead when they show buying/engagement intent for the business's offerings (asking about pricing, availability, enrollment, services for themselves) or share contact details — not when they only ask generic informational questions.

Return a JSON object with these keys:
- "isLead" (required, boolean) — true only if the visitor shows genuine intent or shared contact details.
- "stage" (optional) — the single best-matching pipeline stage, copied EXACTLY from the list above. Omit if isLead is false or no stage fits.
- "name" (optional) — the visitor's name if they stated it.
- "email" (optional) — a valid email if they provided one.
- "phone" (optional) — a phone number if they provided one.
- "summary" (optional) — one short sentence on what the visitor wants (their need, budget, timeline, etc.).

Hard rules:
1. "stage" must be one of the listed stage names verbatim — never invent a stage.
2. Only extract details the VISITOR stated. Never infer or fabricate contact info.
3. Hypothetical or idle curiosity ("just looking", "what is this site?") → isLead false.
4. Output JSON only — no prose.`
}

/** Strip optional markdown code fences the model may wrap output in. */
function stripFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/, '')
    .trim()
}

export async function classifyLead(
  modelId: string | null,
  stages: string[],
  conversation: { role: string; content: string }[]
): Promise<LeadClassification | null> {
  const transcript = conversation
    .map(m => `${m.role === 'user' ? 'Visitor' : 'Chatbot'}: ${m.content}`)
    .join('\n')

  try {
    const raw = await chatCompletion({
      modelId,
      messages: [
        { role: 'system', content: buildLeadClassifierPrompt(stages) },
        { role: 'user', content: transcript },
      ],
      maxTokens: 300,
      temperature: 0,
      jsonMode: true,
    })

    const parsed = JSON.parse(stripFences(raw) || '{}') as Record<string, unknown>
    const stage =
      typeof parsed.stage === 'string'
        ? (stages.find(s => s.toLowerCase() === (parsed.stage as string).trim().toLowerCase()) ??
          null)
        : null

    return {
      isLead: parsed.isLead === true,
      stage,
      name: typeof parsed.name === 'string' && parsed.name.trim() ? parsed.name.trim() : null,
      email:
        typeof parsed.email === 'string' && EMAIL_RE.test(parsed.email)
          ? parsed.email.trim()
          : null,
      phone: typeof parsed.phone === 'string' && parsed.phone.trim() ? parsed.phone.trim() : null,
      summary:
        typeof parsed.summary === 'string' && parsed.summary.trim() ? parsed.summary.trim() : null,
    }
  } catch (err) {
    console.error('Lead classifier error:', err)
    return null
  }
}

/**
 * Orchestrator called (fire-and-forget) after a completed RAG turn. Applies
 * the cost gates, runs the classifier, and upserts an AUTOMATED lead.
 */
export async function maybeCaptureAutomatedLead(args: {
  chatbotId: string
  sessionId: string
  modelId: string | null
}): Promise<void> {
  const { chatbotId, sessionId, modelId } = args

  const stages = await prisma.kanbanColumn.findMany({
    where: { chatbotId, board: KanbanBoardType.AUTOMATED },
    orderBy: { position: 'asc' },
    select: { name: true },
  })
  if (stages.length === 0) return

  const messages = await prisma.chatMessage.findMany({
    where: { sessionId, isAction: false },
    orderBy: { createdAt: 'desc' },
    take: MAX_CLASSIFIER_MESSAGES,
    select: { role: true, content: true },
  })
  const conversation = messages.reverse()

  const existingLead = await prisma.lead.findUnique({
    where: { sessionId_type: { sessionId, type: LeadType.AUTOMATED } },
    select: { id: true },
  })

  // Gate: skip early small talk unless contact info already appeared or we
  // are refreshing the stage of an existing lead.
  const userMessages = conversation.filter(m => m.role === 'user')
  const hasContactInfo = userMessages.some(
    m => EMAIL_RE.test(m.content) || PHONE_RE.test(m.content)
  )
  if (!existingLead && !hasContactInfo && userMessages.length < MIN_USER_MESSAGES) return

  const result = await classifyLead(
    modelId,
    stages.map(s => s.name),
    conversation
  )
  if (!result || !result.isLead) return

  await captureLead({
    chatbotId,
    sessionId,
    type: LeadType.AUTOMATED,
    name: result.name,
    email: result.email,
    phone: result.phone,
    trigger: result.stage,
    stage: result.stage,
    meta: result.summary ? { summary: result.summary } : null,
  })
}
