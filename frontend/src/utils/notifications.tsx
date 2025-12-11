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

interface LoadingNotificationController {
  success: (message: string, title?: string) => void
  error: (message: string, title?: string) => void
  update: (props: { loading?: boolean; message: string; title?: string; color?: string }) => void
}

export const showLoadingNotification = (
  title: string,
  message: string
): LoadingNotificationController => {
  const id = notifications.show({
    loading: true,
    title,
    message,
    autoClose: false,
    withCloseButton: false,
  })

  return {
    success: (successMessage: string, successTitle: string = 'Success') => {
      notifications.update({
        id,
        color: 'teal',
        title: successTitle,
        message: successMessage,
        icon: <CircleCheck color="#58a182" size={24} />,
        loading: false,
        autoClose: 4000,
      })
    },
    error: (errorMessage: string, errorTitle: string = 'Error') => {
      notifications.update({
        id,
        color: 'red',
        title: errorTitle,
        message: errorMessage,
        icon: <CircleAlert color="#c72027" size={24} />,
        loading: false,
        autoClose: 4000,
      })
    },
    update: props => {
      notifications.update({
        id,
        ...props,
      })
    },
  }
}

export const withLoadingNotification = async <T,>(
  promise: Promise<T>,
  config: {
    loading: { title: string; message: string }
    success: { title?: string; message: string }
    error: { title?: string; message: string }
  }
): Promise<T> => {
  const notification = showLoadingNotification(config.loading.title, config.loading.message)

  try {
    const result = await promise
    notification.success(config.success.message, config.success.title)
    return result
  } catch (error) {
    notification.error(config.error.message, config.error.title)
    throw error
  }
}
