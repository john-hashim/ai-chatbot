/** Animated completion checkmark — circle draws, then the check, then a burst. */
export const Tick: React.FC = () => (
  <div className="relative h-[84px] w-[84px]">
    <svg viewBox="0 0 90 90" className="block h-full w-full">
      <circle className="tune-tick-burst" cx="45" cy="45" r="40" />
      <circle className="tune-tick-circle-bg" cx="45" cy="45" r="40" />
      <circle className="tune-tick-circle" cx="45" cy="45" r="40" transform="rotate(-90 45 45)" />
      <polyline className="tune-tick-check" points="28,46 40,58 62,34" />
    </svg>
  </div>
)
