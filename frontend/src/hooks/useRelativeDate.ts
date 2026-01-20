/**
 * Hook to format dates relative to current time
 * - Today: "X hours ago" or "X minutes ago"
 * - Yesterday: "Yesterday"
 * - Older: "Jan 20, 2026"
 */

export function formatRelativeDate(date: Date | string | null | undefined): string {
  if (!date) return ''

  const inputDate = typeof date === 'string' ? new Date(date) : date
  const now = new Date()

  const diffMs = now.getTime() - inputDate.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

  // Check if same day
  const isToday =
    inputDate.getDate() === now.getDate() &&
    inputDate.getMonth() === now.getMonth() &&
    inputDate.getFullYear() === now.getFullYear()

  // Check if yesterday
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday =
    inputDate.getDate() === yesterday.getDate() &&
    inputDate.getMonth() === yesterday.getMonth() &&
    inputDate.getFullYear() === yesterday.getFullYear()

  if (isToday) {
    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  }

  if (isYesterday) {
    return 'Yesterday'
  }

  // Format as "Jan 20, 2026"
  return inputDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function useRelativeDate(date: Date | string | null | undefined): string {
  return formatRelativeDate(date)
}
