'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/database'
import LoginForm from '../components/LoginForm'
import Dashboard from '../components/Dashboard'

export default function Home() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setLoading(false)
    }

    getSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return <LoginForm />
  }

  return <Dashboard user={session.user} />
}