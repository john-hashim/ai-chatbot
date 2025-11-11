export const ChatbotSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 375 667"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <clipPath id="roundedCorners">
          <rect width="375" height="667" rx="16" ry="16" />
        </clipPath>
        <filter id="glow">
          <feGaussianBlur stdDeviation="9" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect width="375" height="667" rx="16" ry="16" fill="#F8F9FA" />

      <g clipPath="url(#roundedCorners)">

        <rect y="0" width="375" height="70" fill="white" />
        <circle cx="30" cy="35" r="16" fill="#E9ECEF" />
        <rect x="55" y="25" width="120" height="12" rx="6" fill="#E9ECEF" />
        <rect x="55" y="43" width="80" height="8" rx="4" fill="#E9ECEF" />
        <circle cx="345" cy="35" r="5" fill="#E9ECEF" />

        <g transform="translate(16, 90)">
          <rect width="240" height="60" rx="16" fill="#E9ECEF" />
          <rect x="16" y="16" width="180" height="10" rx="5" fill="#DEE2E6" />
          <rect x="16" y="34" width="140" height="10" rx="5" fill="#DEE2E6" />
        </g>

        <g transform="translate(16, 165)">
          <rect width="200" height="45" rx="16" fill="#E9ECEF" />
          <rect x="16" y="12" width="150" height="10" rx="5" fill="#DEE2E6" />
          <rect x="16" y="28" width="100" height="10" rx="5" fill="#DEE2E6" />
        </g>

        <g transform="translate(119, 230)">
          <rect width="240" height="50" rx="16" fill="#6C5CE7" />
          <rect x="16" y="12" width="180" height="10" rx="5" fill="#5F4FD1" opacity="0.6" />
          <rect x="16" y="28" width="120" height="10" rx="5" fill="#5F4FD1" opacity="0.6" />
        </g>

        <g transform="translate(16, 300)">
          <rect width="260" height="75" rx="16" fill="#E9ECEF" />
          <rect x="16" y="16" width="200" height="10" rx="5" fill="#DEE2E6" />
          <rect x="16" y="34" width="180" height="10" rx="5" fill="#DEE2E6" />
          <rect x="16" y="52" width="120" height="10" rx="5" fill="#DEE2E6" />
        </g>

        <g transform="translate(159, 395)">
          <rect width="200" height="45" rx="16" fill="#6C5CE7" />
          <rect x="16" y="12" width="150" height="10" rx="5" fill="#5F4FD1" opacity="0.6" />
          <rect x="16" y="28" width="100" height="10" rx="5" fill="#5F4FD1" opacity="0.6" />
        </g>

        <g transform="translate(16, 460)">
          <rect width="220" height="60" rx="16" fill="#E9ECEF" />
          <rect x="16" y="16" width="170" height="10" rx="5" fill="#DEE2E6" />
          <rect x="16" y="34" width="130" height="10" rx="5" fill="#DEE2E6" />
        </g>

        <g transform="translate(16, 540)">
          <rect width="70" height="40" rx="16" fill="#E9ECEF" />
          <circle cx="24" cy="20" r="4" fill="#ADB5BD">
            <animate
              attributeName="opacity"
              values="0.3;1;0.3"
              dur="1.4s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="35" cy="20" r="4" fill="#ADB5BD">
            <animate
              attributeName="opacity"
              values="0.3;1;0.3"
              dur="1.4s"
              begin="0.2s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="46" cy="20" r="4" fill="#ADB5BD">
            <animate
              attributeName="opacity"
              values="0.3;1;0.3"
              dur="1.4s"
              begin="0.4s"
              repeatCount="indefinite"
            />
          </circle>
        </g>

        <rect y="597" width="375" height="70" fill="white" />
        <rect x="16" y="612" width="290" height="40" rx="20" fill="#F1F3F5" />
        <rect x="32" y="625" width="100" height="10" rx="5" fill="#DEE2E6" />
        <circle cx="335" cy="632" r="18" fill="#6C5CE7" />
        <path
          d="M330 632 L335 627 L340 632 L335 637 Z"
          fill="white"
          stroke="white"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  )
}
