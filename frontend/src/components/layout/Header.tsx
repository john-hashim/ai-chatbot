import { Logo } from '../common/logo'
import { Menu, Info } from 'lucide-react'
import { Tooltip } from '@mantine/core'

export const Header: React.FC = () => {
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
      <Tooltip label="Help with Lua" position="bottom-end">
        <Info className="h-5 w-5 text-text-weak hover:text-icon-hover cursor-pointer" />
      </Tooltip>
    </div>
  )
}
