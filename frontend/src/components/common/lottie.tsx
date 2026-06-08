import { DotLottieReact } from '@lottiefiles/dotlottie-react'

/**
 * Thin wrapper around DotLottieReact. Pass a bundled asset URL (import the
 * Lottie JSON with the Vite `?url` suffix) so the player fetches a hashed,
 * cache-busted file. Loops and autoplays by default.
 */
export const Lottie: React.FC<{
  src: string
  className?: string
  loop?: boolean
  autoplay?: boolean
}> = ({ src, className, loop = true, autoplay = true }) => (
  <DotLottieReact
    src={src}
    loop={loop}
    autoplay={autoplay}
    className={className}
    // Render at the screen's real pixel density so the canvas stays sharp on
    // HiDPI/retina displays instead of being upscaled from CSS pixels.
    renderConfig={{ devicePixelRatio: window.devicePixelRatio, autoResize: true }}
  />
)
