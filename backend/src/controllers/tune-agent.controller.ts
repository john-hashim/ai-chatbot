import type { Request, Response, NextFunction } from 'express'
import { prisma } from '../prisma/client.js'
import { ApiStatus, type ApiResponse } from '../types/api.js'
import * as tuneAgentService from '../services/tune-agent.service.js'
import { MAX_TUNE_QUESTIONS, type TuneAnswer } from '../services/tune-agent.service.js'
import { replaceAutomatedColumns } from '../services/kanban.service.js'

const MAX_FIELD_LENGTH = 2000

/**
 * Validate the answers payload: an array of { q, a } string pairs, capped in
 * count and field length so user input can't blow up the LLM prompt.
 */
function parseAnswers(body: unknown): TuneAnswer[] | null {
  const answers = (body as { answers?: unknown })?.answers
  if (!Array.isArray(answers) || answers.length > MAX_TUNE_QUESTIONS) return null
  const parsed: TuneAnswer[] = []
  for (const row of answers) {
    const q = (row as { q?: unknown })?.q
    const a = (row as { a?: unknown })?.a
    if (typeof q !== 'string' || typeof a !== 'string' || !q.trim() || !a.trim()) return null
    parsed.push({ q: q.slice(0, MAX_FIELD_LENGTH), a: a.slice(0, MAX_FIELD_LENGTH) })
  }
  return parsed
}

async function findOwnedChatbot(chatbotId: string | undefined, userId: string) {
  if (!chatbotId) return null
  return prisma.chatbot.findUnique({
    where: { id: chatbotId, userId },
    select: { id: true, name: true, selectedModel: true },
  })
}

export const nextQuestion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const chatbot = await findOwnedChatbot(req.params.chatbotId, req.user.id)
    if (!chatbot) {
      return res.status(404).json({
        status: ApiStatus.FAILURE,
        message: 'Chatbot not found or you do not have permission',
      } satisfies ApiResponse)
    }

    const answers = parseAnswers(req.body)
    if (!answers) {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'Invalid answers payload',
      } satisfies ApiResponse)
    }

    const result = await tuneAgentService.generateNextQuestion(
      chatbot.name,
      chatbot.selectedModel,
      answers
    )

    res.json({
      status: ApiStatus.SUCCESS,
      data: result,
      message: 'Next question generated',
    } satisfies ApiResponse)
  } catch (error) {
    next(error)
  }
}

export const generateInstruction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const chatbot = await findOwnedChatbot(req.params.chatbotId, req.user.id)
    if (!chatbot) {
      return res.status(404).json({
        status: ApiStatus.FAILURE,
        message: 'Chatbot not found or you do not have permission',
      } satisfies ApiResponse)
    }

    const answers = parseAnswers(req.body)
    if (!answers || answers.length === 0) {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'Invalid answers payload',
      } satisfies ApiResponse)
    }

    // Instruction and pipeline stages come from the same interview — generate
    // them in parallel. Stage generation falls back internally, never throws.
    const [instruction, stages] = await Promise.all([
      tuneAgentService.generateCustomInstruction(chatbot.name, chatbot.selectedModel, answers),
      tuneAgentService.generatePipelineStages(chatbot.name, chatbot.selectedModel, answers),
    ])

    // Persist immediately so the generated instruction survives a refresh even
    // if the client-side save races or fails.
    await prisma.chatbot.update({
      where: { id: chatbot.id },
      data: { customInstruction: instruction, instructionType: 'manual' },
    })

    // Rebuild the automated kanban from the new pipeline stages.
    const pipeline = await replaceAutomatedColumns(chatbot.id, stages)

    res.json({
      status: ApiStatus.SUCCESS,
      data: { instruction, pipeline },
      message: 'Custom instruction generated',
    } satisfies ApiResponse)
  } catch (error) {
    next(error)
  }
}
