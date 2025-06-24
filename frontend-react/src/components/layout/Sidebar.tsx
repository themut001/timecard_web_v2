import React from 'react'
import { motion } from 'framer-motion'
import { useSelector, useDispatch } from 'react-redux'
import { NavLink, useLocation } from 'react-router-dom'
import {
  HomeIcon,
  ClockIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  UsersIcon,
  ChartBarIcon,
  CogIcon,
} from '@heroicons/react/24/outline'
import { RootState } from '@/store/store'
import { setSidebarOpen } from '@/store/slices/uiSlice'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  adminOnly?: boolean
}

const navigation: NavItem[] = [
  { name: 'ダッシュボード', href: '/', icon: HomeIcon },
  { name: '打刻', href: '/clock', icon: ClockIcon },
  { name: '勤怠履歴', href: '/attendance', icon: CalendarDaysIcon },
  { name: '申請', href: '/requests', icon: DocumentTextIcon },
  { name: '社員管理', href: '/admin/employees', icon: UsersIcon, adminOnly: true },
  { name: 'レポート', href: '/admin/reports', icon: ChartBarIcon, adminOnly: true },
  { name: '設定', href: '/settings', icon: CogIcon },
]

export const Sidebar: React.FC = () => {
  const location = useLocation()
  const dispatch = useDispatch()
  const { sidebarOpen } = useSelector((state: RootState) => state.ui)
  const { user } = useSelector((state: RootState) => state.auth)

  const filteredNavigation = navigation.filter(
    item => !item.adminOnly || user?.isAdmin
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.div
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col transition-all duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-48 lg:translate-x-0 lg:w-16'
        }`}
        initial={{ x: -256 }}
        animate={{ x: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        <div className="liquid-sidebar flex grow flex-col gap-y-5 overflow-y-auto px-6 py-4">
          {/* Logo */}
          <div className="flex h-16 shrink-0 items-center">
            <motion.div
              className="flex items-center space-x-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                <ClockIcon className="h-5 w-5 text-white" />
              </div>
              {sidebarOpen && (
                <span className="text-lg font-bold text-gradient-primary">
                  TimeCard
                </span>
              )}
            </motion.div>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-2">
              {filteredNavigation.map((item, index) => {
                const isActive = location.pathname === item.href
                return (
                  <motion.li
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <NavLink
                      to={item.href}
                      onClick={() => {
                        // Close sidebar on mobile when navigating
                        if (window.innerWidth < 1024) {
                          dispatch(setSidebarOpen(false))
                        }
                      }}
                      className={`group flex gap-x-3 rounded-liquid p-3 text-sm leading-6 font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-liquid-light'
                          : 'text-slate-700 hover:bg-white/50 hover:text-primary-700'
                      }`}
                    >
                      <item.icon
                        className={`h-6 w-6 shrink-0 transition-colors ${
                          isActive ? 'text-white' : 'text-slate-600 group-hover:text-primary-600'
                        }`}
                      />
                      {sidebarOpen && (
                        <span className="truncate">{item.name}</span>
                      )}
                    </NavLink>
                  </motion.li>
                )
              })}
            </ul>
          </nav>

          {/* User info at bottom */}
          {sidebarOpen && user && (
            <motion.div
              className="liquid-glass p-4 mt-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-accent-400 to-primary-500 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user.employee?.name?.[0] || user.username[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">
                    {user.employee?.name || user.username}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {user.employee?.department || '部署未設定'}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </>
  )
}