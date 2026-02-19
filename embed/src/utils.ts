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

const getLuminance = (hex: string): number => {
  const rgb = hexToRgb(hex)
  if (!rgb) return 0
  return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000
}

export const isLightColor = (hex: string, threshold = 128): boolean => {
  return getLuminance(hex) > threshold
}

export const getContrastColor = (
  backgroundColor: string
): { contrastHex: string; contrastColor: 'black' | 'white' } => {
  const isLight = isLightColor(backgroundColor)
  return {
    contrastHex: isLight ? '#000000' : '#ffffff',
    contrastColor: isLight ? 'black' : 'white',
  }
}
