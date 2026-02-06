import { useState } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { Stack, UnstyledButton, Tooltip, Text, Overlay } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import {
  Sliders,
  Database,
  MessageSquareText,
  ChartLine,
  Rocket,
  Menu,
  Play,
  Users,
  Zap,
} from 'lucide-react'
import { useStore } from '@/store'

const navItems = [
  {
    icon: Play,
    label: 'Playground',
    path: 'playground',
    description: 'Test your chatbot in real-time',
  },
  {
    icon: Sliders,
    label: 'Customize',
    path: 'customize',
    description: 'Define how the bot behaves & looks',
  },
  {
    icon: Database,
    label: 'Knowledge Base',
    path: 'knowledge-base',
    description: 'Teach it information',
  },
  {
    icon: MessageSquareText,
    label: 'Chats',
    path: 'chats',
    description: 'Monitor conversations',
  },
  {
    icon: ChartLine,
    label: 'Analytics',
    path: 'analytics',
    description: 'Check performance',
  },
  {
    icon: Users,
    label: 'Contacts',
    path: 'contacts',
    description: 'Manage your chatbot contacts',
  },
  {
    icon: Zap,
    label: 'Automations',
    path: 'automations',
    description: 'Set up automated workflows',
  },
  {
    icon: Rocket,
    label: 'Deploy',
    path: 'deploy',
    description: 'Publish your chatbot',
  },
]

export const ChatbotSidebar: React.FC = () => {
  const [expanded, setExpanded] = useState(false)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const { chatbotId } = useParams()
  const isMobile = useMediaQuery('(max-width: 768px)')
  const { clearChatSessions } = useStore()

  const pathSegments = location.pathname.split('/')
  const currentPath = pathSegments[pathSegments.length - 1]
  // If we're at /chatbot/:id (no sub-path), default to 'playground'
  const activePath = currentPath === chatbotId ? 'playground' : currentPath
  const activeIndex = navItems.findIndex(item => item.path === activePath)

  // Item height (padding 6px*2 + icon 18px = 30px) + gap (4px) for indicator positioning
  const itemHeight = 36.3

  const handleNavClick = (path: string) => {
    if (path !== 'chats') clearChatSessions()
    navigate(`/chatbot/${chatbotId}/${path}`)
    if (isMobile) setExpanded(false)
  }

  return (
    <>
      {/* Mobile menu handle */}
      {isMobile && !expanded && (
        <UnstyledButton
          onClick={() => setExpanded(true)}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 100,
            padding: 8,
            borderRadius: 8,
            backgroundColor: '#fff',
            border: '1px solid var(--color-border-week)',
          }}
        >
          <Menu size={20} strokeWidth={1.5} />
        </UnstyledButton>
      )}

      {/* Overlay for mobile when expanded */}
      {isMobile && expanded && (
        <Overlay onClick={() => setExpanded(false)} opacity={0.3} color="#000" zIndex={99} />
      )}
      <div
        onMouseEnter={() => !isMobile && setExpanded(true)}
        onMouseLeave={() => !isMobile && setExpanded(false)}
        style={{
          width: isMobile ? (expanded ? '100vw' : 0) : expanded ? 220 : 60,
          transition: 'width 250ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          borderRight: isMobile ? 'none' : '1px solid var(--color-border-week)',
          overflow: 'hidden',
          flexShrink: 0,
          backgroundColor: 'var(--color-nav-topbar)',
          position: 'absolute',
          zIndex: 100,
          height: '100%',
        }}
      >
        <Stack gap={0} h="100%">
          <Stack
            gap={4}
            style={{
              flex: 1,
              padding: isMobile ? '16px' : '16px 9px 8px 9px',
              position: 'relative',
            }}
          >
            {/* Sliding indicator */}
            {activeIndex >= 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: `calc(${isMobile ? '16px' : '16px'} + ${activeIndex * itemHeight}px)`,
                  left: isMobile ? 16 : 9,
                  right: isMobile ? 16 : 9,
                  height: itemHeight - 4, // subtract gap
                  backgroundColor: '#fff',
                  border: '1px solid var(--color-border-week)',
                  borderRadius: 10,
                  transition: 'top 250ms ease-out',
                  zIndex: 0,
                }}
              />
            )}
            {navItems.map(item => {
              const isActive = activePath === item.path
              const isHovered = hoveredItem === item.path
              return (
                <Tooltip
                  key={item.path}
                  label={
                    <div>
                      <Text size="sm" fw={500}>
                        {item.label}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {item.description}
                      </Text>
                    </div>
                  }
                  position="right"
                  disabled={expanded}
                  transitionProps={{ duration: 150 }}
                  multiline
                  w={200}
                >
                  <UnstyledButton
                    onClick={() => handleNavClick(item.path)}
                    onMouseEnter={() => setHoveredItem(item.path)}
                    onMouseLeave={() => setHoveredItem(null)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '6px 10px',
                      borderRadius: 6,
                      backgroundColor:
                        isHovered && !isActive ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                      color: isActive || isHovered ? '#000' : 'var(--mantine-color-gray-7)',
                      position: 'relative',
                      zIndex: 1,
                      opacity: isActive || isHovered ? 1 : 0.85,
                      transition:
                        'background-color 200ms ease, opacity 200ms ease, color 200ms ease',
                    }}
                  >
                    <item.icon
                      size={18}
                      strokeWidth={isActive ? 2 : 1.5}
                      style={{ flexShrink: 0 }}
                    />
                    <Text
                      size="sm"
                      fw={500}
                      style={{
                        whiteSpace: 'nowrap',
                        opacity: expanded ? 1 : 0,
                        transform: expanded ? 'translateX(0)' : 'translateX(-10px)',
                        transition: expanded
                          ? 'opacity 150ms ease 80ms, transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1) 80ms'
                          : 'opacity 150ms ease, transform 150ms ease',
                      }}
                    >
                      {item.label}
                    </Text>
                  </UnstyledButton>
                </Tooltip>
              )
            })}
          </Stack>
        </Stack>
      </div>
    </>
  )
}
