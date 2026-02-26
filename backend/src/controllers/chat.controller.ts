import type { Request, Response, NextFunction } from 'express'
import { Prisma } from '@prisma/client'
import { prisma } from '../prisma/client.js'
import { ApiStatus, type ApiResponse } from '../types/api.js'
import PDFDocument from 'pdfkit'
import * as chatService from '../services/chat.service.js'
import { getSystemInstruction } from '../constants/instructions.js'
import { resolveCountry } from '../services/geolocation.service.js'
import type { NestedSort } from '../types/common.js'

export const chatController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { chatbotId } = req.params
    let { sessionId, message, source } = req.body

    if (!chatbotId) {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'Chatbot ID is required',
      } satisfies ApiResponse)
    }

    if (!message) {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'User message required',
      } satisfies ApiResponse)
    }

    // --- Fetch chatbot (always needed for instruction config) ---
    const chatbot = await prisma.chatbot.findUnique({
      where: { id: chatbotId },
    })

    if (!chatbot) {
      return res.status(404).json({
        status: ApiStatus.FAILURE,
        message: 'Chatbot not found',
      } satisfies ApiResponse)
    }

    // --- Session creation / validation ---
    if (!sessionId) {
      const session = await prisma.chatSession.create({
        data: {
          chatbotId,
          source: source || 'playground',
          messages: {
            create: {
              role: 'user',
              content: message,
              sources: [],
            },
          },
        },
        include: {
          messages: true,
        },
      })
      sessionId = session.id

      // Resolve country in background — don't block chat response
      const clientIp =
        (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || ''
      resolveCountry(clientIp).then(geo => {
        if (geo.country) {
          prisma.chatSession
            .update({
              where: { id: session.id },
              data: { country: geo.country, countryCode: geo.countryCode },
            })
            .catch(() => {})
        }
      })
    } else {
      const session = await prisma.chatSession.findFirst({
        where: { id: sessionId, chatbotId },
      })

      if (!session) {
        return res.status(404).json({
          status: ApiStatus.FAILURE,
          message: 'Chat session not found',
        } satisfies ApiResponse)
      }

      await prisma.chatMessage.create({
        data: {
          sessionId,
          role: 'user',
          content: message,
          sources: [],
        },
      })
    }

    const systemInstruction = getSystemInstruction(
      chatbot.instructionType,
      chatbot.customInstruction
    )

    // --- SSE headers ---
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')
    res.flushHeaders()

    const sendSSE = (payload: object) => {
      res.write(`data: ${JSON.stringify(payload)}\n\n`)
    }

    // Send sessionId immediately
    sendSSE({ type: 'session', sessionId })

    // --- RAG: embed + search ---
    const startTime = Date.now()

    let queryEmbedding: number[]
    try {
      queryEmbedding = await chatService.generateEmbedding(message)
    } catch (err) {
      sendSSE({ type: 'error', message: 'Failed to generate embedding' })
      res.end()
      return
    }

    const relevantChunks = await chatService.searchRelevantChunks(chatbotId, queryEmbedding)
    const context = chatService.buildContext(relevantChunks)
    const sourceDocIds = [...new Set(relevantChunks.map(c => c.documentId))]

    // Calculate confidence score from average similarity of retrieved chunks
    const confidenceScore =
      relevantChunks.length > 0
        ? relevantChunks.reduce((sum, c) => sum + c.similarity, 0) / relevantChunks.length
        : 0

    // Fetch last 10 messages (desc to get most recent, then reverse for chronological order)
    const recentMessages = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })
    const chatHistory = recentMessages
      .reverse()
      .slice(0, -1) // exclude the user message we just saved
      .map(m => ({
        role: m.role,
        content: m.content,
      }))

    // --- Stream LLM response ---
    let fullResponse = ''

    await chatService.streamLLMResponse({
      message,
      context,
      chatHistory,
      systemInstruction,
      onToken: (token: string) => {
        fullResponse += token
        sendSSE({ type: 'token', token })
      },
      onComplete: async () => {
        const responseTime = Date.now() - startTime

        // Save assistant message to DB
        const assistantMessage = await prisma.chatMessage.create({
          data: {
            sessionId,
            role: 'assistant',
            content: fullResponse,
            model: 'meta-llama/Llama-3.1-8B-Instruct',
            responseTime,
            sources: sourceDocIds,
            confidenceScore,
          },
        })

        sendSSE({ type: 'done', message: assistantMessage })
        res.end()
      },
      onError: (error: Error) => {
        console.error('LLM streaming error:', error)
        sendSSE({ type: 'error', message: 'Failed to generate response' })
        res.end()
      },
    })
  } catch (error) {
    // If headers already sent (SSE started), send error event
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Internal server error' })}\n\n`)
      res.end()
    } else {
      next(error)
    }
  }
}

export const getChatSessions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { chatbotId } = req.params
    const { searchParam = '', sortBy = 'Default' } = req.query as { searchParam?: string; sortBy?: string }

    if (!chatbotId) {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'Chatbot ID is required',
      } satisfies ApiResponse)
    }

    const chatbot = await prisma.chatbot.findUnique({
      where: { id: chatbotId, userId: req.user.id },
    })

    if (!chatbot) {
      return res.status(404).json({
        status: ApiStatus.FAILURE,
        message: 'Chatbot not found',
      } satisfies ApiResponse)
    }

    // Get sort order
    const getOrderBy = (filter: string): NestedSort => {
      switch (filter) {
        case 'Oldest':
          return { createdAt: 'asc' as const }
        case 'Newest':
          return { createdAt: 'desc' as const }
        case 'Default':
        default:
          return { createdAt: 'desc' as const }
      }
    }

    const sessions = await prisma.chatSession.findMany({
      where: { chatbotId },
      orderBy: getOrderBy(sortBy),
      select: {
        id: true,
        chatbotId: true,
        createdAt: true,
        updatedAt: true,
        source: true,
        messages: {
          take: 2,
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: { messages: true },
        },
      },
    })

    // Fetch messages for the first (most recent) session
    const firstSession = sessions[0]
    if (firstSession) {
      const messages = await prisma.chatMessage.findMany({
        where: { sessionId: firstSession.id },
        orderBy: { createdAt: 'asc' },
      })
      ;(firstSession as any).messages = messages
    }

    res.status(200).json({
      status: ApiStatus.SUCCESS,
      data: sessions,
      message: 'Chat sessions retrieved successfully',
    } satisfies ApiResponse)
  } catch (error) {
    next(error)
  }
}

export const getChatSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { chatbotId, sessionId } = req.params
    if (!chatbotId) {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'Chatbot ID is required',
      } satisfies ApiResponse)
    }

    if (!sessionId) {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'Chat session ID required',
      } satisfies ApiResponse)
    }

    const chatbot = await prisma.chatbot.findUnique({
      where: { id: chatbotId, userId: req.user.id },
    })

    if (!chatbot) {
      return res.status(404).json({
        status: ApiStatus.FAILURE,
        message: 'Chatbot not found',
      } satisfies ApiResponse)
    }
    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, chatbotId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!session) {
      return res.status(404).json({
        status: ApiStatus.FAILURE,
        message: 'Chat session not found',
      } satisfies ApiResponse)
    }

    res.status(200).json({
      status: ApiStatus.SUCCESS,
      data: { chatSession: session },
      message: 'Successfully retrieved chat session',
    } satisfies ApiResponse)
  } catch (error) {
    next(error)
  }
}

export const deleteChatSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { chatbotId, sessionId } = req.params
    if (!chatbotId) {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'Chatbot ID is required',
      } satisfies ApiResponse)
    }

    if (!sessionId) {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'Chat session ID required',
      } satisfies ApiResponse)
    }

    await prisma.chatSession.delete({
      where: { id: sessionId, chatbotId: chatbotId },
    })

    return res.status(200).json({
      status: ApiStatus.SUCCESS,
      data: null,
      message: 'Session deleted successfully',
    } satisfies ApiResponse)
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({
        status: ApiStatus.FAILURE,
        message: 'Chat session not found',
      } satisfies ApiResponse)
    }
    next(error)
  }
}

// Helper to fetch all chat sessions with messages for export
const getExportData = async (chatbotId: string, userId: string) => {
  const chatbot = await prisma.chatbot.findUnique({
    where: { id: chatbotId, userId },
  })
  if (!chatbot) return null

  return prisma.chatSession.findMany({
    where: { chatbotId },
    orderBy: { createdAt: 'desc' },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
    },
  })
}

export const exportChatsAsJSON = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { chatbotId } = req.params
    if (!chatbotId) {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'Chatbot ID is required',
      } satisfies ApiResponse)
    }
    const sessions = await getExportData(chatbotId, req.user.id)

    if (!sessions) {
      return res.status(404).json({
        status: ApiStatus.FAILURE,
        message: 'Chatbot not found',
      } satisfies ApiResponse)
    }

    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', `attachment; filename="chats-${chatbotId}.json"`)
    res.send(JSON.stringify(sessions, null, 2))
  } catch (error) {
    next(error)
  }
}

export const exportChatsAsCSV = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { chatbotId } = req.params
    if (!chatbotId) {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'Chatbot ID is required',
      } satisfies ApiResponse)
    }
    const sessions = await getExportData(chatbotId, req.user.id)

    if (!sessions) {
      return res.status(404).json({
        status: ApiStatus.FAILURE,
        message: 'Chatbot not found',
      } satisfies ApiResponse)
    }

    const escapeCSV = (value: string) => `"${value.replace(/"/g, '""')}"`

    const header =
      'Session ID,Created At,Role,Content,Model,Tokens Used,Response Time,Feedback,Message Created At'
    const rows = sessions.flatMap(session =>
      session.messages.map(msg =>
        [
          escapeCSV(session.id),
          escapeCSV(session.createdAt.toISOString()),
          escapeCSV(msg.role),
          escapeCSV(msg.content),
          escapeCSV(msg.model ?? ''),
          msg.tokensUsed ?? '',
          msg.responseTime ?? '',
          escapeCSV(msg.feedback ?? ''),
          escapeCSV(msg.createdAt.toISOString()),
        ].join(',')
      )
    )

    const csv = [header, ...rows].join('\n')

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="chats-${chatbotId}.csv"`)
    res.send(csv)
  } catch (error) {
    next(error)
  }
}

export const exportChatsAsPDF = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { chatbotId } = req.params
    if (!chatbotId) {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'Chatbot ID is required',
      } satisfies ApiResponse)
    }
    const sessions = await getExportData(chatbotId, req.user.id)

    if (!sessions) {
      return res.status(404).json({
        status: ApiStatus.FAILURE,
        message: 'Chatbot not found',
      } satisfies ApiResponse)
    }

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="chats-${chatbotId}.pdf"`)

    const doc = new PDFDocument({ margin: 50 })
    doc.pipe(res)

    doc.fontSize(20).text('Chat Logs Export', { align: 'center' })
    doc.moveDown()

    for (const session of sessions) {
      doc.fontSize(12).font('Helvetica-Bold').text(`Session: ${session.id}`)
      doc.fontSize(9).font('Helvetica').text(`Created: ${session.createdAt.toISOString()}`)
      doc.moveDown(0.5)

      for (const msg of session.messages) {
        const label = msg.role === 'user' ? 'User' : 'Assistant'
        doc.fontSize(10).font('Helvetica-Bold').text(`${label}:`, { continued: true })
        doc.font('Helvetica').text(` ${msg.content}`)
        doc.moveDown(0.3)
      }

      doc.moveDown()
      doc
        .moveTo(50, doc.y)
        .lineTo(doc.page.width - 50, doc.y)
        .stroke('#e0e0e0')
      doc.moveDown()
    }

    doc.end()
  } catch (error) {
    next(error)
  }
}

export const updateMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { chatbotId, sessionId, messageId } = req.params
    const { feedback } = req.body
    if (!chatbotId) {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'Chatbot ID is required',
      } satisfies ApiResponse)
    }

    if (!sessionId) {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'Chat session ID required',
      } satisfies ApiResponse)
    }

    if (!messageId) {
      return res.status(400).json({
        status: ApiStatus.FAILURE,
        message: 'Message ID is required',
      } satisfies ApiResponse)
    }

    const existingChatbot = await prisma.chatbot.findUnique({
      where: { id: chatbotId },
    })

    if (!existingChatbot) {
      return res.status(404).json({
        status: ApiStatus.FAILURE,
        message: "Chatbot not found or you don't have the permission to edit",
      } satisfies ApiResponse)
    }

    const existingSession = await prisma.chatSession.findUnique({
      where: { id: sessionId, chatbotId: chatbotId },
    })

    if (!existingSession) {
      return res.status(404).json({
        status: ApiStatus.FAILURE,
        message: 'Session not found or session does not belong to this chatbot',
      } satisfies ApiResponse)
    }

    const existingMessage = await prisma.chatMessage.findUnique({
      where: { id: messageId, sessionId: sessionId },
    })

    if (!existingMessage) {
      return res.status(404).json({
        status: ApiStatus.FAILURE,
        message: 'Message not found or message does not belong to this session',
      } satisfies ApiResponse)
    }

    const message = await prisma.chatMessage.update({
      where: { id: messageId },
      data: { feedback },
    })

    res.status(200).json({
      status: ApiStatus.SUCCESS,
      data: message,
      message: 'Message updated successfully',
    } satisfies ApiResponse)
  } catch (error) {
    next(error)
  }
}
