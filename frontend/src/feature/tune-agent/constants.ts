export interface TuneQuestion {
  q: string
  placeholder: string
}

/** Seeded questions. Each answer maps to a section of the generated system prompt. */
export const TUNE_QUESTIONS: TuneQuestion[] = [
  {
    q: 'What should we call your agent, and what is its core role?',
    placeholder: 'e.g. Atlas — a research assistant that summarizes long product docs for PMs.',
  },
  {
    q: 'Who is the primary user, and what problem are they solving?',
    placeholder:
      'e.g. Internal product team trying to triage customer feedback into themes each week.',
  },
  {
    q: 'What tone and personality should the agent embody?',
    placeholder: 'e.g. Warm but concise. Avoids jargon. Uses plain language and short sentences.',
  },
  {
    q: 'What capabilities must your agent absolutely have?',
    placeholder:
      'e.g. Search internal docs, summarize tickets, draft customer-facing replies, cite sources.',
  },
  {
    q: 'Are there any topics, actions, or behaviors the agent must avoid?',
    placeholder: 'e.g. Never discuss pricing, never share competitor info, never speculate on roadmap.',
  },
  {
    q: 'Share one example of an ideal exchange.',
    placeholder:
      'e.g. User: "What\'s blocking checkout?"  Agent: "Top 3 themes — payment retries (42%), address validation (28%), 3DS prompts (18%)."',
  },
  {
    q: 'What domain knowledge or context should be loaded by default?',
    placeholder: 'e.g. Latest changelog, brand voice doc, pricing sheet, last 30 days of support tickets.',
  },
]

/** Prompt section headings, parallel to TUNE_QUESTIONS. */
const PROMPT_SECTIONS = [
  'Identity & Role',
  'Target User',
  'Tone & Personality',
  'Capabilities',
  'Guardrails',
  'Example Exchange',
  'Knowledge Base',
]

export interface TuneAnswer {
  q: string
  a: string
}

/** Compile collected answers into a structured markdown system prompt. */
export function buildPrompt(answers: TuneAnswer[], modelLabel: string): string[] {
  const lines: string[] = []
  lines.push(`# System Prompt · ${modelLabel}`)
  lines.push('')
  answers.forEach((row, i) => {
    lines.push(`## ${PROMPT_SECTIONS[i] || 'Additional Context'}`)
    lines.push(row.a)
    lines.push('')
  })
  lines.push('## Output style')
  lines.push('Respond with clear, structured Markdown. Cite sources when relevant.')
  return lines
}
