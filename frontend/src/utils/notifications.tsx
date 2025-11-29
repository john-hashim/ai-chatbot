import { notifications } from '@mantine/notifications'
import { CircleAlert, CircleCheck } from 'lucide-react'

export const showNotification = (type: 'success' | 'error', message: string) => {
  notifications.show({
    message,
    className: type,
    icon:
      type === 'success' ? (
        <CircleCheck color="#58a182" size={18} />
      ) : (
        <CircleAlert color="#c72027" size={18} />
      ),
  })
}
