import React from 'react'
import { motion } from 'framer-motion'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  text?: string
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = '',
  text
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <motion.div
        className={`${sizeClasses[size]} border-2 border-primary-200 border-t-primary-600 rounded-full`}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear'
        }}
      />
      {text && (
        <motion.p 
          className="mt-2 text-sm text-slate-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {text}
        </motion.p>
      )}
    </div>
  )
}

export const FullPageLoader: React.FC<{ text?: string }> = ({ text = '読み込み中...' }) => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 flex items-center justify-center z-50">
      <div className="liquid-glass p-8 rounded-liquid text-center">
        <LoadingSpinner size="lg" text={text} />
      </div>
    </div>
  )
}

export const CardLoader: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`liquid-glass rounded-liquid p-6 animate-pulse ${className}`}>
      <div className="space-y-3">
        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
        <div className="h-4 bg-slate-200 rounded w-1/2"></div>
        <div className="h-4 bg-slate-200 rounded w-2/3"></div>
      </div>
    </div>
  )
}