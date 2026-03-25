import { useCallback, useMemo, useRef, useState } from 'react'
import { Logo } from '../common/logo'
import { LogOut, Check, ChevronsUpDown, Plus } from 'lucide-react'
import { Popover, Avatar, Divider } from '@mantine/core'
import { useNavigate, useLocation } from 'react-router-dom'
import { useChatbotStore, useUserStore } from '@/store'
import { authService } from '@/api/services/auth'
import { useApi } from '@/hooks/useApi'
import type { ApiResponse } from '@/types/api'

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/landing' },
  { label: 'Account Settings', path: '/account' },
  { label: 'Billing', path: '/billing' },
]

export const Header: React.FC = () => {
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [chatbotSwitcherOpen, setChatbotSwitcherOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const { logout, user } = useUserStore()
  const { clearChatbotState, currentChatbot, chatbots, getChatbots, setCurrentChatbot } =
    useChatbotStore()

  const chatbotsFetched = useRef(false)
  const { execute: executeLogout } = useApi<ApiResponse, []>(authService.logout)

  const onLogout = useCallback(async () => {
    setPopoverOpen(false)
    await executeLogout()
    clearChatbotState()
    logout()
  }, [executeLogout, clearChatbotState, logout])

  const handleNav = useCallback(
    (path: string) => {
      setPopoverOpen(false)
      const resolved = path === '/landing' ? '/chatbot/landing' : path
      if (location.pathname !== resolved) navigate(resolved)
    },
    [location.pathname, navigate]
  )

  const onWorkspaceClick = useCallback(() => {
    if (location.pathname !== '/chatbot/landing') navigate('/landing')
  }, [location.pathname, navigate])

  const handleChatbotSwitcherOpen = useCallback(
    async (open: boolean) => {
      setChatbotSwitcherOpen(open)
      if (open && !chatbotsFetched.current) {
        chatbotsFetched.current = true
        try {
          await getChatbots()
        } catch {
          // Allow retry on next open if fetch failed
          chatbotsFetched.current = false
        }
      }
    },
    [getChatbots]
  )

  const handleToggleSwitcher = useCallback(() => {
    handleChatbotSwitcherOpen(!chatbotSwitcherOpen)
  }, [handleChatbotSwitcherOpen, chatbotSwitcherOpen])

  const handleSwitchChatbot = useCallback(
    (chatbotId: string) => {
      if (chatbotId === currentChatbot?.id) {
        setChatbotSwitcherOpen(false)
        return
      }
      setChatbotSwitcherOpen(false)
      setCurrentChatbot(chatbotId)
      navigate(`/chatbot/${chatbotId}/playground`)
    },
    [currentChatbot?.id, setCurrentChatbot, navigate]
  )

  const handleCreateNew = useCallback(() => {
    setChatbotSwitcherOpen(false)
    navigate('/chatbot/new')
  }, [navigate])

  const initials = useMemo(() => {
    if (!user?.name) return '?'
    return user.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }, [user?.name])

  return (
    <div className="px-5 py-2 bg-nav-topbar flex items-center border-b border-b-border-week">
      <div className="flex items-center ml-3 min-w-0">
        <div className="hidden md:block shrink-0">
          <Logo height={25} width={30} logoIcon={true} />
        </div>
        {user?.name && (
          <div className="flex items-center text-sm min-w-0">
            <span className="hidden md:block text-gray-300 text-md font-semibold mx-4">/</span>
            <span
              onClick={onWorkspaceClick}
              className="text-text-primary font-semibold cursor-pointer truncate max-w-[150px] md:max-w-[200px]"
            >
              {user.name}'s workspace
            </span>
            {currentChatbot?.name && (
              <>
                <span className="text-gray-300 text-md font-semibold mx-2 md:mx-4">/</span>
                <span className="text-text-primary font-semibold truncate max-w-[100px] md:max-w-[200px]">
                  {currentChatbot.name}
                </span>
                <span className="ml-2 px-2 py-0.5 text-xs font-medium text-gray-500 bg-gray-100 border border-gray-300 rounded-full whitespace-nowrap">
                  Chatbot
                </span>
                <Popover
                  opened={chatbotSwitcherOpen}
                  onChange={handleChatbotSwitcherOpen}
                  position="bottom-start"
                  offset={8}
                  shadow="md"
                  width={220}
                  transitionProps={{ transition: 'pop', duration: 150 }}
                >
                  <Popover.Target>
                    <button
                      onClick={handleToggleSwitcher}
                      className="ml-1 p-0.5 rounded hover:bg-gray-100 cursor-pointer text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <ChevronsUpDown className="h-3.5 w-3.5" />
                    </button>
                  </Popover.Target>
                  <Popover.Dropdown className="py-2! px-1.5! rounded-xl! overflow-hidden">
                    <p className="px-2 pb-1.5 text-[11px] font-semibold text-text-weak uppercase tracking-wide">
                      Switch Chatbot
                    </p>
                    <div className="flex flex-col gap-0.5 max-h-60 overflow-y-auto">
                      {chatbots.length === 0 ? (
                        <p className="px-2 py-2 text-xs text-text-weak">No chatbots found</p>
                      ) : (
                        chatbots.map(chatbot => (
                          <button
                            key={chatbot.id}
                            onClick={() => handleSwitchChatbot(chatbot.id)}
                            className="menu-btn justify-between text-text-primary"
                          >
                            <span className="truncate text-text-primary text-sm">
                              {chatbot.name}
                            </span>
                            {currentChatbot.id === chatbot.id && (
                              <Check className="h-3.5 w-3.5 shrink-0 ml-2 text-brand" />
                            )}
                          </button>
                        ))
                      )}
                    </div>
                    <Divider my={8} />
                    <button className="menu-btn text-text-primary" onClick={handleCreateNew}>
                      <Plus className="h-3.5 w-3.5 shrink-0" />
                      Create new chatbot
                    </button>
                  </Popover.Dropdown>
                </Popover>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex-1" />

      <Popover
        opened={popoverOpen}
        onChange={setPopoverOpen}
        position="bottom-end"
        offset={8}
        shadow="md"
        width={220}
        transitionProps={{ transition: 'pop-top-right', duration: 180 }}
      >
        <Popover.Target>
          <Avatar
            src={user?.avatar}
            alt={user?.name}
            size={24}
            radius="xl"
            className="cursor-pointer"
            color="brand"
            imageProps={{ referrerPolicy: 'no-referrer' }}
            onClick={() => setPopoverOpen(o => !o)}
          >
            {initials}
          </Avatar>
        </Popover.Target>

        <Popover.Dropdown className="py-3! px-2! rounded-xl! overflow-hidden">
          <div className="px-2 pb-1">
            <p className="text-[12px] font-semibold text-text-primary leading-[1.3]">
              {user?.name}
            </p>
            <p className="text-[12px] text-text-weak mt-0.5 truncate">{user?.email}</p>
          </div>

          <Divider my={8} />

          <div className="flex flex-col gap-0.5">
            {NAV_ITEMS.map(({ label, path }) => (
              <button key={path} className="menu-btn" onClick={() => handleNav(path)}>
                {label}
              </button>
            ))}
          </div>

          <Divider my={8} />

          <button className="menu-btn menu-btn-danger" onClick={onLogout}>
            <LogOut className="h-3.5 w-3.5 shrink-0" />
            Sign out
          </button>
        </Popover.Dropdown>
      </Popover>
    </div>
  )
}
