import React, { useState, useEffect } from 'react'
import { View, StyleSheet } from 'react-native'
import { supabase } from '@/lib/supabase'
import SignInScreen from './SignInScreen'

interface AuthWrapperProps {
  children: React.ReactNode
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuthState()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const checkAuthState = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuthenticated(!!session)
    } catch (error) {
      console.error('Auth check error:', error)
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }

  const handleAuthSuccess = () => {
    setIsAuthenticated(true)
  }

  if (loading) {
    return <View style={styles.container} />
  }

  if (!isAuthenticated) {
    return <SignInScreen onAuthSuccess={handleAuthSuccess} />
  }

  return <>{children}</>
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4B0082',
  },
})
