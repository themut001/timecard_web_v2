import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import {
  PlusIcon,
  CalendarDaysIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline'
import { LiquidCard, CardHeader, CardContent, CardFooter } from '@/components/ui/LiquidCard'
import { LiquidButton } from '@/components/ui/LiquidButton'
import { LiquidInput } from '@/components/ui/LiquidInput'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface RequestForm {
  type: 'vacation' | 'overtime' | 'late' | 'early'
  startDate: string
  endDate?: string
  startTime?: string
  endTime?: string
  reason: string
}

interface Request {
  id: number
  type: 'vacation' | 'overtime' | 'late' | 'early'
  status: 'pending' | 'approved' | 'rejected'
  startDate: string
  endDate?: string
  reason: string
  submittedAt: string
  respondedAt?: string
}

const RequestForm: React.FC<{
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: RequestForm) => void
}> = ({ isOpen, onClose, onSubmit }) => {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<RequestForm>()

  const requestType = watch('type')

  const handleFormSubmit = (data: RequestForm) => {
    onSubmit(data)
    reset()
    onClose()
  }

  if (!isOpen) return null

  const requestTypes = [
    { value: 'vacation', label: '有給休暇', icon: CalendarDaysIcon },
    { value: 'overtime', label: '残業申請', icon: ClockIcon },
    { value: 'late', label: '遅刻申請', icon: ExclamationTriangleIcon },
    { value: 'early', label: '早退申請', icon: ExclamationTriangleIcon },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        <LiquidCard>
          <CardHeader>
            <h3 className="text-xl font-semibold text-slate-900">新規申請</h3>
          </CardHeader>
          <form onSubmit={handleSubmit(handleFormSubmit)}>
            <CardContent className="space-y-4">
              {/* Request Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  申請種別
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {requestTypes.map((type) => {
                    const Icon = type.icon
                    return (
                      <label
                        key={type.value}
                        className="relative flex items-center p-3 border border-slate-200 rounded-liquid cursor-pointer hover:bg-slate-50"
                      >
                        <input
                          type="radio"
                          value={type.value}
                          {...register('type', { required: '申請種別を選択してください' })}
                          className="sr-only"
                        />
                        <Icon className="h-5 w-5 text-slate-600 mr-2" />
                        <span className="text-sm font-medium text-slate-900">{type.label}</span>
                      </label>
                    )
                  })}
                </div>
                {errors.type && (
                  <p className="text-sm text-red-600 mt-1">{errors.type.message}</p>
                )}
              </div>

              {/* Date/Time Fields */}
              {requestType === 'vacation' && (
                <>
                  <LiquidInput
                    label="開始日"
                    type="date"
                    {...register('startDate', { required: '開始日を入力してください' })}
                    error={errors.startDate?.message}
                  />
                  <LiquidInput
                    label="終了日"
                    type="date"
                    {...register('endDate', { required: '終了日を入力してください' })}
                    error={errors.endDate?.message}
                  />
                </>
              )}

              {requestType === 'overtime' && (
                <>
                  <LiquidInput
                    label="日付"
                    type="date"
                    {...register('startDate', { required: '日付を入力してください' })}
                    error={errors.startDate?.message}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <LiquidInput
                      label="開始時刻"
                      type="time"
                      {...register('startTime', { required: '開始時刻を入力してください' })}
                      error={errors.startTime?.message}
                    />
                    <LiquidInput
                      label="終了時刻"
                      type="time"
                      {...register('endTime', { required: '終了時刻を入力してください' })}
                      error={errors.endTime?.message}
                    />
                  </div>
                </>
              )}

              {(requestType === 'late' || requestType === 'early') && (
                <>
                  <LiquidInput
                    label="日付"
                    type="date"
                    {...register('startDate', { required: '日付を入力してください' })}
                    error={errors.startDate?.message}
                  />
                  <LiquidInput
                    label="時刻"
                    type="time"
                    {...register('startTime', { required: '時刻を入力してください' })}
                    error={errors.startTime?.message}
                  />
                </>
              )}

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  理由
                </label>
                <textarea
                  rows={3}
                  className="liquid-input resize-none"
                  placeholder="申請理由を入力してください"
                  {...register('reason', { required: '理由を入力してください' })}
                />
                {errors.reason && (
                  <p className="text-sm text-red-600 mt-1">{errors.reason.message}</p>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <div className="flex space-x-3 w-full">
                <LiquidButton
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  キャンセル
                </LiquidButton>
                <LiquidButton type="submit" variant="primary" className="flex-1">
                  <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                  申請
                </LiquidButton>
              </div>
            </CardFooter>
          </form>
        </LiquidCard>
      </motion.div>
    </div>
  )
}

const RequestCard: React.FC<{ request: Request }> = ({ request }) => {
  const getTypeInfo = (type: string) => {
    switch (type) {
      case 'vacation':
        return { label: '有給休暇', icon: CalendarDaysIcon, color: 'text-blue-600' }
      case 'overtime':
        return { label: '残業申請', icon: ClockIcon, color: 'text-purple-600' }
      case 'late':
        return { label: '遅刻申請', icon: ExclamationTriangleIcon, color: 'text-orange-600' }
      case 'early':
        return { label: '早退申請', icon: ExclamationTriangleIcon, color: 'text-red-600' }
      default:
        return { label: '不明', icon: DocumentTextIcon, color: 'text-gray-600' }
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <ClockIcon className="h-3 w-3 mr-1" />
            承認待ち
          </span>
        )
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="h-3 w-3 mr-1" />
            承認済み
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircleIcon className="h-3 w-3 mr-1" />
            却下
          </span>
        )
      default:
        return null
    }
  }

  const typeInfo = getTypeInfo(request.type)
  const Icon = typeInfo.icon

  return (
    <LiquidCard className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-liquid bg-slate-100 ${typeInfo.color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{typeInfo.label}</h3>
              <p className="text-sm text-slate-500">
                {format(new Date(request.submittedAt), 'MM/dd HH:mm', { locale: ja })}に申請
              </p>
            </div>
          </div>
          {getStatusBadge(request.status)}
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-slate-600">
            <CalendarDaysIcon className="h-4 w-4 mr-2" />
            {format(new Date(request.startDate), 'yyyy/MM/dd', { locale: ja })}
            {request.endDate && (
              <span> 〜 {format(new Date(request.endDate), 'yyyy/MM/dd', { locale: ja })}</span>
            )}
          </div>
          <div className="text-sm text-slate-600">
            <span className="font-medium">理由:</span> {request.reason}
          </div>
        </div>

        {request.status === 'pending' && (
          <div className="flex space-x-2">
            <LiquidButton size="sm" variant="outline" className="flex-1">
              編集
            </LiquidButton>
            <LiquidButton size="sm" variant="outline" className="flex-1">
              取消
            </LiquidButton>
          </div>
        )}
      </CardContent>
    </LiquidCard>
  )
}

export const Requests: React.FC = () => {
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')

  // Mock data
  const mockRequests: Request[] = [
    {
      id: 1,
      type: 'vacation',
      status: 'approved',
      startDate: '2024-01-20',
      endDate: '2024-01-21',
      reason: '家族旅行のため',
      submittedAt: '2024-01-15T10:00:00',
      respondedAt: '2024-01-16T14:30:00',
    },
    {
      id: 2,
      type: 'overtime',
      status: 'pending',
      startDate: '2024-01-18',
      reason: 'プロジェクトの納期対応',
      submittedAt: '2024-01-17T16:00:00',
    },
    {
      id: 3,
      type: 'late',
      status: 'rejected',
      startDate: '2024-01-16',
      reason: '電車の遅延',
      submittedAt: '2024-01-16T09:30:00',
      respondedAt: '2024-01-16T11:00:00',
    },
  ]

  const handleSubmitRequest = (data: RequestForm) => {
    console.log('Submitting request:', data)
    // Here you would typically dispatch an action to submit the request
  }

  const filteredRequests = mockRequests.filter(request => 
    filter === 'all' || request.status === filter
  )

  const filterOptions = [
    { value: 'all', label: 'すべて', count: mockRequests.length },
    { value: 'pending', label: '承認待ち', count: mockRequests.filter(r => r.status === 'pending').length },
    { value: 'approved', label: '承認済み', count: mockRequests.filter(r => r.status === 'approved').length },
    { value: 'rejected', label: '却下', count: mockRequests.filter(r => r.status === 'rejected').length },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">申請管理</h1>
          <p className="text-slate-600 mt-1">有給・残業・遅刻早退の申請を管理します</p>
        </div>
        <LiquidButton
          variant="primary"
          onClick={() => setShowForm(true)}
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          新規申請
        </LiquidButton>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 bg-slate-100 rounded-liquid p-1">
        {filterOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setFilter(option.value as any)}
            className={`flex-1 px-4 py-2 rounded-liquid text-sm font-medium transition-all ${
              filter === option.value
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {option.label}
            <span className="ml-2 text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
              {option.count}
            </span>
          </button>
        ))}
      </div>

      {/* Requests List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRequests.map((request) => (
          <motion.div
            key={request.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <RequestCard request={request} />
          </motion.div>
        ))}
      </div>

      {filteredRequests.length === 0 && (
        <div className="text-center py-12">
          <DocumentTextIcon className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">申請がありません</h3>
          <p className="text-slate-500 mb-6">新しい申請を作成してください。</p>
          <LiquidButton
            variant="primary"
            onClick={() => setShowForm(true)}
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            新規申請
          </LiquidButton>
        </div>
      )}

      {/* Request Form Modal */}
      <RequestForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleSubmitRequest}
      />
    </div>
  )
}