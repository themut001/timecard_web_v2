import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { addNotification } from '@/store/slices/uiSlice'

export interface NotificationOptions {
  title?: string
  body: string
  icon?: string
  tag?: string
  requireInteraction?: boolean
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
}

export const useNotifications = () => {
  const dispatch = useDispatch()

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const showNotification = (options: NotificationOptions) => {
    // Show in-app notification
    dispatch(addNotification({
      type: 'info',
      message: options.body,
    }))

    // Show browser notification if permission granted
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(options.title || 'タイムカード管理', {
        body: options.body,
        icon: options.icon || '/favicon.ico',
        tag: options.tag,
        requireInteraction: options.requireInteraction,
        // @ts-ignore - actions may not be supported in all browsers
        actions: options.actions,
      })

      // Auto close after 5 seconds
      setTimeout(() => {
        notification.close()
      }, 5000)

      return notification
    }
  }

  const showSuccessNotification = (message: string) => {
    dispatch(addNotification({
      type: 'success',
      message,
    }))
  }

  const showErrorNotification = (message: string) => {
    dispatch(addNotification({
      type: 'error',
      message,
    }))
  }

  const showWarningNotification = (message: string) => {
    dispatch(addNotification({
      type: 'warning',
      message,
    }))
  }

  const isSupported = 'Notification' in window
  const permission = isSupported ? Notification.permission : 'denied'

  return {
    showNotification,
    showSuccessNotification,
    showErrorNotification,
    showWarningNotification,
    isSupported,
    permission,
  }
}