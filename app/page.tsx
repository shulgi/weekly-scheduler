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
    let mounted = true
    
    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...')
        
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session error:', sessionError)
          if (mounted) setLoading(false)
          return
        }
        
        const user = session?.user ?? null
        console.log('Current user:', user?.id ? 'Found user' : 'No user')
        
        if (!mounted) return
        
        setUser(user)
        
        if (user) {
          console.log('Fetching profile for user:', user.id)
          const userProfile = await ProfileService.getProfile(user.id)
          console.log('Profile result:', userProfile ? 'Found profile' : 'No profile')
          
          if (!mounted) return
          
          setProfile(userProfile)
          
          // Redirect to profile if incomplete (no username or full_name)
          if (!userProfile?.full_name || !userProfile?.username) {
            console.log('Profile incomplete, redirecting to profile page')
            setLoading(false)
            router.push('/profile')
            return
          }
          
          console.log('Profile complete, showing schedule')
        }
        
        setLoading(false)
        
      } catch (error) {
        console.error('Error during auth initialization:', error)
        if (mounted) setLoading(false)
      }
    }

    initializeAuth()

    // Simple auth state listener for sign out only
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event)
      
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
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