'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ProfileService } from '@/lib/profileService'
import { User, Upload, Eye, EyeOff, ArrowLeft, Check, X, ExternalLink, Copy } from 'lucide-react'
import type { UserProfile } from '@/types'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Form state
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [usernameChecking, setUsernameChecking] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  
  // Messages
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }
      
      setUser(user)
      const userProfile = await ProfileService.getProfile(user.id)
      setProfile(userProfile)
      
      if (userProfile) {
        setFullName(userProfile.full_name || '')
        setUsername(userProfile.username || '')
        setAvatarPreview(userProfile.avatar_url)
      }
      
      setLoading(false)
    }

    getUser()
  }, [router])

  // Username validation and availability check
  useEffect(() => {
    const checkUsername = async () => {
      if (!username || username.length < 3) {
        setUsernameAvailable(null)
        return
      }

      // Validate format
      if (!/^[a-zA-Z0-9]+$/.test(username)) {
        setUsernameAvailable(false)
        return
      }

      setUsernameChecking(true)
      const available = await ProfileService.checkUsernameAvailability(username, user?.id)
      setUsernameAvailable(available)
      setUsernameChecking(false)
    }

    const timeoutId = setTimeout(checkUsername, 300)
    return () => clearTimeout(timeoutId)
  }, [username, user?.id])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    if (!user) return

    setSaving(true)
    setMessage('')

    try {
      // Validate required fields
      if (!fullName.trim()) {
        throw new Error('Name is required')
      }

      if (!username.trim()) {
        throw new Error('Username is required')
      }

      if (usernameAvailable === false) {
        throw new Error('Username is not available')
      }

      // Validate password if provided
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          throw new Error('Passwords do not match')
        }
        if (newPassword.length < 6) {
          throw new Error('Password must be at least 6 characters')
        }
      }

      let avatarUrl = profile?.avatar_url || null

      // Upload avatar if changed
      if (avatarFile) {
        avatarUrl = await ProfileService.uploadAvatar(user.id, avatarFile)
        if (!avatarUrl) {
          throw new Error('Failed to upload avatar')
        }
      }

      // Update or create profile
      const profileData = {
        id: user.id,
        username: username.toLowerCase(),
        full_name: fullName.trim(),
        avatar_url: avatarUrl
      }

      let success = false
      if (profile) {
        success = await ProfileService.updateProfile(user.id, {
          username: profileData.username,
          full_name: profileData.full_name,
          avatar_url: profileData.avatar_url
        })
      } else {
        const newProfile = await ProfileService.createProfile(profileData)
        success = !!newProfile
        if (newProfile) setProfile(newProfile)
      }

      if (!success) {
        throw new Error('Failed to save profile')
      }

      // Update password if provided
      if (newPassword) {
        const passwordSuccess = await ProfileService.updatePassword(newPassword)
        if (!passwordSuccess) {
          throw new Error('Failed to update password')
        }
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }

      setMessage('Profile updated successfully!')
      setMessageType('success')
      setAvatarFile(null)

    } catch (error: any) {
      setMessage(error.message)
      setMessageType('error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-purple-600 text-xl">Loading profile...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-purple-600 hover:text-purple-800 mb-4"
          >
            <ArrowLeft size={20} />
            Back to Schedule
          </button>
          
          <h1 className="text-4xl font-light text-purple-800">Profile Settings</h1>
          <p className="text-purple-600 mt-2">Manage your account information</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-lg border border-purple-200">
          {message && (
            <div className={`mb-6 p-4 rounded-xl ${
              messageType === 'success' 
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message}
            </div>
          )}

          <div className="space-y-6">
            {/* Avatar Upload */}
            <div>
              <label className="block text-sm font-medium text-purple-700 mb-3">
                Profile Picture
              </label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User size={32} className="text-purple-400" />
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                    id="avatar-upload"
                  />
                  <label
                    htmlFor="avatar-upload"
                    className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 cursor-pointer transition-colors"
                  >
                    <Upload size={16} />
                    Choose Image
                  </label>
                  <p className="text-xs text-gray-500 mt-1">JPG, PNG or WebP. Max 5MB.</p>
                </div>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-purple-700 mb-2">
                Full Name *
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-all"
                placeholder="Enter your full name"
              />
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-purple-700 mb-2">
                Username * <span className="text-xs text-gray-500">(letters and numbers only, 3-30 characters)</span>
              </label>
              <div className="relative">
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  className={`w-full px-4 py-3 pr-10 border rounded-xl focus:ring-2 transition-all ${
                    usernameAvailable === true 
                      ? 'border-green-300 focus:ring-green-200 focus:border-green-400'
                      : usernameAvailable === false
                        ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                        : 'border-purple-200 focus:ring-purple-200 focus:border-purple-400'
                  }`}
                  placeholder="Enter your username"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {usernameChecking ? (
                    <div className="w-5 h-5 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin"></div>
                  ) : usernameAvailable === true ? (
                    <Check size={20} className="text-green-500" />
                  ) : usernameAvailable === false ? (
                    <X size={20} className="text-red-500" />
                  ) : null}
                </div>
              </div>
              {usernameAvailable === false && (
                <p className="text-red-600 text-xs mt-1">Username is not available</p>
              )}
            </div>

            {/* Public Schedule URL */}
            {username && usernameAvailable !== false && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                <label className="block text-sm font-medium text-purple-700 mb-2">
                  Public Schedule URL
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 text-sm text-purple-600 bg-white px-3 py-2 rounded-lg border border-purple-200">
                    {username.toLowerCase()}.weeklyscheduler.vercel.app
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`https://${username.toLowerCase()}.weeklyscheduler.vercel.app`)
                      setMessage('Public schedule URL copied!')
                      setMessageType('success')
                      setTimeout(() => setMessage(''), 3000)
                    }}
                    className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors"
                    title="Copy URL"
                  >
                    <Copy size={16} />
                  </button>
                  <a
                    href={`https://${username.toLowerCase()}.weeklyscheduler.vercel.app`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors"
                    title="Open public schedule"
                  >
                    <ExternalLink size={16} />
                  </a>
                </div>
                <p className="text-xs text-purple-500 mt-2">
                  Share this URL so others can view your public schedule. Private entries will show as "Busy".
                </p>
              </div>
            )}

            {/* Password Change */}
            <div className="border-t border-purple-100 pt-6">
              <h3 className="text-lg font-medium text-purple-800 mb-4">Change Password</h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-purple-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="newPassword"
                      type={showPasswords ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-10 border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-all"
                      placeholder="Enter new password (optional)"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(!showPasswords)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-400 hover:text-purple-600"
                    >
                      {showPasswords ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {newPassword && (
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-purple-700 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      id="confirmPassword"
                      type={showPasswords ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 transition-all ${
                        confirmPassword && newPassword !== confirmPassword
                          ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                          : 'border-purple-200 focus:ring-purple-200 focus:border-purple-400'
                      }`}
                      placeholder="Confirm new password"
                    />
                    {confirmPassword && newPassword !== confirmPassword && (
                      <p className="text-red-600 text-xs mt-1">Passwords do not match</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-6 border-t border-purple-100">
              <button
                onClick={handleSave}
                disabled={saving || usernameAvailable === false || !fullName.trim() || !username.trim()}
                className="px-8 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}