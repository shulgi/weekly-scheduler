import { supabase } from './supabase'
import type { UserProfile } from '@/types'

export class ProfileService {
  static async getProfile(userId?: string): Promise<UserProfile | null> {
    let targetUserId = userId
    
    // Only make auth call if no userId provided
    if (!targetUserId) {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError) {
          console.error('Auth error in getProfile:', authError)
          return null
        }
        targetUserId = user?.id
      } catch (error) {
        console.error('Exception in getProfile auth check:', error)
        return null
      }
    }
    
    if (!targetUserId) {
      console.log('No user ID available for profile fetch')
      return null
    }

    try {
      console.log('Querying user_profiles for ID:', targetUserId)
      
      // Add timeout to prevent hanging
      const queryPromise = supabase
        .from('user_profiles')
        .select('*')
        .eq('id', targetUserId)
        .single()
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Database query timeout')), 5000)
      })
      
      const result = await Promise.race([queryPromise, timeoutPromise])
      const { data, error } = result

      if (error) {
        if (error.code === 'PGRST116') {
          // No profile found - this is expected for new users
          console.log('No profile found for user (expected for new users)')
          return null
        }
        if (error.code === '42P01') {
          // Table doesn't exist
          console.error('user_profiles table does not exist! Please apply the database migration.')
          return null
        }
        console.error('Database error fetching profile:', error)
        return null
      }

      console.log('Successfully fetched profile:', data?.username || 'unnamed')
      return data
    } catch (error) {
      if (error.message === 'Database query timeout') {
        console.error('Database query timed out - possible connection issue or missing table')
      } else {
        console.error('Exception in profile database query:', error)
      }
      return null
    }
  }

  static async createProfile(profile: Omit<UserProfile, 'created_at' | 'updated_at'>): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert(profile)
      .select()
      .single()

    if (error) {
      console.error('Error creating profile:', error)
      return null
    }

    return data
  }

  static async updateProfile(userId: string, updates: Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>): Promise<boolean> {
    const { error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)

    if (error) {
      console.error('Error updating profile:', error)
      return false
    }

    return true
  }

  static async checkUsernameAvailability(username: string, currentUserId?: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id')
      .ilike('username', username)
      .limit(1)

    if (error) {
      console.error('Error checking username:', error)
      return false
    }

    // Username is available if no results, or if the only result is the current user
    return data.length === 0 || (!!currentUserId && data[0]?.id === currentUserId)
  }

  static async uploadAvatar(userId: string, file: File): Promise<string | null> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/avatar.${fileExt}`

    // Delete existing avatar first
    await supabase.storage
      .from('avatars')
      .remove([`${userId}/avatar.jpg`, `${userId}/avatar.png`, `${userId}/avatar.jpeg`, `${userId}/avatar.webp`])

    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      })

    if (error) {
      console.error('Error uploading avatar:', error)
      return null
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName)

    return publicUrl
  }

  static async updatePassword(newPassword: string): Promise<boolean> {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      console.error('Error updating password:', error)
      return false
    }

    return true
  }
}