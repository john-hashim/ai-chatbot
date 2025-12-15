export const useFormat = () => {
  const bytesToKB = (bytes: number) => Math.round(bytes / 1024)
  const bytesToMB = (bytes: number) => Math.round(bytes / (1024 * 1024))

  const formatFileSize = (bytes: number): string => {
    const kb = bytes / 1024
    // If less than 1 KB, show in bytes
    if (kb < 1) {
      return `${bytes} bytes`
    }
    return `${Math.round(kb)} KB`
  }

  return { bytesToKB, bytesToMB, formatFileSize }
}
