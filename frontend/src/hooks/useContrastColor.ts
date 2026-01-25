import { useMemo } from 'react'

/**
 * Converts a hex color to RGB values
 */
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

/**
 * Calculates the relative luminance of a color
 * Using the formula: (R * 299 + G * 587 + B * 114) / 1000
 * This is based on the perceived brightness of colors by human eye
 */
const getLuminance = (hex: string): number => {
  const rgb = hexToRgb(hex)
  if (!rgb) return 0
  return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000
}

/**
 * Determines if a color is light or dark
 * @param hex - The hex color string
 * @param threshold - Luminance threshold (default: 128)
 * @returns true if the color is light, false if dark
 */
export const isLightColor = (hex: string, threshold = 128): boolean => {
  return getLuminance(hex) > threshold
}

/**
 * Returns the appropriate contrast color (black or white) for a given background
 * @param backgroundColor - The hex color of the background
 * @param threshold - Luminance threshold (default: 128)
 * @returns 'black' or 'white'
 */
export const getContrastColor = (
  backgroundColor: string,
  threshold = 128
): 'black' | 'white' => {
  return isLightColor(backgroundColor, threshold) ? 'black' : 'white'
}

/**
 * Returns the appropriate contrast hex color for a given background
 * @param backgroundColor - The hex color of the background
 * @param threshold - Luminance threshold (default: 128)
 * @returns '#000000' or '#ffffff'
 */
export const getContrastHexColor = (
  backgroundColor: string,
  threshold = 128
): '#000000' | '#ffffff' => {
  return isLightColor(backgroundColor, threshold) ? '#000000' : '#ffffff'
}

/**
 * Hook that returns contrast color utilities for a given background color
 * Memoized for performance when used in components
 */
export const useContrastColor = (backgroundColor: string, threshold = 128) => {
  return useMemo(() => {
    const isLight = isLightColor(backgroundColor, threshold)
    return {
      isLight,
      isDark: !isLight,
      contrastColor: isLight ? 'black' : 'white',
      contrastHex: isLight ? '#000000' : '#ffffff',
      textClass: isLight ? 'text-black' : 'text-white',
    }
  }, [backgroundColor, threshold])
}
