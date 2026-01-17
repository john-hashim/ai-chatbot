import { Logo } from '../common/logo'
import { LogOut } from 'lucide-react'
import { Tooltip } from '@mantine/core'
import { useNavigate } from 'react-router-dom'
import { useChatbotStore, useUserStore } from '@/store'
import { authService } from '@/api/services/auth'
import { useApi } from '@/hooks/useApi'
import type { ApiResponse } from '@/types/api'

export const Header: React.FC = () => {
  const navigate = useNavigate()
  const { logout, user } = useUserStore()
  const { clearChatbotState, currentChatbot } = useChatbotStore()
  const { execute: excuteLogout } = useApi<ApiResponse, []>(authService.logout)

  const onLogout = async () => {
    await excuteLogout()
    clearChatbotState()
    logout()
  }
  return (
    <div className="px-5 py-2 bg-nav-topbar flex items-center">
      <div className="flex items-center ml-3 min-w-0">
        <div className="hidden md:block shrink-0">
          <Logo height={25} width={30} logoIcon={true} />
        </div>
        {user?.name && (
          <div className="flex items-center text-sm min-w-0">
            <span className="hidden md:block text-gray-300 text-md font-semibold mx-4">/</span>
            <span
              onClick={() => navigate('/landing')}
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
              </>
            )}
          </div>
        )}
      </div>
      <div className="flex-1"></div>
      <Tooltip label="Logout" position="bottom-end">
        {/* <Info className="h-5 w-5 text-text-weak hover:text-icon-hover cursor-pointer" /> */}
        <LogOut
          onClick={() => onLogout()}
          className="h-5 w-5 text-text-weak hover:text-icon-hover cursor-pointer"
        />
      </Tooltip>
    </div>
  )
}
