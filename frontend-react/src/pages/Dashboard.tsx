import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useDispatch, useSelector } from 'react-redux'
import { 
  ClockIcon, 
  CalendarDaysIcon, 
  ChartBarIcon,
  UserGroupIcon 
} from '@heroicons/react/24/outline'
import { RootState, AppDispatch } from '@/store/store'
import { getTodayRecord, getRecentRecords } from '@/store/slices/attendanceSlice'
import { LiquidCard, CardHeader, CardContent } from '@/components/ui/LiquidCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { LiquidButton } from '@/components/ui/LiquidButton'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

const StatCard: React.FC<{
  title: string
  value: string
  subtitle?: string
  icon: React.ComponentType<{ className?: string }>
  gradient: string
  index: number
}> = ({ title, value, subtitle, icon: Icon, gradient, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.6 }}
    >
      <LiquidCard className="h-full" hover glow>
        <CardContent className="flex items-center space-x-4">
          <div className={`p-3 rounded-liquid ${gradient}`}>
            <Icon className="h-8 w-8 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
            <p className="text-sm font-medium text-slate-600">{title}</p>
            {subtitle && (
              <p className="text-xs text-slate-500">{subtitle}</p>
            )}
          </div>
        </CardContent>
      </LiquidCard>
    </motion.div>
  )
}

export const Dashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { user } = useSelector((state: RootState) => state.auth)
  const { todayRecord, recentRecords, currentStatus } = useSelector((state: RootState) => state.attendance)

  useEffect(() => {
    dispatch(getTodayRecord())
    dispatch(getRecentRecords())
  }, [dispatch])

  const formatTime = (time: string) => {
    return format(new Date(time), 'HH:mm', { locale: ja })
  }

  const getCurrentTimeMessage = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'おはようございます'
    if (hour < 18) return 'お疲れ様です'
    return 'お疲れ様でした'
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <LiquidCard className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white" animate>
          <CardContent className="py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  {getCurrentTimeMessage()}、{user?.employee?.name || user?.username}さん
                </h1>
                <p className="text-primary-100 mb-4">
                  {format(new Date(), 'yyyy年MM月dd日(EEEE)', { locale: ja })}
                </p>
                <StatusBadge status={currentStatus} className="bg-white/20" />
              </div>
              <div className="hidden md:block">
                <div className="text-right">
                  <div className="text-4xl font-bold text-white">
                    {format(new Date(), 'HH:mm')}
                  </div>
                  <div className="text-white/80 font-medium">
                    現在時刻
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </LiquidCard>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="本日の勤務時間"
          value={todayRecord?.totalHours ? `${todayRecord.totalHours.toFixed(1)}時間` : '0.0時間'}
          subtitle={todayRecord?.clockIn ? `${formatTime(todayRecord.clockIn)}〜` : '未出勤'}
          icon={ClockIcon}
          gradient="bg-gradient-to-r from-blue-500 to-blue-600"
          index={0}
        />
        <StatCard
          title="今月の出勤日数"
          value="22日"
          subtitle="残り6日"
          icon={CalendarDaysIcon}
          gradient="bg-gradient-to-r from-green-500 to-green-600"
          index={1}
        />
        <StatCard
          title="今月の勤務時間"
          value="176.5時間"
          subtitle="目標: 160時間"
          icon={ChartBarIcon}
          gradient="bg-gradient-to-r from-purple-500 to-purple-600"
          index={2}
        />
        <StatCard
          title="現在のステータス"
          value={currentStatus === 'working' ? '勤務中' : currentStatus === 'break' ? '休憩中' : '退勤済'}
          subtitle={todayRecord?.clockIn ? `${formatTime(todayRecord.clockIn)}〜` : ''}
          icon={UserGroupIcon}
          gradient="bg-gradient-to-r from-orange-500 to-orange-600"
          index={3}
        />
      </div>

      {/* Today's Activity and Recent Records */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Activity */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <LiquidCard>
            <CardHeader>
              <h3 className="text-lg font-semibold text-slate-800">本日の活動</h3>
            </CardHeader>
            <CardContent>
              {todayRecord ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-glass-border/50">
                    <div className="flex items-center space-x-3">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      <span className="font-medium">出勤</span>
                    </div>
                    <span className="text-slate-600">{formatTime(todayRecord.clockIn!)}</span>
                  </div>
                  {todayRecord.clockOut && (
                    <div className="flex items-center justify-between py-3 border-b border-glass-border/50">
                      <div className="flex items-center space-x-3">
                        <div className="h-2 w-2 rounded-full bg-red-500"></div>
                        <span className="font-medium">退勤</span>
                      </div>
                      <span className="text-slate-600">{formatTime(todayRecord.clockOut)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center space-x-3">
                      <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                      <span className="font-medium">勤務時間</span>
                    </div>
                    <span className="text-slate-600 font-semibold">
                      {todayRecord.totalHours.toFixed(1)}時間
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <ClockIcon className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">まだ出勤していません</p>
                  <LiquidButton
                    variant="primary"
                    size="sm"
                    className="mt-4"
                    onClick={() => window.location.href = '/clock'}
                  >
                    出勤打刻へ
                  </LiquidButton>
                </div>
              )}
            </CardContent>
          </LiquidCard>
        </motion.div>

        {/* Recent Records */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <LiquidCard>
            <CardHeader>
              <h3 className="text-lg font-semibold text-slate-800">最近の勤怠記録</h3>
            </CardHeader>
            <CardContent>
              {recentRecords.length > 0 ? (
                <div className="space-y-3">
                  {recentRecords.slice(0, 5).map((record, index) => (
                    <div key={record.id} className="flex items-center justify-between py-2 border-b border-glass-border/30 last:border-b-0">
                      <div>
                        <div className="font-medium text-slate-800">
                          {format(new Date(record.date), 'MM/dd(EEE)', { locale: ja })}
                        </div>
                        <div className="text-sm text-slate-500">
                          {record.clockIn && formatTime(record.clockIn)} 〜 {record.clockOut && formatTime(record.clockOut)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-slate-700">
                          {record.totalHours.toFixed(1)}h
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-full ${
                          record.totalHours >= 8 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {record.totalHours >= 8 ? '標準' : '短時間'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CalendarDaysIcon className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">勤怠記録がありません</p>
                </div>
              )}
            </CardContent>
          </LiquidCard>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
      >
        <LiquidCard>
          <CardHeader>
            <h3 className="text-lg font-semibold text-slate-800">クイックアクション</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <LiquidButton
                variant="primary"
                className="w-full"
                onClick={() => window.location.href = '/clock'}
              >
                <ClockIcon className="h-5 w-5 mr-2" />
                打刻
              </LiquidButton>
              <LiquidButton
                variant="secondary"
                className="w-full"
                onClick={() => window.location.href = '/attendance'}
              >
                <CalendarDaysIcon className="h-5 w-5 mr-2" />
                勤怠履歴
              </LiquidButton>
              <LiquidButton
                variant="outline"
                className="w-full"
                onClick={() => window.location.href = '/requests'}
              >
                <ChartBarIcon className="h-5 w-5 mr-2" />
                申請
              </LiquidButton>
            </div>
          </CardContent>
        </LiquidCard>
      </motion.div>
    </div>
  )
}