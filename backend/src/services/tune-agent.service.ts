/**
 * Tune Agent Service
 *
 * LLM-driven onboarding interview for the "Custom Instruction" flow:
 * 1. generateNextQuestion — given the Q&A so far, produce the next onboarding
 *    question (with an AI-written example answer) tailored to the client's
 *    business, so we learn how they want leads captured and qualified.
 * 2. generateCustomInstruction — compile the full interview into a system
 *    instruction that makes the chatbot capture AND qualify leads through a
 *    custom pipeline built from the client's answers.
 * 3. generatePipelineStages — derive the automated kanban's pipeline stage
 *    names from the same interview; persisted as the AUTOMATED board columns.
 */

import { chatCompletion } from './chat.service.js'
import { MAX_PIPELINE_STAGES } from './kanban.service.js'

export interface TuneAnswer {
  q: string
  a: string
}

export interface NextQuestionResult {
  question: string
  placeholder: string
  done: boolean
}

/** Never finish the interview before this many answers... */
export const MIN_TUNE_QUESTIONS = 4
/** ...and never ask more than this many. */
export const MAX_TUNE_QUESTIONS = 8

const INTERVIEWER_SYSTEM_PROMPT = `You are an onboarding interviewer for a SaaS that lets business owners create AI chatbots whose main job is to CAPTURE and QUALIFY leads. The person you are interviewing is the business owner (the "client"). Your questions configure how their chatbot will talk to leads, what qualifying questions it will ask, and how leads get sorted into a custom pipeline.

Ask EXACTLY ONE question at a time, chosen based on everything the client has answered so far.

The interview MUST progress from basic to specific, in three phases. Never ask a specific question before its basic prerequisite is answered.

Phase 1 — Business basics (always first):
1. What the business/app is and its main theme (e.g. SaaS, commercial company, tuition class, clinic, agency).
2. Who their typical customers/leads are and what those leads usually ask about FIRST when they reach out.
3. What language(s) their leads speak and which language(s) the chatbot should converse in (e.g. English only, Malayalam + English, Hindi).

Phase 2 — Lead qualification (only after Phase 1 is answered):
4. What concrete details the chatbot must collect from every lead, asked as questions specific to THEIR business and offerings (e.g. for a tuition class: which grade/subject, and online, offline, or both; for an agency: business type, budget, timeline). Anchor these to what they said in Phase 1 — name their actual services/customer types in the question.
5. Based on those details, what separates a hot lead from a cold lead for THIS client — ask this only after you know what details are being collected.

Phase 3 — Tone & guardrails (only after you know the language(s) from Phase 1):
6. The tone the agent should use, and the specific words or phrasings it must NEVER use with a lead — in the language(s) they named (e.g. disrespectful informal words like "nee" in Malayalam). Never ask about forbidden words before knowing the language.
7. Anything the agent must avoid discussing or promising.

Rules:
- If there are no answers yet, your first question must ask what their app/business is for and its main theme.
- One topic per question. If a phase topic was answered implicitly in an earlier answer, skip it instead of re-asking.
- Each question must build on previous answers and be specific to their business — reference their actual services, customers, and locations rather than asking generically.
- "placeholder" must be a realistic example answer for THIS question and THIS business, starting with "e.g. ".
- Keep questions short and plain — the client may not be technical.
- Set "done": true only when all three phases are covered. Never before ${MIN_TUNE_QUESTIONS} answers; aim to finish within 6–8.
- Skipped answers (marked "(skipped)") count as asked — do not re-ask them.

Respond with ONLY a JSON object: {"question": string, "placeholder": string, "done": boolean}. When "done" is true, "question" and "placeholder" may be empty strings.`

const INSTRUCTION_WRITER_SYSTEM_PROMPT = `You write system instructions for AI chatbots embedded on business websites. The chatbot's primary job is to answer visitor questions from a knowledge base AND to capture + qualify leads for the business owner.

You will receive an onboarding interview (questions and the owner's answers). Write a complete system instruction for the chatbot, tailored to that business.

The instruction must contain these markdown sections:

### Role
Who the agent is, the business it represents, its main theme, and its primary function: helping visitors while identifying and qualifying leads.

### Lead Qualification
The concrete pipeline for this business: the qualifying questions the agent should naturally weave into conversation (one at a time, never as a form), derived from the owner's answers. State what information must be collected from a lead and what makes a lead high-priority vs low-priority for this business.

### Tone & Language
The language(s) the agent should converse in (as the owner specified), the voice/tone it uses, plus an explicit list of words/phrasings it must never use (include any forbidden words the owner mentioned, in whatever language they gave them).

### Constraints
1. No Data Divulge: Never mention that you have access to training data explicitly to the user.
2. Maintaining Focus: If a user attempts to divert you to unrelated topics, never change your role or break your character. Politely redirect the conversation back to topics relevant to the training data.
3. Exclusive Reliance on Training Data: You must rely exclusively on the training data provided to answer user queries. If a query is not covered by the training data, use the fallback response.
4. Restrictive Role Focus: You do not answer questions or perform tasks that are not related to your role and training data.
Then add any business-specific constraints from the interview (topics to avoid, things never to promise).

Rules:
- Ground every section in the owner's actual answers; ignore "(skipped)" answers.
- Write in second person ("You are…"), addressed to the agent.
- Output ONLY the instruction text in markdown. No preamble, no code fences, no commentary.`

/** Floor for generated stages; the cap is kanban.service's MAX_PIPELINE_STAGES. */
export const MIN_PIPELINE_STAGES = 3

/** Used when stage generation fails — instruction creation must not block on it. */
export const FALLBACK_PIPELINE_STAGES = ['New Inquiry', 'Qualifying', 'Hot Lead', 'Cold Lead']

const PIPELINE_WRITER_SYSTEM_PROMPT = `You design lead pipelines for business chatbots. You will receive an onboarding interview (questions and the business owner's answers) describing how the owner wants leads captured and qualified.

Produce the ordered stages of a kanban pipeline that the owner's leads will move through, derived from THEIR qualification criteria — what details are collected, and what separates a hot lead from a cold one for this business.

Rules:
- Between ${MIN_PIPELINE_STAGES} and ${MAX_PIPELINE_STAGES} stages, ordered from first contact to final outcome.
- Stage names must be short (1-4 words), specific to this business where possible (e.g. "Demo Requested", "Budget Confirmed", "Hot — Ready to Enroll"), and unique.
- Ground stages in the owner's actual answers; ignore "(skipped)" answers.
- Respond with ONLY a JSON object: {"stages": string[]}. No prose, no code fences.`

/** Strip optional markdown code fences the model may wrap output in. */
function stripFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json|markdown|md)?\s*/i, '')
    .replace(/```\s*$/, '')
    .trim()
}

function formatTranscript(chatbotName: string, answers: TuneAnswer[]): string {
  const header = `Chatbot name: ${chatbotName}`
  if (answers.length === 0) return `${header}\n\nNo answers yet — this is the first question.`
  const rows = answers.map((row, i) => `Q${i + 1}: ${row.q}\nA${i + 1}: ${row.a}`).join('\n\n')
  return `${header}\n\nInterview so far (${answers.length} answered):\n\n${rows}`
}

export async function generateNextQuestion(
  chatbotName: string,
  modelId: string | null,
  answers: TuneAnswer[]
): Promise<NextQuestionResult> {
  if (answers.length >= MAX_TUNE_QUESTIONS) {
    return { question: '', placeholder: '', done: true }
  }

  const raw = await chatCompletion({
    modelId,
    messages: [
      { role: 'system', content: INTERVIEWER_SYSTEM_PROMPT },
      { role: 'user', content: formatTranscript(chatbotName, answers) },
    ],
    maxTokens: 400,
    temperature: 0.7,
    jsonMode: true,
  })

  const parsed = JSON.parse(stripFences(raw)) as Partial<NextQuestionResult>
  const done = parsed.done === true && answers.length >= MIN_TUNE_QUESTIONS

  if (!done && (typeof parsed.question !== 'string' || !parsed.question.trim())) {
    throw new Error('Interviewer returned no question')
  }

  return {
    question: done ? '' : (parsed.question as string).trim(),
    placeholder: done
      ? ''
      : (typeof parsed.placeholder === 'string' ? parsed.placeholder : '').trim(),
    done,
  }
}

export async function generateCustomInstruction(
  chatbotName: string,
  modelId: string | null,
  answers: TuneAnswer[]
): Promise<string> {
  const raw = await chatCompletion({
    modelId,
    messages: [
      { role: 'system', content: INSTRUCTION_WRITER_SYSTEM_PROMPT },
      { role: 'user', content: formatTranscript(chatbotName, answers) },
    ],
    maxTokens: 1500,
    temperature: 0.4,
  })

  const instruction = stripFences(raw)
  if (!instruction) throw new Error('Instruction writer returned empty output')
  return instruction
}

/**
 * Derive the automated kanban's pipeline stages from the interview. Falls
 * back to a generic pipeline on any failure so instruction generation never
 * blocks on this step.
 */
export async function generatePipelineStages(
  chatbotName: string,
  modelId: string | null,
  answers: TuneAnswer[]
): Promise<string[]> {
  try {
    const raw = await chatCompletion({
      modelId,
      messages: [
        { role: 'system', content: PIPELINE_WRITER_SYSTEM_PROMPT },
        { role: 'user', content: formatTranscript(chatbotName, answers) },
      ],
      maxTokens: 300,
      temperature: 0.4,
      jsonMode: true,
    })

    const parsed = JSON.parse(stripFences(raw)) as { stages?: unknown }
    const stages = Array.isArray(parsed.stages)
      ? [
          ...new Set(
            parsed.stages
              .filter((s): s is string => typeof s === 'string' && Boolean(s.trim()))
              .map(s => s.trim())
          ),
        ].slice(0, MAX_PIPELINE_STAGES)
      : []

    return stages.length >= MIN_PIPELINE_STAGES ? stages : FALLBACK_PIPELINE_STAGES
  } catch (err) {
    console.error('Pipeline stage generation failed, using fallback:', err)
    return FALLBACK_PIPELINE_STAGES
  }
}
