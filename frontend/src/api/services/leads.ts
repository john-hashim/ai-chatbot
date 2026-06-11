import { type AxiosResponse } from 'axios'
import apiClient from '../index'
import { ENDPOINTS } from '../endpoints'
import type { ApiResponse } from '@/types/api'
import type {
  KanbanBoards,
  KanbanColumn,
  Lead,
  MoveLeadRequest,
  CreateLeadRequest,
} from '@/types/leads'

export const leadsService = {
  getBoards: (chatbotId: string): Promise<AxiosResponse<ApiResponse<KanbanBoards>>> => {
    return apiClient.get(ENDPOINTS.LEADS.GET_BOARDS.replace(':chatbotId', chatbotId))
  },

  createColumn: (
    chatbotId: string,
    name: string
  ): Promise<AxiosResponse<ApiResponse<KanbanColumn>>> => {
    return apiClient.post(ENDPOINTS.LEADS.CREATE_COLUMN.replace(':chatbotId', chatbotId), { name })
  },

  renameColumn: (
    chatbotId: string,
    columnId: string,
    name: string
  ): Promise<AxiosResponse<ApiResponse<KanbanColumn>>> => {
    return apiClient.patch(
      ENDPOINTS.LEADS.RENAME_COLUMN.replace(':chatbotId', chatbotId).replace(':columnId', columnId),
      { name }
    )
  },

  reorderColumns: (
    chatbotId: string,
    orderedIds: string[]
  ): Promise<AxiosResponse<ApiResponse<KanbanColumn[]>>> => {
    return apiClient.patch(ENDPOINTS.LEADS.REORDER_COLUMNS.replace(':chatbotId', chatbotId), {
      orderedIds,
    })
  },

  deleteColumn: (chatbotId: string, columnId: string): Promise<AxiosResponse<ApiResponse>> => {
    return apiClient.delete(
      ENDPOINTS.LEADS.DELETE_COLUMN.replace(':chatbotId', chatbotId).replace(':columnId', columnId)
    )
  },

  getLeads: (chatbotId: string): Promise<AxiosResponse<ApiResponse<Lead[]>>> => {
    return apiClient.get(ENDPOINTS.LEADS.GET_LEADS.replace(':chatbotId', chatbotId))
  },

  createLead: (
    chatbotId: string,
    data: CreateLeadRequest
  ): Promise<AxiosResponse<ApiResponse<Lead>>> => {
    return apiClient.post(ENDPOINTS.LEADS.CREATE_LEAD.replace(':chatbotId', chatbotId), data)
  },

  moveLead: (
    chatbotId: string,
    leadId: string,
    data: MoveLeadRequest
  ): Promise<AxiosResponse<ApiResponse<Lead>>> => {
    return apiClient.patch(
      ENDPOINTS.LEADS.MOVE_LEAD.replace(':chatbotId', chatbotId).replace(':leadId', leadId),
      data
    )
  },

  updateLead: (
    chatbotId: string,
    leadId: string,
    data: CreateLeadRequest
  ): Promise<AxiosResponse<ApiResponse<Lead>>> => {
    return apiClient.patch(
      ENDPOINTS.LEADS.UPDATE_LEAD.replace(':chatbotId', chatbotId).replace(':leadId', leadId),
      data
    )
  },

  deleteLead: (chatbotId: string, leadId: string): Promise<AxiosResponse<ApiResponse>> => {
    return apiClient.delete(
      ENDPOINTS.LEADS.DELETE_LEAD.replace(':chatbotId', chatbotId).replace(':leadId', leadId)
    )
  },
}
