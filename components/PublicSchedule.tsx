'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, ChevronLeft, ChevronRight, Clock, Lock } from 'lucide-react'
import type { ScheduleEntry } from '@/types'

interface PublicScheduleProps {
  username: string
}

const PublicSchedule = ({ username }: PublicScheduleProps) => {
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [scheduleData, setScheduleData] = useState<{ [dayIndex: number]: ScheduleEntry[] }>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Get the Monday of the current week
  const getMonday = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff))
  }

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: '2-digit', 
      day: '2-digit',
      year: 'numeric'
    })
  }

  // Get week string for storage key
  const getWeekKey = (date: Date) => {
    const monday = getMonday(date)
    return formatDate(monday)
  }

  // Get dates for the current week
  const getWeekDates = (startDate: Date) => {
    const dates = []
    const monday = getMonday(startDate)
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday)
      date.setDate(monday.getDate() + i)
      dates.push(date)
    }
    return dates
  }

  const weekDates = getWeekDates(currentWeek)
  const weekKey = getWeekKey(currentWeek)

  // Day names
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  // Fetch schedule data
  useEffect(() => {
    const fetchSchedule = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await fetch(`/api/public-schedule?username=${username}&weekKey=${encodeURIComponent(weekKey)}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('User not found')
          }
          throw new Error('Failed to load schedule')
        }

        const data = await response.json()
        setScheduleData(data.schedule || {})
      } catch (err: any) {
        setError(err.message)
        setScheduleData({})
      } finally {
        setLoading(false)
      }
    }

    fetchSchedule()
  }, [username, weekKey])

  // Navigate weeks
  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentWeek)
    newDate.setDate(currentWeek.getDate() + (direction * 7))
    setCurrentWeek(newDate)
  }

  // Get today's date for highlighting
  const today = new Date()
  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString()
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-blue-200 text-center max-w-md">
          <Calendar size={48} className="text-blue-400 mx-auto mb-4" />
          <h2 className="text-2xl font-light text-gray-800 mb-2">Schedule Not Available</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-light text-blue-800 mb-2">{username}'s Schedule</h1>
          <p className="text-blue-600">Public view • Read only</p>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center justify-center gap-6 mb-8">
          <button
            onClick={() => navigateWeek(-1)}
            className="flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-xl hover:bg-blue-50 shadow-md transition-all duration-200 border border-blue-200"
          >
            <ChevronLeft size={20} />
            Previous Week
          </button>
          
          <div className="text-center">
            <div className="text-2xl font-light text-blue-800 bg-white px-6 py-3 rounded-xl shadow-md border border-blue-200">
              {formatDate(weekDates[0])} - {formatDate(weekDates[6])}
            </div>
          </div>
          
          <button
            onClick={() => navigateWeek(1)}
            className="flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-xl hover:bg-blue-50 shadow-md transition-all duration-200 border border-blue-200"
          >
            Next Week
            <ChevronRight size={20} />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-blue-600 text-xl">Loading schedule...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {weekDates.map((date, dayIndex) => {
              const dayEntries = scheduleData[dayIndex] || []
              const todayHighlight = isToday(date)
              
              return (
                <div key={dayIndex} className={`bg-white rounded-2xl p-6 shadow-lg border transition-all duration-200 ${
                  todayHighlight 
                    ? 'border-blue-400 ring-2 ring-blue-200' 
                    : 'border-blue-200'
                }`}>
                  <div className="flex items-center justify-between mb-5">
                    <h3 className={`font-medium text-xl ${
                      todayHighlight ? 'text-blue-800' : 'text-blue-700'
                    }`}>
                      {dayNames[dayIndex]}
                    </h3>
                    <span className={`text-sm px-3 py-1 rounded-full ${
                      todayHighlight 
                        ? 'text-blue-700 bg-blue-100' 
                        : 'text-blue-500 bg-blue-50'
                    }`}>
                      {date.getMonth() + 1}/{date.getDate()}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {dayEntries.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <Clock size={24} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No events</p>
                      </div>
                    ) : (
                      dayEntries
                        .sort((a, b) => a.startTime.localeCompare(b.startTime))
                        .map((entry, index) => (
                          <div key={`${entry.id}-${index}`} className={`p-4 rounded-xl transition-all duration-200 ${
                            entry.isPrivate 
                              ? 'bg-gray-100 border border-gray-200' 
                              : 'bg-blue-50 border border-blue-100'
                          }`}>
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className={`text-sm font-medium ${
                                  entry.isPrivate ? 'text-gray-600' : 'text-blue-700'
                                }`}>
                                  {entry.endTime 
                                    ? `${entry.startTime} - ${entry.endTime}` 
                                    : entry.startTime
                                  }
                                </div>
                                {entry.isPrivate && (
                                  <Lock size={12} className="text-gray-400" />
                                )}
                              </div>
                            </div>
                            <div className={`text-sm ${
                              entry.isPrivate 
                                ? 'text-gray-500 italic' 
                                : 'text-blue-600'
                            }`}>
                              {entry.description || (entry.isPrivate ? 'Busy' : 'No description')}
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-blue-500 bg-white px-4 py-2 rounded-full shadow-sm border border-blue-200">
            <Lock size={14} />
            Private events shown as "Busy"
          </div>
        </div>
      </div>
    </div>
  )
}

export default PublicSchedule