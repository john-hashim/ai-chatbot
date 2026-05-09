import type { NextFunction, Request, Response } from 'express'
import { ApiStatus, type ApiResponse } from '../types/api.js'

export const getEmbedConfig = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const chatbot = req.chatbot
    res.status(200).json({
      status: ApiStatus.SUCCESS,
      data: {
        id: chatbot.id,
        name: chatbot.name,
        appearance: chatbot.appearance,
        brandColor: chatbot.brandColor,
        brandColorForHeader: chatbot.brandColorForHeader,
        profilePicture: chatbot.profilePicture,
        initialMessages: chatbot.initialMessages,
        suggestedMessages: chatbot.suggestedMessages,
        showSuggestedAfterFirst: chatbot.showSuggestedAfterFirst,
        messagePlaceholder: chatbot.messagePlaceholder,
        dismissibleNotice: chatbot.dismissibleNotice,
        footer: chatbot.footer,
        chatIcon: chatbot.chatIcon,
        chatBubbleButtonColor: chatbot.chatBubbleButtonColor,
        chatBubbleButtonPosition: chatbot.chatBubbleButtonPosition,
        autoshowDelaySeconds: chatbot.autoshowDelaySeconds,
        autoshowInitialPopup: chatbot.autoshowInitialPopup,
      },
      message: 'chatbot successfully retrived',
    } satisfies ApiResponse)
  } catch (error) {
    next(error)
  }
}

