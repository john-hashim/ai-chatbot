import { useContrastColor } from '@/hooks/useContrastColor'
import { X } from 'lucide-react'
import { ChatBubbleIcon } from '../ChatBubbleIcon'

export interface ChatBubbleButtonProps {
  color?: string
  icon?: string | null
  isOpen?: boolean
  onClick?: () => void
  className?: string
}

export const ChatBubbleButton: React.FC<ChatBubbleButtonProps> = ({
  color = '#000000',
  icon,
  isOpen = false,
  onClick,
  className = '',
}) => {
  const contrast = useContrastColor(color)

  return (
    <button
      className={`flex h-14 w-14 items-center justify-center overflow-hidden rounded-full shadow-lg transition-transform duration-200 hover:scale-105 ${className}`}
      style={{ backgroundColor: color }}
      onClick={onClick}
      aria-label={isOpen ? 'Close chat' : 'Open chat'}
    >
      {isOpen ? (
        <X className="h-6 w-6" style={{ color: contrast.contrastHex }} />
      ) : icon ? (
        <img src={icon} alt="Chat" className="h-full w-full object-cover" />
      ) : (
        <ChatBubbleIcon color={contrast.contrastColor} className="h-14 w-14" />
      )}
    </button>
  )
}
