export const ApiStatus = {
  SUCCESS: 'success',
  FAILURE: 'failure',
} as const

export type ApiStatus = (typeof ApiStatus)[keyof typeof ApiStatus]

export interface ApiResponse<T = unknown> {
  status: ApiStatus
  data?: T
  message: string
  error?: string
}
