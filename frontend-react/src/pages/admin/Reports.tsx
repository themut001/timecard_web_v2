import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ChartBarIcon,
  DocumentArrowDownIcon,
  CalendarDaysIcon,
  ClockIcon,
  UsersIcon,
  TrendingUpIcon,
  TrendingDownIcon,
} from '@heroicons/react/24/outline'
import { LiquidCard, CardHeader, CardContent } from '@/components/ui/LiquidCard'
import { LiquidButton } from '@/components/ui/LiquidButton'
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'
import { ja } from 'date-fns/locale'

interface ReportData {
  totalEmployees: number
  presentToday: number
  averageWorkHours: number
  overtimeHours: number
  monthlyTrend: number
  departmentStats: {
    name: string
    employees: number
    averageHours: number
    color: string
  }[]
  dailyAttendance: {
    date: string
    present: number
    absent: number
    late: number
  }[]
}

const StatCard: React.FC<{
  title: string
  value: string | number
  subtitle?: string
  trend?: number
  icon: React.ComponentType<{ className?: string }>
  color: string
}> = ({ title, value, subtitle, trend, icon: Icon, color }) => {
  return (
    <LiquidCard className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">{title}</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
            {subtitle && (
              <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`p-3 rounded-liquid ${color}`}>
            <Icon className="h-8 w-8 text-white" />
          </div>
        </div>
        {trend !== undefined && (
          <div className="mt-4 flex items-center">
            {trend >= 0 ? (
              <TrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
            ) : (
              <TrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
            )}
            <span
              className={`text-sm font-medium ${
                trend >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {trend >= 0 ? '+' : ''}{trend}%
            </span>
            <span className="text-sm text-slate-500 ml-1">前月比</span>
          </div>
        )}
      </CardContent>
    </LiquidCard>
  )
}

const DepartmentChart: React.FC<{ data: ReportData['departmentStats'] }> = ({ data }) => {
  const maxHours = Math.max(...data.map(d => d.averageHours))
  
  return (
    <div className="space-y-4">
      {data.map((dept, index) => (
        <motion.div
          key={dept.name}
          className="space-y-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-900">{dept.name}</span>
            <span className="text-sm text-slate-600">
              {dept.averageHours.toFixed(1)}時間 ({dept.employees}人)
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full ${dept.color} transition-all duration-500`}
              style={{ width: `${(dept.averageHours / maxHours) * 100}%` }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  )
}

const AttendanceChart: React.FC<{ data: ReportData['dailyAttendance'] }> = ({ data }) => {
  const maxValue = Math.max(...data.map(d => d.present + d.absent + d.late))
  
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4 text-sm">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-2" />
          出勤
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2" />
          遅刻
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 rounded-full mr-2" />
          欠勤
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-2">
        {data.map((day, index) => {
          const total = day.present + day.absent + day.late
          const presentPercent = (day.present / total) * 100
          const latePercent = (day.late / total) * 100
          const absentPercent = (day.absent / total) * 100
          
          return (
            <motion.div
              key={day.date}
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="text-xs text-slate-600 mb-2">
                {format(new Date(day.date), 'MM/dd')}
              </div>
              <div className="w-full h-32 bg-slate-200 rounded-lg relative overflow-hidden">
                <div
                  className="absolute bottom-0 w-full bg-green-500 transition-all duration-500"
                  style={{ height: `${presentPercent}%` }}
                />
                <div
                  className="absolute bottom-0 w-full bg-yellow-500 transition-all duration-500"
                  style={{ 
                    height: `${latePercent + absentPercent}%`,
                    bottom: `${presentPercent}%`
                  }}
                />
                <div
                  className="absolute bottom-0 w-full bg-red-500 transition-all duration-500"
                  style={{ 
                    height: `${absentPercent}%`,
                    bottom: `${presentPercent + latePercent}%`
                  }}
                />
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {total}人
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

export const AdminReports: React.FC = () => {
  const [dateRange, setDateRange] = useState('thisMonth')
  
  // Mock data
  const mockData: ReportData = {
    totalEmployees: 25,
    presentToday: 22,
    averageWorkHours: 8.2,
    overtimeHours: 125.5,
    monthlyTrend: 5.2,
    departmentStats: [
      { name: '開発部', employees: 8, averageHours: 8.5, color: 'bg-blue-500' },
      { name: '営業部', employees: 6, averageHours: 8.1, color: 'bg-green-500' },
      { name: '総務部', employees: 4, averageHours: 7.8, color: 'bg-purple-500' },
      { name: '人事部', employees: 3, averageHours: 8.0, color: 'bg-orange-500' },
      { name: 'マーケティング部', employees: 4, averageHours: 8.3, color: 'bg-pink-500' },
    ],
    dailyAttendance: Array.from({ length: 7 }, (_, i) => ({
      date: format(subDays(new Date(), 6 - i), 'yyyy-MM-dd'),
      present: Math.floor(Math.random() * 5) + 18,
      absent: Math.floor(Math.random() * 3),
      late: Math.floor(Math.random() * 4),
    })),
  }

  const dateRangeOptions = [
    { value: 'thisWeek', label: '今週' },
    { value: 'thisMonth', label: '今月' },
    { value: 'lastMonth', label: '先月' },
    { value: 'thisQuarter', label: '今四半期' },
  ]

  const handleExport = (type: 'csv' | 'pdf') => {
    console.log(`Exporting ${type} report...`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">レポート・分析</h1>
          <p className="text-slate-600 mt-1">勤怠データの統計と分析</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-liquid bg-white text-slate-900"
          >
            {dateRangeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <LiquidButton
            variant="outline"
            size="sm"
            onClick={() => handleExport('csv')}
          >
            <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
            CSV
          </LiquidButton>
          <LiquidButton
            variant="outline"
            size="sm"
            onClick={() => handleExport('pdf')}
          >
            <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
            PDF
          </LiquidButton>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="総社員数"
          value={mockData.totalEmployees}
          subtitle="在職中の社員"
          icon={UsersIcon}
          color="bg-blue-500"
        />
        <StatCard
          title="本日の出勤率"
          value={`${Math.round((mockData.presentToday / mockData.totalEmployees) * 100)}%`}
          subtitle={`${mockData.presentToday}/${mockData.totalEmployees}人`}
          trend={2.1}
          icon={CalendarDaysIcon}
          color="bg-green-500"
        />
        <StatCard
          title="平均勤務時間"
          value={`${mockData.averageWorkHours}h`}
          subtitle="1日あたり"
          trend={mockData.monthlyTrend}
          icon={ClockIcon}
          color="bg-purple-500"
        />
        <StatCard
          title="今月の残業時間"
          value={`${mockData.overtimeHours}h`}
          subtitle="全社合計"
          trend={-8.3}
          icon={ChartBarIcon}
          color="bg-orange-500"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Stats */}
        <LiquidCard>
          <CardHeader>
            <h3 className="text-xl font-semibold text-slate-900">部署別平均勤務時間</h3>
          </CardHeader>
          <CardContent>
            <DepartmentChart data={mockData.departmentStats} />
          </CardContent>
        </LiquidCard>

        {/* Daily Attendance */}
        <LiquidCard>
          <CardHeader>
            <h3 className="text-xl font-semibold text-slate-900">週間出勤状況</h3>
          </CardHeader>
          <CardContent>
            <AttendanceChart data={mockData.dailyAttendance} />
          </CardContent>
        </LiquidCard>
      </div>

      {/* Detailed Reports */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <LiquidCard className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <div className="h-12 w-12 bg-blue-100 rounded-liquid flex items-center justify-center mx-auto mb-4">
              <UsersIcon className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">社員別勤怠レポート</h3>
            <p className="text-sm text-slate-600 mb-4">個別の勤怠記録と統計</p>
            <LiquidButton variant="outline" size="sm" className="w-full">
              詳細を表示
            </LiquidButton>
          </CardContent>
        </LiquidCard>

        <LiquidCard className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <div className="h-12 w-12 bg-green-100 rounded-liquid flex items-center justify-center mx-auto mb-4">
              <ChartBarIcon className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">残業分析レポート</h3>
            <p className="text-sm text-slate-600 mb-4">残業時間の傾向と分析</p>
            <LiquidButton variant="outline" size="sm" className="w-full">
              詳細を表示
            </LiquidButton>
          </CardContent>
        </LiquidCard>

        <LiquidCard className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <div className="h-12 w-12 bg-purple-100 rounded-liquid flex items-center justify-center mx-auto mb-4">
              <CalendarDaysIcon className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">有給取得状況</h3>
            <p className="text-sm text-slate-600 mb-4">有給休暇の利用実績</p>
            <LiquidButton variant="outline" size="sm" className="w-full">
              詳細を表示
            </LiquidButton>
          </CardContent>
        </LiquidCard>
      </div>

      {/* Recent Activity */}
      <LiquidCard>
        <CardHeader>
          <h3 className="text-xl font-semibold text-slate-900">最近の活動</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { time: '9:15', user: '田中太郎', action: '出勤打刻', status: 'late' },
              { time: '9:00', user: '佐藤花子', action: '出勤打刻', status: 'normal' },
              { time: '8:45', user: '鈴木次郎', action: '出勤打刻', status: 'early' },
              { time: '8:30', user: '山田三郎', action: '出勤打刻', status: 'normal' },
            ].map((activity, index) => (
              <motion.div
                key={index}
                className="flex items-center justify-between py-2 border-b border-slate-100 last:border-b-0"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center space-x-3">
                  <div className="text-sm font-medium text-slate-600">
                    {activity.time}
                  </div>
                  <div className="text-sm font-medium text-slate-900">
                    {activity.user}
                  </div>
                  <div className="text-sm text-slate-600">
                    {activity.action}
                  </div>
                </div>
                <div>
                  {activity.status === 'late' && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                      遅刻
                    </span>
                  )}
                  {activity.status === 'early' && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                      早出
                    </span>
                  )}
                  {activity.status === 'normal' && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                      正常
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </LiquidCard>
    </div>
  )
}