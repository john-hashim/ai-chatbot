import { useState, useCallback } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { Stack, UnstyledButton, Tooltip, Text, Overlay } from '@mantine/core'
import {
  Sliders,
  Database,
  MessageSquareText,
  ChartLine,
  Rocket,
  Menu,
  Play,
  // Users,
  // Zap,
  CalendarDays,
  ChevronRight,
  ChevronLeft,
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
    icon: CalendarDays,
    label: 'Appointments',
    path: 'bookings',
    description: 'Appointments management',
  },
  {
    icon: ChartLine,
    label: 'Analytics',
    path: 'analytics',
    description: 'Check performance',
  },
  // {
  //   icon: Users,
  //   label: 'Contacts',
  //   path: 'contacts',
  //   description: 'Manage your chatbot contacts',
  // },
  // {
  //   icon: Zap,
  //   label: 'Automations',
  //   path: 'automations',
  //   description: 'Set up automated workflows',
  // },
  {
    icon: Rocket,
    label: 'Deploy',
    path: 'deploy',
    description: 'Publish your chatbot',
  },
]

// Static tooltip labels — extracted at module level so they are never recreated on re-render
const tooltipLabels: Record<string, React.ReactNode> = Object.fromEntries(
  navItems.map(item => [
    item.path,
    <div key={item.path}>
      <Text size="sm" fw={500}>
        {item.label}
      </Text>
      <Text size="xs" c="dimmed">
        {item.description}
      </Text>
    </div>,
  ])
)

const ITEM_HEIGHT = 36.3

interface ChatbotSidebarProps {
  pinned: boolean
  isMobile: boolean
  onPinnedChange: (v: boolean) => void
}

export const ChatbotSidebar: React.FC<ChatbotSidebarProps> = ({
  pinned,
  isMobile,
  onPinnedChange,
}) => {
  const [hovered, setHovered] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [buttonHovered, setButtonHovered] = useState(false)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const { chatbotId } = useParams()
  const { clearChatSessions } = useStore()

  const expanded = isMobile ? mobileOpen : pinned || hovered

  const pathSegments = location.pathname.split('/')
  const currentPath = pathSegments[pathSegments.length - 1]
  const activePath = currentPath === chatbotId ? 'playground' : currentPath
  const activeIndex = navItems.findIndex(item => item.path === activePath)

  // Sidebar width — buttonHovered no longer changes width (was causing self-referential jitter)
  const sidebarWidth = isMobile ? (expanded ? '100vw' : 0) : expanded ? 220 : 60

  // Pin button left tracks sidebar right edge
  const buttonLeft = expanded ? 226 : 66

  // Indicator position — fixed the dead isMobile ? '16px' : '16px' ternary
  const indicatorTop = `calc(16px + ${activeIndex * ITEM_HEIGHT}px)`

  // Stable sidebar hover handlers
  const handleSidebarEnter = useCallback(() => {
    if (!isMobile) setHovered(true)
  }, [isMobile])
  const handleSidebarLeave = useCallback(() => {
    if (!isMobile) setHovered(false)
  }, [isMobile])

  // Stable pin button handlers
  const handleButtonEnter = useCallback(() => setButtonHovered(true), [])
  const handleButtonLeave = useCallback(() => setButtonHovered(false), [])
  const handlePinToggle = useCallback(() => onPinnedChange(!pinned), [onPinnedChange, pinned])

  // Stable mobile handlers
  const handleMobileOpen = useCallback(() => setMobileOpen(true), [])
  const handleMobileClose = useCallback(() => setMobileOpen(false), [])

  // Single stable handler for all nav items via data-path attribute
  const handleNavItemClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const path = e.currentTarget.dataset.path!
      if (path !== 'chats') clearChatSessions()
      navigate(`/chatbot/${chatbotId}/${path}`)
      if (isMobile) setMobileOpen(false)
    },
    [clearChatSessions, navigate, chatbotId, isMobile]
  )

  const handleNavItemEnter = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    setHoveredItem(e.currentTarget.dataset.path!)
  }, [])

  const handleNavItemLeave = useCallback(() => setHoveredItem(null), [])

  return (
    <>
      {/* Mobile menu handle */}
      {isMobile && !mobileOpen && (
        <UnstyledButton
          onClick={handleMobileOpen}
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
      {isMobile && mobileOpen && (
        <Overlay onClick={handleMobileClose} opacity={0.3} color="#000" zIndex={99} />
      )}

      {/* Pin toggle button — desktop only, floats just outside the sidebar's right edge */}
      {!isMobile && (
        <Tooltip
          label={pinned ? 'Collapse' : 'Expand'}
          position="right"
          transitionProps={{ duration: 150 }}
        >
          <UnstyledButton
            onClick={handlePinToggle}
            onMouseEnter={handleButtonEnter}
            onMouseLeave={handleButtonLeave}
            style={{
              position: 'absolute',
              top: 0,
              left: buttonLeft,
              height: '100%',
              transition: 'left 400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
              zIndex: 101,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 20,
              color: 'var(--mantine-color-gray-5)',
            }}
          >
            {buttonHovered ? (
              pinned ? (
                <ChevronLeft size={20} strokeWidth={3} />
              ) : (
                <ChevronRight size={20} strokeWidth={3} />
              )
            ) : (
              <div
                style={{ width: 4, height: 20, borderRadius: 2, backgroundColor: 'currentColor' }}
              />
            )}
          </UnstyledButton>
        </Tooltip>
      )}

      <div
        onMouseEnter={handleSidebarEnter}
        onMouseLeave={handleSidebarLeave}
        style={{
          width: sidebarWidth,
          transition: 'width 400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          borderRight: isMobile ? 'none' : '1px solid var(--color-border-week)',
          overflow: 'hidden',
          flexShrink: 0,
          backgroundColor: 'var(--color-nav-topbar)',
          position: 'absolute',
          zIndex: 100,
          height: '100%',
          boxShadow: expanded ? '0 10px 15px -3px #0000001a, 0 4px 6px -4px #0000001a' : 'none',
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
                  top: indicatorTop,
                  left: isMobile ? 16 : 9,
                  right: isMobile ? 16 : 9,
                  height: ITEM_HEIGHT - 4,
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
                  label={tooltipLabels[item.path]}
                  position="right"
                  disabled={pinned}
                  transitionProps={{ duration: 150 }}
                  multiline
                  w={200}
                >
                  <UnstyledButton
                    data-path={item.path}
                    onClick={handleNavItemClick}
                    onMouseEnter={handleNavItemEnter}
                    onMouseLeave={handleNavItemLeave}
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
