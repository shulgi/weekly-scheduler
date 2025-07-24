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
    
    // Check active sessions and sets the user
    const getSession = async () => {
      try {
        console.log('Getting session...')
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session error:', sessionError)
          if (mounted) setLoading(false)
          return
        }
        
        const user = session?.user ?? null
        console.log('Session user:', user?.id ? 'Found user' : 'No user')
        
        if (mounted) {
          setUser(user)
          
          if (user) {
            console.log('Fetching profile for user:', user.id)
            const userProfile = await ProfileService.getProfile(user.id)
            console.log('Profile result:', userProfile ? 'Found profile' : 'No profile')
            
            if (mounted) {
              setProfile(userProfile)
              
              // Redirect to profile if incomplete
              if (!userProfile || !userProfile.full_name || !userProfile.username) {
                console.log('Redirecting to profile page - incomplete profile')
                setLoading(false)
                router.push('/profile')
                return
              }
            }
          }
          
          setLoading(false)
        }
      } catch (error) {
        console.error('Error during session check:', error)
        if (mounted) setLoading(false)
      }
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.id ? 'User present' : 'No user')
      
      if (!mounted) return
      
      try {
        const user = session?.user ?? null
        setUser(user)
        
        if (user) {
          const userProfile = await ProfileService.getProfile(user.id)
          if (mounted) {
            setProfile(userProfile)
            
            // Redirect to profile if incomplete
            if (!userProfile || !userProfile.full_name || !userProfile.username) {
              router.push('/profile')
              return
            }
          }
        } else {
          if (mounted) setProfile(null)
        }
        
      } catch (error) {
        console.error('Error during auth state change:', error)
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