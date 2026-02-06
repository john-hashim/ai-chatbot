import type React from 'react'
import type { ChatSession } from '@/types/chatbot'
import { Ellipsis, Trash } from 'lucide-react'
import { Button, Menu, Tooltip } from '@mantine/core'

export interface ChatDetailsInterface {
  session: ChatSession | null
  handleSessionDelete: (id: string) => void
}

export const ChatDetails: React.FC<ChatDetailsInterface> = ({ session, handleSessionDelete }) => {
  return (
    <div className="h-full">
      {session && (
        <div className="flex px-10 py-6 border-b border-border-week justify-between">
          <p>{session?.source}</p>
          <Menu shadow="md" width={180}>
            <Menu.Target>
              <Tooltip label="Export">
                <Button variant="secondary" size="compact-sm" radius="md">
                  <Ellipsis size={16} strokeWidth={1.5} />
                </Button>
              </Tooltip>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                color="red"
                leftSection={<Trash size={14} />}
                onClick={() => handleSessionDelete(session?.id)}
              >
                Delete
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </div>
      )}
    </div>
  )
}
