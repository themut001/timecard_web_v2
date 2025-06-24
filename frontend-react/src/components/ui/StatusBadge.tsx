import React from 'react'
import { motion } from 'framer-motion'

interface StatusBadgeProps {
  status: 'online' | 'offline' | 'break' | 'working'
  pulse?: boolean
  className?: string
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  pulse = true,
  className = '',
}) => {
  const statusConfig = {
    online: {
      label: '出勤中',
      classes: 'status-online',
      icon: '●',
    },
    working: {
      label: '勤務中',
      classes: 'status-online',
      icon: '●',
    },
    offline: {
      label: '退勤済',
      classes: 'status-offline',
      icon: '●',
    },
    break: {
      label: '休憩中',
      classes: 'status-break',
      icon: '●',
    },
  }

  const config = statusConfig[status]

  return (
    <motion.div
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.classes} ${pulse ? 'animate-pulse' : ''} ${className}`}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </motion.div>
  )
}