import { useEffect, useRef, useCallback, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import { addNotification } from '@/store/slices/uiSlice'

interface WebSocketMessage {
  type: string
  data: any
  timestamp: string
}

interface UseWebSocketOptions {
  url?: string
  protocols?: string | string[]
  onOpen?: (event: Event) => void
  onClose?: (event: CloseEvent) => void
  onError?: (event: Event) => void
  onMessage?: (message: WebSocketMessage) => void
  reconnectAttempts?: number
  reconnectInterval?: number
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const {
    url = `ws://localhost:5000/ws`,
    protocols,
    onOpen,
    onClose,
    onError,
    onMessage,
    reconnectAttempts = 5,
    reconnectInterval = 3000,
  } = options

  const dispatch = useDispatch()
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth)
  
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')
  
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const attemptCountRef = useRef(0)

  const connect = useCallback(() => {
    if (!isAuthenticated || wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    try {
      setConnectionStatus('connecting')
      wsRef.current = new WebSocket(url, protocols)

      wsRef.current.onopen = (event) => {
        console.log('WebSocket connected')
        setIsConnected(true)
        setConnectionStatus('connected')
        attemptCountRef.current = 0
        
        // Send authentication info
        if (user) {
          send({
            type: 'auth',
            data: { userId: user.id, employeeId: user.employeeId },
          })
        }

        onOpen?.(event)
      }

      wsRef.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason)
        setIsConnected(false)
        setConnectionStatus('disconnected')
        
        // Attempt to reconnect if not intentionally closed
        if (event.code !== 1000 && attemptCountRef.current < reconnectAttempts) {
          attemptCountRef.current++
          console.log(`Reconnecting... attempt ${attemptCountRef.current}/${reconnectAttempts}`)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, reconnectInterval)
        }

        onClose?.(event)
      }

      wsRef.current.onerror = (event) => {
        console.error('WebSocket error:', event)
        setConnectionStatus('error')
        
        dispatch(addNotification({
          type: 'error',
          message: 'リアルタイム接続でエラーが発生しました',
        }))

        onError?.(event)
      }

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          console.log('WebSocket message received:', message)
          
          // Handle built-in message types
          switch (message.type) {
            case 'notification':
              dispatch(addNotification({
                type: message.data.type || 'info',
                message: message.data.message,
              }))
              break
            
            case 'attendance_update':
              // Handle attendance updates
              // This could trigger a refresh of attendance data
              break
            
            case 'system_announcement':
              dispatch(addNotification({
                type: 'info',
                message: message.data.message,
              }))
              break
          }

          onMessage?.(message)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      setConnectionStatus('error')
    }
  }, [url, protocols, isAuthenticated, user, onOpen, onClose, onError, onMessage, reconnectAttempts, reconnectInterval, dispatch])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Intentional disconnect')
      wsRef.current = null
    }

    setIsConnected(false)
    setConnectionStatus('disconnected')
    attemptCountRef.current = 0
  }, [])

  const send = useCallback((message: Partial<WebSocketMessage>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const fullMessage: WebSocketMessage = {
        type: message.type || 'message',
        data: message.data,
        timestamp: new Date().toISOString(),
      }
      
      wsRef.current.send(JSON.stringify(fullMessage))
      return true
    } else {
      console.warn('WebSocket is not connected')
      return false
    }
  }, [])

  // Connect when authenticated, disconnect when not
  useEffect(() => {
    if (isAuthenticated) {
      connect()
    } else {
      disconnect()
    }

    return () => {
      disconnect()
    }
  }, [isAuthenticated, connect, disconnect])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    isConnected,
    connectionStatus,
    send,
    connect,
    disconnect,
  }
}