'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ProfileService } from '@/lib/profileService'
import AuthForm from '@/components/AuthForm'
import WeeklyScheduler from '@/components/WeeklyScheduler'
import type { User } from '@supabase/supabase-js'
import type { UserProfile } from '@/types'

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check active sessions and sets the user
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user ?? null
      setUser(user)
      
      if (user) {
        const userProfile = await ProfileService.getProfile(user.id)
        setProfile(userProfile)
        
        // Redirect to profile if incomplete
        if (!userProfile || !userProfile.full_name || !userProfile.username) {
          router.push('/profile')
          return
        }
      }
      
      setLoading(false)
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null
      setUser(user)
      
      if (user) {
        const userProfile = await ProfileService.getProfile(user.id)
        setProfile(userProfile)
        
        // Redirect to profile if incomplete
        if (!userProfile || !userProfile.full_name || !userProfile.username) {
          router.push('/profile')
          return
        }
      }
      
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [router])

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

  return <WeeklyScheduler onSignOut={handleSignOut} profile={profile} />
}