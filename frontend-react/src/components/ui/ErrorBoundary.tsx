import React, { Component, ErrorInfo, ReactNode } from 'react'
import { LiquidCard, CardContent } from './LiquidCard'
import { LiquidButton } from './LiquidButton'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({ error, errorInfo })
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  private handleReload = () => {
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 flex items-center justify-center p-4">
          <LiquidCard className="max-w-md w-full">
            <CardContent className="text-center p-8">
              <div className="h-16 w-16 bg-red-100 rounded-liquid flex items-center justify-center mx-auto mb-4">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
              </div>
              
              <h2 className="text-xl font-semibold text-slate-900 mb-2">
                エラーが発生しました
              </h2>
              
              <p className="text-slate-600 mb-6">
                申し訳ございません。予期しないエラーが発生しました。
                ページを再読み込みするか、しばらく時間をおいてから再試行してください。
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-left mb-6 p-4 bg-slate-100 rounded-liquid">
                  <summary className="cursor-pointer text-sm font-medium text-slate-700 mb-2">
                    エラー詳細（開発環境）
                  </summary>
                  <pre className="text-xs text-slate-600 overflow-auto">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}

              <div className="flex space-x-3">
                <LiquidButton
                  variant="outline"
                  onClick={this.handleRetry}
                  className="flex-1"
                >
                  再試行
                </LiquidButton>
                <LiquidButton
                  variant="primary"
                  onClick={this.handleReload}
                  className="flex-1"
                >
                  ページ再読み込み
                </LiquidButton>
              </div>
            </CardContent>
          </LiquidCard>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook for functional components error handling
export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = () => setError(null)

  const throwError = (error: Error) => {
    throw error
  }

  React.useEffect(() => {
    if (error) {
      throwError(error)
    }
  }, [error])

  return { setError, resetError }
}