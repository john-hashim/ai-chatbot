import { useMemo } from 'react'

const PER_CHAR_DELAY = 18 // ms between characters

/**
 * Renders question text so each character slides up letter-by-letter, like an AI
 * is typing the question. Re-mounts on text change via the `key` so it replays.
 */
export const AnimatedQuestion: React.FC<{ text: string }> = ({ text }) => {
  const words = useMemo(() => text.split(/(\s+)/), [text])
  let charIndex = 0

  return (
    <p
      key={text}
      aria-label={text}
      className="m-0 min-h-[1.45em] text-[17px] font-semibold leading-[1.45] tracking-[-0.015em] text-text"
    >
      {words.map((w, wi) => {
        if (/^\s+$/.test(w)) return <span key={wi}>{w}</span>
        return (
          <span key={wi} className="tune-word">
            {[...w].map((ch, ci) => {
              const i = charIndex++
              return (
                <span key={ci} className="tune-char" style={{ animationDelay: `${i * PER_CHAR_DELAY}ms` }}>
                  {ch}
                </span>
              )
            })}
          </span>
        )
      })}
    </p>
  )
}
