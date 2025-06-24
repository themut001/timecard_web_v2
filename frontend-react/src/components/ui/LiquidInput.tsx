import React, { forwardRef } from 'react'
import { motion } from 'framer-motion'

interface LiquidInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  className?: string
  containerClassName?: string
}

export const LiquidInput = forwardRef<HTMLInputElement, LiquidInputProps>(
  ({ label, error, helperText, className = '', containerClassName = '', ...props }, ref) => {
    return (
      <motion.div
        className={`space-y-2 ${containerClassName}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {label && (
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`liquid-input ${error ? 'border-red-300 focus:ring-red-400/50' : ''} ${className}`}
          {...props}
        />
        {error && (
          <motion.p
            className="text-sm text-red-600"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            {error}
          </motion.p>
        )}
        {helperText && !error && (
          <p className="text-sm text-slate-500">{helperText}</p>
        )}
      </motion.div>
    )
  }
)

LiquidInput.displayName = 'LiquidInput'