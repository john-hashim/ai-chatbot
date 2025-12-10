import React from 'react'

interface TagProps {
  color: string
  text: string
  className?: string
}

const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

const adjustBrightness = (rgb: { r: number; g: number; b: number }, amount: number) => {
  return {
    r: Math.min(255, Math.max(0, rgb.r + amount)),
    g: Math.min(255, Math.max(0, rgb.g + amount)),
    b: Math.min(255, Math.max(0, rgb.b + amount)),
  }
}

export const TagComponent: React.FC<TagProps> = ({ text, color, className = '' }) => {
  const rgb = hexToRgb(color)

  if (!rgb) {
    return <div className={`px-2 text-xs py-1 rounded-lg border ${className}`}>{text}</div>
  }

  // Border color: original color
  const borderColor = color

  // Background color: slightly diminished (more transparent)
  const backgroundColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`

  // Text color: darker for better readability
  const darkerRgb = adjustBrightness(rgb, -60)
  const textColor = `rgb(${darkerRgb.r}, ${darkerRgb.g}, ${darkerRgb.b})`

  return (
    <div
      className={`px-2 text-xs py-px rounded-lg border ${className}`}
      style={{
        borderColor,
        backgroundColor,
        color: textColor,
      }}
    >
      {text}
    </div>
  )
}
