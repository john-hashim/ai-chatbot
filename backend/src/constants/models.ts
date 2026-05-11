export type ModelTier = 'free' | 'standard' | 'premium'

export interface ChatModel {
  id: string
  label: string
  tier: ModelTier
  vendor: string
}

export const DEFAULT_MODEL_ID = 'meta-llama/llama-3.3-70b-instruct'

export const CHAT_MODELS: ChatModel[] = [
  // Standard / cheap tier
  {
    id: 'meta-llama/llama-3.3-70b-instruct',
    label: 'Llama 3.3 70B Instruct',
    tier: 'standard',
    vendor: 'Meta',
  },
  {
    id: 'deepseek/deepseek-r1',
    label: 'DeepSeek R1',
    tier: 'standard',
    vendor: 'DeepSeek',
  },
  {
    id: 'openai/gpt-4o-mini',
    label: 'GPT-4o mini',
    tier: 'standard',
    vendor: 'OpenAI',
  },
  {
    id: 'openai/gpt-5-nano',
    label: 'GPT-5 Nano',
    tier: 'standard',
    vendor: 'OpenAI',
  },
  {
    id: 'openai/gpt-5-mini',
    label: 'GPT-5 Mini',
    tier: 'standard',
    vendor: 'OpenAI',
  },
  {
    id: 'anthropic/claude-haiku-4.5',
    label: 'Claude Haiku 4.5',
    tier: 'standard',
    vendor: 'Anthropic',
  },
  {
    id: 'google/gemini-2.5-flash-lite',
    label: 'Gemini 2.5 Flash Lite',
    tier: 'standard',
    vendor: 'Google',
  },
  {
    id: 'google/gemini-2.5-flash',
    label: 'Gemini 2.5 Flash',
    tier: 'standard',
    vendor: 'Google',
  },

  // Premium tier
  {
    id: 'openai/gpt-5',
    label: 'GPT-5',
    tier: 'premium',
    vendor: 'OpenAI',
  },
  {
    id: 'openai/gpt-5.1',
    label: 'GPT-5.1',
    tier: 'premium',
    vendor: 'OpenAI',
  },
  {
    id: 'anthropic/claude-sonnet-4.5',
    label: 'Claude Sonnet 4.5',
    tier: 'premium',
    vendor: 'Anthropic',
  },
  {
    id: 'anthropic/claude-opus-4.5',
    label: 'Claude Opus 4.5',
    tier: 'premium',
    vendor: 'Anthropic',
  },
  {
    id: 'google/gemini-2.5-pro',
    label: 'Gemini 2.5 Pro',
    tier: 'premium',
    vendor: 'Google',
  },
]

const MODEL_INDEX: Map<string, ChatModel> = new Map(CHAT_MODELS.map(m => [m.id, m]))

export function findModel(id: string | null | undefined): ChatModel | undefined {
  if (!id) return undefined
  return MODEL_INDEX.get(id)
}

export function resolveModel(id: string | null | undefined): ChatModel {
  return findModel(id) ?? MODEL_INDEX.get(DEFAULT_MODEL_ID)!
}

export function isValidModelId(id: unknown): id is string {
  return typeof id === 'string' && MODEL_INDEX.has(id)
}
