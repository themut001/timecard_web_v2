import React from 'react'
import { motion } from 'framer-motion'

interface LiquidCardProps {
  children: React.ReactNode
  className?: string
  animate?: boolean
  hover?: boolean
  glow?: boolean
}

export const LiquidCard: React.FC<LiquidCardProps> = ({
  children,
  className = '',
  animate = false,
  hover = true,
  glow = false,
}) => {
  const baseClasses = 'liquid-glass'
  const hoverClasses = hover ? 'hover:shadow-liquid-heavy hover:scale-[1.02] transition-all duration-300' : ''
  const glowClasses = glow ? 'liquid-glow' : ''
  const animateClasses = animate ? 'liquid-float' : ''

  const CardComponent = animate ? motion.div : 'div'

  const motionProps = animate
    ? {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6, ease: 'easeOut' },
      }
    : {}

  return (
    <CardComponent
      className={`${baseClasses} ${hoverClasses} ${glowClasses} ${animateClasses} ${className}`}
      {...motionProps}
    >
      {children}
    </CardComponent>
  )
}

interface CardHeaderProps {
  children: React.ReactNode
  className?: string
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => {
  return (
    <div className={`px-6 py-4 border-b border-glass-border/50 ${className}`}>
      {children}
    </div>
  )
}

interface CardContentProps {
  children: React.ReactNode
  className?: string
}

export const CardContent: React.FC<CardContentProps> = ({ children, className = '' }) => {
  return <div className={`px-6 py-4 ${className}`}>{children}</div>
}

interface CardFooterProps {
  children: React.ReactNode
  className?: string
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, className = '' }) => {
  return (
    <div className={`px-6 py-4 border-t border-glass-border/50 ${className}`}>
      {children}
    </div>
  )
}