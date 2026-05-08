import {
  ChevronLeft,
  Download,
  Ellipsis,
  History,
  MessageCircleReply,
  SquarePen,
  X,
} from 'lucide-react'
import type { ChatHeaderProps } from './types'
import { Popover } from '@mantine/core'
import { useState } from 'react'

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  name,
  profilePicture,
  brandColor,
  brandColorForHeader,
  headerTextColor,
  canDownload,
  chatView,
  onReset,
  onDownloadChat,
  onHandleView,
  onBack,
}) => {
  const [popoverOpen, setPopoverOpen] = useState(false)

  const handleNewChat = () => {
    setPopoverOpen(false)
    onReset?.()
  }

  const handleDownload = () => {
    setPopoverOpen(false)
    onDownloadChat?.()
  }

  const handleRecentChat = () => {
    setPopoverOpen(false)
    onHandleView?.()
  }

  return (
    <header
      className="flex items-center justify-between px-5"
      style={{
        background: brandColorForHeader
          ? `linear-gradient(0deg, rgba(255, 255, 255, 0) 29.14%, rgba(255, 255, 255, 0.16) 100%), ${brandColor}`
          : '',
      }}
    >
      <div className="my-4 flex h-10 items-center gap-3">
        {chatView === 'recent' ? (
          <>
            <button
              type="button"
              onClick={() => onBack?.()}
              className="flex h-7 w-7 items-center justify-center rounded-md opacity-70 hover:opacity-100"
              title="Back"
              style={{ color: headerTextColor }}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <History className="h-5 w-5" style={{ color: headerTextColor }} />
            <h1 className="text-sm font-medium tracking-tight" style={{ color: headerTextColor }}>
              Recent Chats
            </h1>
          </>
        ) : (
          <>
            {profilePicture && (
              <img
                src={profilePicture}
                alt="Chatbot"
                className="h-10 w-10 rounded-full object-cover"
              />
            )}
            <div className="flex flex-col justify-center">
              <h1 className="text-sm font-medium tracking-tight" style={{ color: headerTextColor }}>
                {name}
              </h1>
            </div>
          </>
        )}
      </div>
      <div className="flex items-center">
        {chatView !== 'recent' && (
          <Popover
            width={250}
            opened={popoverOpen}
            onChange={setPopoverOpen}
            position="bottom-end"
            transitionProps={{ transition: 'pop-top-right', duration: 180 }}
            shadow="md"
          >
            <Popover.Target>
              <button
                className="flex h-9 w-9 items-center justify-center rounded-md p-1.5 opacity-70 hover:opacity-85"
                title="Reset conversation"
                style={{ color: headerTextColor }}
                onClick={() => setPopoverOpen(o => !o)}
              >
                <Ellipsis className="h-5 w-5 cursor-pointer" />
              </button>
            </Popover.Target>
            <Popover.Dropdown>
              <div className="flex flex-col gap-0.5">
                <button className="chat-menu-btn" onClick={handleNewChat}>
                  <SquarePen className="h-3.5 w-3.5 shrink-0" />
                  New Chat
                </button>
                <button
                  className={`chat-menu-btn ${!canDownload ? 'pointer-events-none opacity-50' : ''}`}
                  onClick={handleDownload}
                  disabled={!canDownload}
                >
                  <Download className="h-3.5 w-3.5 shrink-0" />
                  Download this chat
                </button>
                <button className="chat-menu-btn" onClick={handleRecentChat}>
                  <MessageCircleReply className="h-3.5 w-3.5 shrink-0" />
                  View Recent Chats
                </button>
              </div>
            </Popover.Dropdown>
          </Popover>
        )}
        <button
          className="flex h-9 w-9 items-center justify-center rounded-md p-1.5 opacity-70 hover:opacity-85"
          title="Reset conversation"
          style={{ color: headerTextColor }}
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </header>
  )
}
