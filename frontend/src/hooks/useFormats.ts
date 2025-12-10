export const useFormat = () => {
  const bytesToKB = (bytes: number) => Math.round(bytes / 1024)
  const bytesToMB = (bytes: number) => Math.round(bytes / (1024 * 1024))

  return { bytesToKB, bytesToMB }
}
