import { embedService, type EmbedConfig, type UpdateEmbedConfigPayload } from '@/api/services/embed'
import type { StateCreator } from 'zustand'

export interface EmbedSlice {
  embedConfig: EmbedConfig | null
  isLoadingEmbedConfig: boolean
  isMutatingEmbedConfig: boolean
  fetchEmbedConfig: (chatbotId: string) => Promise<void>
  createEmbedConfig: (chatbotId: string) => Promise<void>
  updateEmbedConfig: (chatbotId: string, data: UpdateEmbedConfigPayload) => Promise<void>
  clearEmbedConfig: () => void
}

const initialEmbedState = {
  embedConfig: null as EmbedConfig | null,
  isLoadingEmbedConfig: false,
  isMutatingEmbedConfig: false,
}

export const createEmbedSlice: StateCreator<EmbedSlice, [['zustand/devtools', never]], []> = set => ({
  ...initialEmbedState,

  fetchEmbedConfig: async (chatbotId: string) => {
    set({ isLoadingEmbedConfig: true }, undefined, '[Embed] Loading')
    try {
      const response = await embedService.getEmbedConfig(chatbotId)
      set({ embedConfig: response.data.data ?? null }, undefined, '[Embed] Set Config')
    } finally {
      set({ isLoadingEmbedConfig: false }, undefined, '[Embed] Loading Done')
    }
  },

  createEmbedConfig: async (chatbotId: string) => {
    set({ isMutatingEmbedConfig: true }, undefined, '[Embed] Create Loading')
    try {
      const response = await embedService.createEmbedConfig(chatbotId)
      set({ embedConfig: response.data.data ?? null }, undefined, '[Embed] Create Done')
    } finally {
      set({ isMutatingEmbedConfig: false }, undefined, '[Embed] Create Loading Done')
    }
  },

  updateEmbedConfig: async (chatbotId, data) => {
    set({ isMutatingEmbedConfig: true }, undefined, '[Embed] Update Loading')
    try {
      const response = await embedService.updateEmbedConfig(chatbotId, data)
      set({ embedConfig: response.data.data ?? null }, undefined, '[Embed] Update Done')
    } finally {
      set({ isMutatingEmbedConfig: false }, undefined, '[Embed] Update Loading Done')
    }
  },

  clearEmbedConfig: () => set(initialEmbedState, undefined, '[Embed] Clear'),
})
