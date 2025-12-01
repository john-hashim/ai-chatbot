import { Logo } from '../common/logo'
import {
  Menu,
  LogOut,
  // Info
} from 'lucide-react'
import { Tooltip } from '@mantine/core'
import { useStore } from '@/store'
import { authService } from '@/api/services/auth'
import { useApi } from '@/hooks/useApi'
import type { ApiResponse } from '@/types/api'

export const Header: React.FC = () => {
  const clearStore = useStore(state => state.logout)

  const { execute: excuteLogout } = useApi<ApiResponse, []>(authService.logout)

  const onLogout = async () => {
    await excuteLogout()
    clearStore()
  }
  return (
    <div className="px-5 py-2 bg-nav-topbar flex items-center">
      <Tooltip label="Expand Sidebar" position="bottom-start">
        <div className="p-1 hover:bg-icon-bg-hover rounded cursor-pointer">
          <Menu className="h-5 w-5 text-text-weak hover:text-icon-hover" />
        </div>
      </Tooltip>
      <div className="flex items-center lg:ml-10 ml-3">
        <Logo height={25} width={30} logoIcon={false} />
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
