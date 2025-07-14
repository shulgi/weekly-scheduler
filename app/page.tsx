'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import AuthForm from '@/components/AuthForm'
import WeeklyScheduler from '@/components/WeeklyScheduler'
import type { User } from '@supabase/supabase-js'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check active sessions and sets the user
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleAuthSuccess = () => {
    // User state will be updated by the auth state change listener
  }

  const handleSignOut = () => {
    setUser(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-purple-600 text-xl">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <AuthForm onSuccess={handleAuthSuccess} />
  }

  return <WeeklyScheduler onSignOut={handleSignOut} />
}