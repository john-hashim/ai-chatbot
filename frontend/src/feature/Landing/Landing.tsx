import { Button } from '@/components/ui/button'
import { useUserStore } from '@/store/userStore'
import { format, getHours } from 'date-fns'
import { Plus } from 'lucide-react'

export const Landing: React.FC = () => {
  const day = format(new Date(), 'eeee')
  const date = format(new Date(), 'MMMM dd')
  const userStore = useUserStore()

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
      <div className="h-[50vh] mt-6 bg-background-dark-accent rounded-2xl flex items-center justify-center flex-col">
        <p className="text-s">Let’s get started! Create your first AI chatbot</p>
        <Button className="cursor-pointer mt-2">
          <Plus size={18} />
          Add New Chatbot
        </Button>
      </div>
    </div>
  )
}
