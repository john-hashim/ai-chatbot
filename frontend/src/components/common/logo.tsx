interface LogoProps {
  className?: string
  width?: number
  height?: number
  color?: string
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  width = 80,
  height = 80,
  //   color = '#FF584A',
}) => {
  return (
    <svg
      width={width}
      height={height}
      className={className}
      viewBox="0 0 60 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5 10C5 7.23858 7.23858 5 10 5H50C52.7614 5 55 7.23858 55 10V35C55 37.7614 52.7614 40 50 40H30L15 55V40H10C7.23858 40 5 37.7614 5 35V10Z"
        stroke="#FF584A"
        strokeWidth="3"
        fill="none"
        strokeLinejoin="round"
      />
      <circle cx="23" cy="23" r="3" fill="#FF584A" />
      <circle cx="30" cy="23" r="3" fill="#FF584A" />
      <circle cx="37" cy="23" r="3" fill="#FF584A" />
    </svg>
  )
}
