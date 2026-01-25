import type React from 'react'

interface ChatBubbleIconProps {
  color?: 'black' | 'white' | string
  className?: string
}

export const ChatBubbleIcon: React.FC<ChatBubbleIconProps> = ({
  color = 'white',
  className = '',
}) => {
  const fillColor = color === 'black' ? '#000000' : color === 'white' ? '#ffffff' : color
  const sparkleColor = color === 'black' ? '#ffffff' : color === 'white' ? '#000000' : '#ffffff'

  return (
    <svg
      width="68"
      height="60"
      viewBox="0 -4 68 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Main chat bubble with small pointy tail */}
      <path
        d="M15.6 17.2C15.6 14.5491 17.7491 12.4 20.4 12.4H47.6C50.2509 12.4 52.4 14.5491 52.4 17.2V31.6C52.4 34.2509 50.2509 36.4 47.6 36.4H36.4L34 40.8L31.6 36.4H20.4C17.7491 36.4 15.6 34.2509 15.6 31.6V17.2Z"
        fill={fillColor}
        stroke={fillColor}
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Sparkle 1 (right side, top) */}
      <path
        d="M41.2 21.6L42.16 24.48L45.04 25.44L42.16 26.4L41.2 29.28L40.24 26.4L37.36 25.44L40.24 24.48L41.2 21.6Z"
        fill={sparkleColor}
      />

      {/* Sparkle 2 (right side, bottom) */}
      <path
        d="M44.4 27.2L45.04 29.12L46.96 29.76L45.04 30.4L44.4 32.32L43.76 30.4L41.84 29.76L43.76 29.12L44.4 27.2Z"
        fill={sparkleColor}
      />
    </svg>
  )
}
