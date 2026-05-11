import { modelsService } from '@/api/services/models'
import type { ChatModel, ModelTier } from '@/types/chatbot'
import type { StateCreator } from 'zustand'

export interface ModelGroup {
  group: string
  items: { value: string; label: string }[]
}

export interface ModelsSlice {
  models: ChatModel[]
  defaultModelId: string | null
  groupedModels: ModelGroup[]
  isLoadingModels: boolean
  modelsError: string | null
  fetchModels: (force?: boolean) => Promise<void>
  clearModels: () => void
}

const TIER_LABEL: Record<ModelTier, string> = {
  free: 'Free',
  standard: 'Standard',
  premium: 'Premium',
}

const TIER_ORDER: ModelTier[] = ['free', 'standard', 'premium']

function groupByTier(models: ChatModel[]): ModelGroup[] {
  return TIER_ORDER.map(tier => ({
    group: TIER_LABEL[tier],
    items: models
      .filter(m => m.tier === tier)
      .map(m => ({ value: m.id, label: `${m.label} · ${m.vendor}` })),
  })).filter(g => g.items.length > 0)
}

const initialModelsState = {
  models: [] as ChatModel[],
  defaultModelId: null as string | null,
  groupedModels: [] as ModelGroup[],
  isLoadingModels: false,
  modelsError: null as string | null,
}

export const createModelsSlice: StateCreator<ModelsSlice> = (set, get) => ({
  ...initialModelsState,

  fetchModels: async (force = false) => {
    if (!force && get().models.length > 0) return
    set({ isLoadingModels: true, modelsError: null })
    try {
      const res = await modelsService.list()
      const models = res.data.data?.models ?? []
      const defaultModelId = res.data.data?.defaultModelId ?? null
      set({
        models,
        defaultModelId,
        groupedModels: groupByTier(models),
        isLoadingModels: false,
      })
    } catch (err) {
      console.error('Failed to load models:', err)
      set({
        isLoadingModels: false,
        modelsError: err instanceof Error ? err.message : 'Failed to load models',
      })
    }
  },

  clearModels: () => set(initialModelsState),
})
