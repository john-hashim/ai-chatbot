import { Logo } from '@/components/common/logo'
import { Tooltip } from '@mantine/core'
import { ArrowLeft, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export const ChatbotKnowledgeBaseSetup: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col h-screen">
      <div className="px-5 py-2 flex items-center justify-between">
        <Tooltip label="Go Back" position="bottom-start">
          <div
            className="p-1 hover:bg-icon-bg-hover rounded cursor-pointer"
            onClick={() => navigate('/landing')}
          >
            <ArrowLeft className="h-5 w-5 text-text-weak hover:text-icon-hover" />
          </div>
        </Tooltip>
        <Logo height={40} width={28} fontSize={25} logoIcon={false} />
        <Tooltip label="Close" position="bottom-end">
          <X
            className="h-5 w-5 text-text-weak hover:text-icon-hover cursor-pointer"
            onClick={() => navigate('/landing')}
          />
        </Tooltip>
      </div>
      <div className="lg:px-32 px-6 flex-1 pt-1 pb-15 flex flex-wrap">
        <div className="border flex-1 border-border-week lg:mt-0 rounded-2xl flex overflow-hidden">
          <div className="lg:w-1/2 w-full h-full border-r border-border-week lg:p-20 px-8 py-12"></div>
          <div className="w-1/2 h-full hidden lg:block bg-[radial-gradient(circle,#ebebeb_2px,#fafafa_0)] bg-size-[30px_30px]"></div>
        </div>
      </div>
    </div>
  )
}
