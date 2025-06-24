import React, { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useDispatch, useSelector } from 'react-redux'
import { 
  ClockIcon, 
  CameraIcon, 
  PlayIcon, 
  StopIcon,
  PauseIcon 
} from '@heroicons/react/24/outline'
import { RootState, AppDispatch } from '@/store/store'
import { clockIn, clockOut, startBreak, endBreak, getTodayRecord } from '@/store/slices/attendanceSlice'
import { addNotification } from '@/store/slices/uiSlice'
import { LiquidCard, CardHeader, CardContent } from '@/components/ui/LiquidCard'
import { LiquidButton } from '@/components/ui/LiquidButton'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

export const Clock: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showCamera, setShowCamera] = useState(false)
  const [photo, setPhoto] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  
  const dispatch = useDispatch<AppDispatch>()
  const { currentStatus, todayRecord, loading } = useSelector((state: RootState) => state.attendance)
  const { user } = useSelector((state: RootState) => state.auth)

  // Update current time every second
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Get today's record on mount
  React.useEffect(() => {
    dispatch(getTodayRecord())
  }, [dispatch])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' },
        audio: false 
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setShowCamera(true)
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: 'カメラの起動に失敗しました'
      }))
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setShowCamera(false)
    setPhoto(null)
  }

  const takePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current
      const context = canvas.getContext('2d')
      
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      if (context) {
        context.drawImage(video, 0, 0)
        const dataURL = canvas.toDataURL('image/jpeg', 0.8)
        setPhoto(dataURL)
        stopCamera()
      }
    }
  }, [])

  const handleClockIn = async () => {
    try {
      await dispatch(clockIn({ photo: photo || undefined })).unwrap()
      dispatch(addNotification({
        type: 'success',
        message: '出勤打刻が完了しました'
      }))
      setPhoto(null)
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: '出勤打刻に失敗しました'
      }))
    }
  }

  const handleClockOut = async () => {
    try {
      await dispatch(clockOut({ photo: photo || undefined })).unwrap()
      dispatch(addNotification({
        type: 'success',
        message: '退勤打刻が完了しました'
      }))
      setPhoto(null)
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: '退勤打刻に失敗しました'
      }))
    }
  }

  const handleStartBreak = async () => {
    try {
      await dispatch(startBreak()).unwrap()
      dispatch(addNotification({
        type: 'info',
        message: '休憩を開始しました'
      }))
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: '休憩開始に失敗しました'
      }))
    }
  }

  const handleEndBreak = async () => {
    try {
      await dispatch(endBreak()).unwrap()
      dispatch(addNotification({
        type: 'info',
        message: '休憩を終了しました'
      }))
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: '休憩終了に失敗しました'
      }))
    }
  }

  const formatTime = (time: string) => {
    return format(new Date(time), 'HH:mm', { locale: ja })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Current Time Display */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        <LiquidCard className="text-center bg-gradient-to-r from-primary-500 to-secondary-500 text-white">
          <CardContent className="py-12">
            <div className="text-6xl md:text-8xl font-bold mb-4 text-white">
              {format(currentTime, 'HH:mm:ss')}
            </div>
            <div className="text-xl md:text-2xl text-white/90 mb-6 font-medium">
              {format(currentTime, 'yyyy年MM月dd日(EEEE)', { locale: ja })}
            </div>
            <StatusBadge status={currentStatus} className="bg-white/30 text-white text-lg px-4 py-2 font-semibold" />
          </CardContent>
        </LiquidCard>
      </motion.div>

      {/* Clock Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Punch Clock */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <LiquidCard>
            <CardHeader>
              <h3 className="text-xl font-semibold text-slate-800 flex items-center">
                <ClockIcon className="h-6 w-6 mr-2" />
                打刻
              </h3>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Photo section */}
              {!showCamera && !photo && (
                <div className="text-center">
                  <LiquidButton
                    variant="outline"
                    onClick={startCamera}
                    className="mb-4"
                  >
                    <CameraIcon className="h-5 w-5 mr-2" />
                    写真を撮影（任意）
                  </LiquidButton>
                </div>
              )}

              {showCamera && (
                <div className="space-y-4">
                  <div className="relative">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-48 object-cover rounded-liquid liquid-glass"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                  </div>
                  <div className="flex space-x-2">
                    <LiquidButton
                      variant="primary"
                      onClick={takePhoto}
                      className="flex-1"
                    >
                      撮影
                    </LiquidButton>
                    <LiquidButton
                      variant="outline"
                      onClick={stopCamera}
                      className="flex-1"
                    >
                      キャンセル
                    </LiquidButton>
                  </div>
                </div>
              )}

              {photo && (
                <div className="space-y-4">
                  <img
                    src={photo}
                    alt="撮影した写真"
                    className="w-full h-48 object-cover rounded-liquid liquid-glass"
                  />
                  <LiquidButton
                    variant="outline"
                    onClick={() => setPhoto(null)}
                    size="sm"
                  >
                    写真を削除
                  </LiquidButton>
                </div>
              )}

              {/* Clock buttons */}
              <div className="space-y-4">
                {currentStatus === 'off' && (
                  <LiquidButton
                    variant="primary"
                    size="lg"
                    onClick={handleClockIn}
                    loading={loading}
                    className="w-full liquid-glow"
                  >
                    <PlayIcon className="h-6 w-6 mr-2" />
                    出勤
                  </LiquidButton>
                )}

                {currentStatus === 'working' && (
                  <div className="space-y-3">
                    <LiquidButton
                      variant="secondary"
                      size="lg"
                      onClick={handleStartBreak}
                      loading={loading}
                      className="w-full"
                    >
                      <PauseIcon className="h-6 w-6 mr-2" />
                      休憩開始
                    </LiquidButton>
                    <LiquidButton
                      variant="outline"
                      size="lg"
                      onClick={handleClockOut}
                      loading={loading}
                      className="w-full"
                    >
                      <StopIcon className="h-6 w-6 mr-2" />
                      退勤
                    </LiquidButton>
                  </div>
                )}

                {currentStatus === 'break' && (
                  <div className="space-y-3">
                    <LiquidButton
                      variant="primary"
                      size="lg"
                      onClick={handleEndBreak}
                      loading={loading}
                      className="w-full"
                    >
                      <PlayIcon className="h-6 w-6 mr-2" />
                      休憩終了
                    </LiquidButton>
                    <LiquidButton
                      variant="outline"
                      size="lg"
                      onClick={handleClockOut}
                      loading={loading}
                      className="w-full"
                    >
                      <StopIcon className="h-6 w-6 mr-2" />
                      退勤
                    </LiquidButton>
                  </div>
                )}
              </div>
            </CardContent>
          </LiquidCard>
        </motion.div>

        {/* Today's Summary */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <LiquidCard>
            <CardHeader>
              <h3 className="text-xl font-semibold text-slate-800">本日のサマリー</h3>
            </CardHeader>
            <CardContent>
              {todayRecord ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center liquid-glass p-4 rounded-liquid">
                      <div className="text-2xl font-bold text-primary-600">
                        {todayRecord.clockIn ? formatTime(todayRecord.clockIn) : '--:--'}
                      </div>
                      <div className="text-sm text-slate-600">出勤時刻</div>
                    </div>
                    <div className="text-center liquid-glass p-4 rounded-liquid">
                      <div className="text-2xl font-bold text-secondary-600">
                        {todayRecord.clockOut ? formatTime(todayRecord.clockOut) : '--:--'}
                      </div>
                      <div className="text-sm text-slate-600">退勤時刻</div>
                    </div>
                  </div>

                  <div className="text-center liquid-glass p-6 rounded-liquid bg-gradient-to-r from-accent-50 to-primary-50">
                    <div className="text-4xl font-bold text-gradient-primary mb-2">
                      {todayRecord.totalHours.toFixed(1)}
                    </div>
                    <div className="text-slate-600">勤務時間（時間）</div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-glass-border/50">
                      <span className="text-slate-600">休憩時間</span>
                      <span className="font-semibold">{todayRecord.breakTime}分</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-glass-border/50">
                      <span className="text-slate-600">ステータス</span>
                      <StatusBadge status={currentStatus} pulse={false} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <ClockIcon className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 mb-4">まだ出勤していません</p>
                  <p className="text-sm text-slate-400">出勤ボタンを押して勤務を開始してください</p>
                </div>
              )}
            </CardContent>
          </LiquidCard>
        </motion.div>
      </div>
    </div>
  )
}