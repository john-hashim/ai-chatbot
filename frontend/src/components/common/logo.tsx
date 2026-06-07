import React from 'react'

interface LogoProps {
  className?: string
  width?: number
  height?: number
  logoIcon?: boolean
  fontSize?: number
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  width = 80,
  height = 80,
  logoIcon = true,
  fontSize = 20,
}) => {
  return logoIcon ? (
    <div className="mb-2">
      {' '}
      <svg
        width={width}
        height={height}
        className={className}
        viewBox="52 62 96 46"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF584A" stopOpacity="1" />
            <stop offset="100%" stopColor="#FF7E73" stopOpacity="1" />
          </linearGradient>
        </defs>

        <path
          d="M 60 100 Q 80 70, 100 100 T 140 100"
          stroke="url(#grad)"
          strokeWidth="16"
          strokeLinecap="round"
          fill="none"
        />

        <circle cx="140" cy="100" r="8" fill="#FF584A" />
      </svg>
    </div>
  ) : (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <div className="mb-1">
        {' '}
        <svg
          width={width}
          height={height}
          viewBox="52 62 96 46"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF584A" stopOpacity="1" />
              <stop offset="100%" stopColor="#FF7E73" stopOpacity="1" />
            </linearGradient>
          </defs>

          <path
            d="M 60 100 Q 80 70, 100 100 T 140 100"
            stroke="url(#grad)"
            strokeWidth="16"
            strokeLinecap="round"
            fill="none"
          />

          <circle cx="140" cy="100" r="8" fill="#FF584A" />
        </svg>
      </div>
      <span className="font-semibold" style={{ fontSize: `${fontSize}px` }}>
        Chatvio
      </span>
    </div>
  )
}
