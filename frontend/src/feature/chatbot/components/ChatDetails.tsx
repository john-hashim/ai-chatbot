import type React from 'react'
import { Text } from '@mantine/core'

export const ChatDetails: React.FC = () => {
  return (
    <div className="h-full flex items-center justify-center">
      <Text c="dimmed">Select a chat to view details</Text>
    </div>
  )
}
