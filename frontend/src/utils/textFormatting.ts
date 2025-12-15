/**
 * Converts HTML to plain text by removing tags and normalizing whitespace
 */
export const htmlToPlainText = (html: string): string => {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Calculates the byte size of a string in UTF-8 encoding
 */
export const calculateTextSize = (text: string): number => {
  return new Blob([text]).size
}
