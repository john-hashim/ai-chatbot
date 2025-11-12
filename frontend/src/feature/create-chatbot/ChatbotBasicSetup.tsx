import { Logo } from '@/components/common/logo'
import { ArrowLeft, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export const ChatbotBasicSetup: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col h-screen">
      <div className="px-5 py-2 flex items-center justify-between">
        <div
          className="p-1 hover:bg-icon-bg-hover rounded cursor-pointer"
          data-tooltip-id="global-tooltip"
          data-tooltip-content="Go Back"
          data-tooltip-place="bottom-start"
          onClick={() => navigate('/landing')}
        >
          <ArrowLeft className="h-5 w-5 text-text-weak hover:text-icon-hover" />
        </div>
        <Logo height={40} width={28} fontSize={25} logoIcon={false} />
        <X
          data-tooltip-id="global-tooltip"
          data-tooltip-content="Close"
          data-tooltip-place="bottom-end"
          className="h-5 w-5 text-text-weak hover:text-icon-hover cursor-pointer"
          onClick={() => navigate('/landing')}
        />
      </div>
      <div className="lg:px-32 px-3 flex-1 pt-5 pb-15 flex flex-wrap">
        <div className="border flex-1 border-border mt-4 lg:mt-0 rounded-2xl flex overflow-hidden">
          <div className="lg:w-1/2 w-full h-full border-r border-border"></div>
          <div className="w-1/2 h-full hidden lg:block bg-[radial-gradient(circle,_#ebebeb_2px,_#fafafa_0)] bg-[length:30px_30px]"></div>
        </div>
      </div>
    </div>
  )
}
