import { RefreshCw } from 'lucide-react'
import type { ChatHeaderProps } from './types'

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  name,
  profilePicture,
  brandColor,
  brandColorForHeader,
  headerTextColor,
  onReset,
}) => {
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
        {profilePicture && (
          <img
            src={profilePicture}
            alt="Chatbot"
            className="h-10 w-10 rounded-full object-cover"
          />
        )}
        <div className="flex flex-col justify-center">
          <h1
            className="text-sm font-medium tracking-tight"
            style={{ color: headerTextColor }}
          >
            {name}
          </h1>
        </div>
      </div>
      <div className="flex items-center">
        <button
          className="flex h-9 w-9 items-center justify-center rounded-md p-1.5 opacity-70 hover:opacity-85"
          title="Reset conversation"
          style={{ color: headerTextColor }}
          onClick={onReset}
        >
          <RefreshCw className="h-5 w-5 transition-transform duration-700 ease-in-out hover:rotate-180" />
        </button>
      </div>
    </header>
  )
}
