import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useDispatch, useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { ClockIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { login, clearError } from '@/store/slices/authSlice'
import { addNotification } from '@/store/slices/uiSlice'
import { RootState, AppDispatch } from '@/store/store'
import { LiquidCard, CardContent } from '@/components/ui/LiquidCard'
import { LiquidButton } from '@/components/ui/LiquidButton'
import { LiquidInput } from '@/components/ui/LiquidInput'

interface LoginForm {
  username: string
  password: string
}

export const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false)
  const dispatch = useDispatch<AppDispatch>()
  const { loading, error } = useSelector((state: RootState) => state.auth)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>()

  const onSubmit = async (data: LoginForm) => {
    try {
      await dispatch(login(data)).unwrap()
      dispatch(addNotification({
        type: 'success',
        message: 'ログインしました',
      }))
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: 'ログインに失敗しました',
      }))
    }
  }

  React.useEffect(() => {
    return () => {
      dispatch(clearError())
    }
  }, [dispatch])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 flex items-center justify-center p-4">

      <motion.div
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <LiquidCard className="overflow-hidden" animate>
          <div className="px-8 py-12">
            {/* Logo and Title */}
            <motion.div
              className="text-center mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <div className="mx-auto h-16 w-16 rounded-liquid bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center mb-4 liquid-glow">
                <ClockIcon className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gradient-primary mb-2">
                タイムカード
              </h1>
              <p className="text-slate-600">
                勤怠管理システムにログイン
              </p>
            </motion.div>

            {/* Login Form */}
            <motion.form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <LiquidInput
                label="ユーザー名"
                type="text"
                placeholder="ユーザー名を入力"
                error={errors.username?.message}
                {...register('username', {
                  required: 'ユーザー名は必須です',
                  minLength: {
                    value: 3,
                    message: 'ユーザー名は3文字以上で入力してください',
                  },
                })}
              />

              <div className="relative">
                <LiquidInput
                  label="パスワード"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="パスワードを入力"
                  error={errors.password?.message}
                  {...register('password', {
                    required: 'パスワードは必須です',
                    minLength: {
                      value: 6,
                      message: 'パスワードは6文字以上で入力してください',
                    },
                  })}
                />
                <button
                  type="button"
                  className="absolute right-3 top-9 text-slate-500 hover:text-slate-700 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>

              {error && (
                <motion.div
                  className="liquid-glass bg-red-50 border border-red-200 rounded-liquid p-3"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="text-sm text-red-700">{error}</p>
                </motion.div>
              )}

              <LiquidButton
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full liquid-shimmer"
              >
                {loading ? 'ログイン中...' : 'ログイン'}
              </LiquidButton>
            </motion.form>

            {/* Demo Accounts */}
            <motion.div
              className="mt-8 p-4 liquid-glass bg-slate-50/50 rounded-liquid"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <h3 className="text-sm font-medium text-slate-700 mb-2">
                デモアカウント
              </h3>
              <div className="space-y-1 text-xs text-slate-600">
                <div>管理者: admin / admin123</div>
                <div>一般: yamada / yamada123</div>
              </div>
            </motion.div>
          </div>
        </LiquidCard>

        {/* Footer */}
        <motion.div
          className="text-center mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <p className="text-sm text-slate-500">
            © 2024 タイムカード管理システム
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}