import { type AxiosResponse } from 'axios'
import apiClient from '../index'
import { ENDPOINTS } from '../endpoints'
import type { ApiResponse } from '@/types/api'
import type { TuneAnswer } from '@/feature/tune-agent/constants'

export interface NextQuestionResult {
  question: string
  placeholder: string
  done: boolean
}

export const tuneAgentService = {
  /**
   * Get the next AI-generated onboarding question (with an example answer),
   * based on the interview answers so far. `done: true` means the agent has
   * enough to generate the instruction.
   */
  nextQuestion: (
    chatbotId: string,
    answers: TuneAnswer[]
  ): Promise<AxiosResponse<ApiResponse<NextQuestionResult>>> => {
    return apiClient.post(ENDPOINTS.TUNE_AGENT.NEXT_QUESTION.replace(':chatbotId', chatbotId), {
      answers,
    })
  },
  /**
   * Compile the full interview into a custom lead-qualification system
   * instruction. The backend also persists it on the chatbot.
   */
  generateInstruction: (
    chatbotId: string,
    answers: TuneAnswer[]
  ): Promise<AxiosResponse<ApiResponse<{ instruction: string }>>> => {
    return apiClient.post(
      ENDPOINTS.TUNE_AGENT.GENERATE_INSTRUCTION.replace(':chatbotId', chatbotId),
      { answers }
    )
  },
}
