import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useDispatch, useSelector } from 'react-redux'
import Calendar from 'react-calendar'
import {
  CalendarDaysIcon,
  ChartBarIcon,
  DocumentArrowDownIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { RootState, AppDispatch } from '@/store/store'
import { getMonthlyRecords } from '@/store/slices/attendanceSlice'
import { LiquidCard, CardHeader, CardContent } from '@/components/ui/LiquidCard'
import { LiquidButton } from '@/components/ui/LiquidButton'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns'
import { ja } from 'date-fns/locale'
import 'react-calendar/dist/Calendar.css'

interface AttendanceRecord {
  id: number
  date: string
  clockIn?: string
  clockOut?: string
  breakTime: number
  totalHours: number
  status: 'complete' | 'incomplete' | 'holiday'
}

const AttendanceTable: React.FC<{ records: AttendanceRecord[] }> = ({ records }) => {
  const formatTime = (time?: string) => {
    return time ? format(new Date(time), 'HH:mm') : '--:--'
  }

  const getStatusBadge = (record: AttendanceRecord) => {
    if (!record.clockIn) {
      return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">未出勤</span>
    }
    if (!record.clockOut) {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">勤務中</span>
    }
    if (record.totalHours < 8) {
      return <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">短時間</span>
    }
    return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">完了</span>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-3 px-4 font-semibold text-slate-900">日付</th>
            <th className="text-left py-3 px-4 font-semibold text-slate-900">出勤</th>
            <th className="text-left py-3 px-4 font-semibold text-slate-900">退勤</th>
            <th className="text-left py-3 px-4 font-semibold text-slate-900">休憩</th>
            <th className="text-left py-3 px-4 font-semibold text-slate-900">勤務時間</th>
            <th className="text-left py-3 px-4 font-semibold text-slate-900">状態</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record, index) => (
            <motion.tr
              key={record.id}
              className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <td className="py-3 px-4 text-slate-900 font-medium">
                {format(new Date(record.date), 'MM/dd(EEE)', { locale: ja })}
              </td>
              <td className="py-3 px-4 text-slate-700">{formatTime(record.clockIn)}</td>
              <td className="py-3 px-4 text-slate-700">{formatTime(record.clockOut)}</td>
              <td className="py-3 px-4 text-slate-700">{record.breakTime}分</td>
              <td className="py-3 px-4 text-slate-900 font-semibold">
                {record.totalHours.toFixed(1)}時間
              </td>
              <td className="py-3 px-4">{getStatusBadge(record)}</td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const AttendanceCalendar: React.FC<{ 
  selectedDate: Date
  onDateChange: (date: Date) => void
  records: AttendanceRecord[]
}> = ({ selectedDate, onDateChange, records }) => {
  const getTileContent = ({ date }: { date: Date }) => {
    const record = records.find(r => isSameDay(new Date(r.date), date))
    if (!record) return null

    if (!record.clockIn) {
      return <div className="w-2 h-2 bg-red-400 rounded-full mx-auto mt-1"></div>
    }
    if (!record.clockOut) {
      return <div className="w-2 h-2 bg-yellow-400 rounded-full mx-auto mt-1"></div>
    }
    if (record.totalHours >= 8) {
      return <div className="w-2 h-2 bg-green-400 rounded-full mx-auto mt-1"></div>
    }
    return <div className="w-2 h-2 bg-orange-400 rounded-full mx-auto mt-1"></div>
  }

  return (
    <div className="calendar-container">
      <Calendar
        onChange={onDateChange}
        value={selectedDate}
        locale="ja"
        tileContent={getTileContent}
        className="liquid-glass rounded-liquid border-none shadow-lg"
      />
    </div>
  )
}

export const Attendance: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table')
  const dispatch = useDispatch<AppDispatch>()
  const { monthlyRecords, loading } = useSelector((state: RootState) => state.attendance)

  useEffect(() => {
    const month = format(selectedDate, 'yyyy-MM')
    dispatch(getMonthlyRecords(month))
  }, [dispatch, selectedDate])

  // Mock data for demonstration
  const mockRecords: AttendanceRecord[] = [
    {
      id: 1,
      date: '2024-01-15',
      clockIn: '2024-01-15T09:00:00',
      clockOut: '2024-01-15T18:00:00',
      breakTime: 60,
      totalHours: 8.0,
      status: 'complete'
    },
    {
      id: 2,
      date: '2024-01-16',
      clockIn: '2024-01-16T09:15:00',
      clockOut: '2024-01-16T17:45:00',
      breakTime: 60,
      totalHours: 7.5,
      status: 'incomplete'
    },
    {
      id: 3,
      date: '2024-01-17',
      clockIn: '2024-01-17T08:45:00',
      clockOut: '2024-01-17T18:30:00',
      breakTime: 90,
      totalHours: 8.25,
      status: 'complete'
    }
  ]

  const currentMonthStats = {
    totalDays: 22,
    workedDays: 18,
    totalHours: 144.5,
    averageHours: 8.0,
    lateCount: 2,
    earlyLeaveCount: 1
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">勤怠履歴</h1>
          <p className="text-slate-600 mt-1">
            {format(selectedDate, 'yyyy年MM月', { locale: ja })}の勤怠記録
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <LiquidButton
            variant={viewMode === 'table' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
          >
            <ChartBarIcon className="h-4 w-4 mr-2" />
            表形式
          </LiquidButton>
          <LiquidButton
            variant={viewMode === 'calendar' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('calendar')}
          >
            <CalendarDaysIcon className="h-4 w-4 mr-2" />
            カレンダー
          </LiquidButton>
          <LiquidButton variant="secondary" size="sm">
            <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
            CSV出力
          </LiquidButton>
        </div>
      </div>

      {/* Monthly Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <LiquidCard>
          <CardContent className="text-center py-6">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {currentMonthStats.workedDays}
            </div>
            <div className="text-sm font-medium text-slate-900">出勤日数</div>
            <div className="text-xs text-slate-500">/ {currentMonthStats.totalDays}日</div>
          </CardContent>
        </LiquidCard>

        <LiquidCard>
          <CardContent className="text-center py-6">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {currentMonthStats.totalHours}
            </div>
            <div className="text-sm font-medium text-slate-900">総勤務時間</div>
            <div className="text-xs text-slate-500">時間</div>
          </CardContent>
        </LiquidCard>

        <LiquidCard>
          <CardContent className="text-center py-6">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {currentMonthStats.averageHours}
            </div>
            <div className="text-sm font-medium text-slate-900">平均勤務時間</div>
            <div className="text-xs text-slate-500">時間/日</div>
          </CardContent>
        </LiquidCard>

        <LiquidCard>
          <CardContent className="text-center py-6">
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {currentMonthStats.lateCount}
            </div>
            <div className="text-sm font-medium text-slate-900">遅刻回数</div>
            <div className="text-xs text-slate-500">回</div>
          </CardContent>
        </LiquidCard>
      </div>

      {/* Main Content */}
      {viewMode === 'table' ? (
        <LiquidCard>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900">勤怠記録一覧</h3>
              <div className="flex items-center space-x-2 text-sm text-slate-600">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-400 rounded-full mr-1"></div>
                  完了
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full mr-1"></div>
                  勤務中
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-orange-400 rounded-full mr-1"></div>
                  短時間
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-400 rounded-full mr-1"></div>
                  未出勤
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <AttendanceTable records={mockRecords} />
          </CardContent>
        </LiquidCard>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <LiquidCard>
              <CardHeader>
                <h3 className="text-xl font-semibold text-slate-900">カレンダービュー</h3>
              </CardHeader>
              <CardContent>
                <AttendanceCalendar
                  selectedDate={selectedDate}
                  onDateChange={setSelectedDate}
                  records={mockRecords}
                />
              </CardContent>
            </LiquidCard>
          </div>
          
          <div>
            <LiquidCard>
              <CardHeader>
                <h3 className="text-lg font-semibold text-slate-900">
                  {format(selectedDate, 'MM/dd(EEE)', { locale: ja })}の詳細
                </h3>
              </CardHeader>
              <CardContent>
                {/* Selected date details would go here */}
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <CalendarDaysIcon className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">日付を選択してください</p>
                  </div>
                </div>
              </CardContent>
            </LiquidCard>
          </div>
        </div>
      )}
    </div>
  )
}