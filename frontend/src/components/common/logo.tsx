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
      viewBox="0 0 44 40"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2 6C2 3.5 3.5 2 6 2H38C40.5 2 42 3.5 42 6V20C42 22.5 40.5 24 38 24H24L10 38V24H6C3.5 24 2 22.5 2 20V6Z"
        stroke="#FF584A"
        strokeWidth="5"
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx="15" cy="13" r="2" fill="#FF584A" />
      <circle cx="22" cy="13" r="2" fill="#FF584A" />
      <circle cx="29" cy="13" r="2" fill="#FF584A" />
    </svg>
  )
}
