import { ChatbotSkeleton } from '@/components/common/ChatbotSkeleton'
import { Button } from '@/components/ui/button'
import { useUserStore } from '@/store/userStore'
import { format, getHours } from 'date-fns'
import { Plus, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export const Landing: React.FC = () => {
  const day = format(new Date(), 'eeee')
  const date = format(new Date(), 'MMMM dd')
  const userStore = useUserStore()
  const navigate = useNavigate()

  const firstName = userStore.user?.name.split(' ')[0]
  const formattedFirstName = firstName
    ? firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase()
    : ''

  const currentHour = getHours(new Date())
  let greeting = 'Good evening'
  if (currentHour >= 5 && currentHour < 12) {
    greeting = 'Good morning'
  } else if (currentHour >= 12 && currentHour < 18) {
    greeting = 'Good afternoon'
  }

  return (
    <div className="px-5 py-6 lg:px-40 border-t border-t-border-strong">
      <div className="text-sm font-medium">
        <span>{day}</span>, <span>{date}</span>
      </div>
      <div className="text-3xl mt-2">
        <span>
          {greeting}, {formattedFirstName}
        </span>
      </div>
      <div className="h-[50vh] mt-6 flex flex-wrap">
        <div className="border border-purple-strong bg-purple-week cursor pointer hover:bg-purple-strong sm:w-full lg:w-1/4 lg:mr-6 h-full rounded-2xl flex items-center justify-center flex-col p-6 overflow-visible">
          <div className="w-32 aspect-[375/667] mb-4 shadow-[0_0_18px_0_var(--color-purple-glow)] rounded-2xl overflow-hidden bg-[#F8F9FA]">
            <ChatbotSkeleton />
          </div>
          <h3 className="text-lg font-semibold text-center mb-2">Build your first AI chatbot</h3>
          <p className="text-sm text-center text-gray-600">
            Connect your data, choose your tone, and go live in minutes
          </p>
        </div>

        <div className="border h-full flex-1 border-border mt-4 lg:mt-0 rounded-2xl flex items-center justify-center flex-col">
          <TrendingUp size={50} className="mb-1" />
          <p className="text-s">Let’s get started! Create your first AI chatbot</p>
          <Button className="cursor-pointer mt-2" onClick={() => navigate('/new')}>
            <Plus size={18} />
            Add New Chatbot
          </Button>
        </div>
      </div>
    </div>
  )
}
