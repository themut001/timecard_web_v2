import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDispatch, useSelector } from 'react-redux'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { removeNotification } from '@/store/slices/uiSlice'
import { RootState } from '@/store/store'

interface NotificationItemProps {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  id,
  type,
  message,
  duration = 5000,
}) => {
  const dispatch = useDispatch()

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(removeNotification(id))
    }, duration)

    return () => clearTimeout(timer)
  }, [id, duration, dispatch])

  const typeConfig = {
    success: {
      bgClass: 'bg-gradient-to-r from-green-400 to-emerald-500',
      icon: '✓',
    },
    error: {
      bgClass: 'bg-gradient-to-r from-red-400 to-red-500',
      icon: '✕',
    },
    warning: {
      bgClass: 'bg-gradient-to-r from-yellow-400 to-orange-500',
      icon: '⚠',
    },
    info: {
      bgClass: 'bg-gradient-to-r from-blue-400 to-blue-500',
      icon: 'ℹ',
    },
  }

  const config = typeConfig[type]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.5 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className={`liquid-glass ${config.bgClass} text-white p-4 rounded-liquid shadow-liquid-heavy max-w-sm w-full`}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <span className="text-lg">{config.icon}</span>
        </div>
        <div className="ml-3 w-0 flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            onClick={() => dispatch(removeNotification(id))}
            className="inline-flex text-white hover:text-gray-200 focus:outline-none focus:text-gray-200 transition-colors duration-200"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export const NotificationContainer: React.FC = () => {
  const notifications = useSelector((state: RootState) => state.ui.notifications)

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence mode="popLayout">
        {notifications.map((notification) => (
          <NotificationItem key={notification.id} {...notification} />
        ))}
      </AnimatePresence>
    </div>
  )
}