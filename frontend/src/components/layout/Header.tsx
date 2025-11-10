import { Logo } from '../common/logo'
import { Menu, Info } from 'lucide-react'

export const Header: React.FC = () => {
  return (
    <div className="px-5 py-2 bg-nav-topbar flex items-center">
      <div
        className="p-1 hover:bg-icon-bg-hover rounded cursor-pointer"
        data-tooltip-id="global-tooltip"
        data-tooltip-content="Expand Sidebar"
        data-tooltip-place="bottom-start"
      >
        <Menu className="h-5 w-5 text-text-weak hover:text-icon-hover" />
      </div>
      <div className="flex items-center lg:ml-10 ml-3">
        <Logo height={20} width={20} />
        <span className="text-xl font-semibold mb-1 ml-1">Lua</span>
      </div>
      <div className="flex-1"></div>
      <Info
        data-tooltip-id="global-tooltip"
        data-tooltip-content="Help with Lua"
        data-tooltip-place="bottom-end"
        className="h-5 w-5 text-text-weak hover:text-icon-hover cursor-pointer"
      />
    </div>
  )
}
