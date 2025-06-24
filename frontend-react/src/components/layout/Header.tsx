import React from 'react'
import { motion } from 'framer-motion'
import { useDispatch, useSelector } from 'react-redux'
import { 
  Bars3Icon, 
  UserCircleIcon, 
  BellIcon,
  MoonIcon,
  SunIcon 
} from '@heroicons/react/24/outline'
import { RootState } from '@/store/store'
import { toggleSidebar, setTheme } from '@/store/slices/uiSlice'
import { logout } from '@/store/slices/authSlice'
import { LiquidButton } from '../ui/LiquidButton'
import { StatusBadge } from '../ui/StatusBadge'

export const Header: React.FC = () => {
  const dispatch = useDispatch()
  const { user } = useSelector((state: RootState) => state.auth)
  const { currentStatus } = useSelector((state: RootState) => state.attendance)
  const { theme } = useSelector((state: RootState) => state.ui)

  const handleLogout = () => {
    dispatch(logout())
  }

  const toggleTheme = () => {
    dispatch(setTheme(theme === 'light' ? 'dark' : 'light'))
  }

  return (
    <motion.header 
      className="liquid-nav sticky top-0 z-30 px-6 py-4"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      <div className="flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <LiquidButton
            variant="ghost"
            size="sm"
            onClick={() => dispatch(toggleSidebar())}
            className="lg:hidden"
          >
            <Bars3Icon className="h-6 w-6" />
          </LiquidButton>
          
          <div className="hidden lg:block">
            <h1 className="text-2xl font-bold text-gradient-primary">
              タイムカード管理
            </h1>
          </div>
        </div>

        {/* Center - Status */}
        <div className="hidden sm:flex items-center space-x-4">
          <StatusBadge status={currentStatus} />
          <div className="text-sm text-slate-600">
            {new Date().toLocaleDateString('ja-JP', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long'
            })}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-3">
          {/* Theme toggle */}
          <LiquidButton
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="hidden sm:flex"
          >
            {theme === 'light' ? (
              <MoonIcon className="h-5 w-5" />
            ) : (
              <SunIcon className="h-5 w-5" />
            )}
          </LiquidButton>

          {/* Notifications */}
          <LiquidButton variant="ghost" size="sm">
            <BellIcon className="h-5 w-5" />
          </LiquidButton>

          {/* User menu */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:block text-right">
              <div className="text-sm font-medium text-slate-700">
                {user?.employee?.name || user?.username}
              </div>
              <div className="text-xs text-slate-500">
                {user?.employee?.department || '部署未設定'}
              </div>
            </div>
            
            <div className="relative">
              <LiquidButton variant="ghost" size="sm">
                <UserCircleIcon className="h-8 w-8 text-slate-600" />
              </LiquidButton>
            </div>
          </div>

          {/* Logout */}
          <LiquidButton
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="hidden sm:flex"
          >
            ログアウト
          </LiquidButton>
        </div>
      </div>
    </motion.header>
  )
}