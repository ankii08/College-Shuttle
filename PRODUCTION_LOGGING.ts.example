// utils/logger.ts - Production logging system
export const logger = {
  error: (message: string, error?: any, context?: any) => {
    if (process.env.NODE_ENV === 'production') {
      // Send to logging service (e.g., Sentry, LogRocket)
      console.error(`[ERROR] ${message}`, error, context)
      // TODO: Implement proper error tracking service
    } else {
      console.error(`[ERROR] ${message}`, error, context)
    }
  },
  
  warn: (message: string, context?: any) => {
    if (process.env.NODE_ENV === 'production') {
      console.warn(`[WARN] ${message}`, context)
    } else {
      console.warn(`[WARN] ${message}`, context)
    }
  },
  
  info: (message: string, context?: any) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[INFO] ${message}`, context)
    }
  }
}

// utils/errorBoundary.tsx - React Error Boundary
import React from 'react'
import { View, Text } from 'react-native'

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('React Error Boundary caught an error', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Something went wrong. Please restart the app.</Text>
        </View>
      )
    }

    return this.props.children
  }
}
