import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { ScheduleEntry } from '@/types'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const username = searchParams.get('username')
  const weekKey = searchParams.get('weekKey')

  if (!username || !weekKey) {
    return NextResponse.json(
      { error: 'Username and weekKey are required' },
      { status: 400 }
    )
  }

  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // First, find the user by username
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id')
      .ilike('username', username)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get the user's schedule entries for the specified week
    const { data: entries, error: entriesError } = await supabase
      .from('schedule_entries')
      .select('*')
      .eq('user_id', profile.id)
      .eq('week_key', weekKey)
      .order('start_time')

    if (entriesError) {
      console.error('Error fetching schedule entries:', entriesError)
      return NextResponse.json(
        { error: 'Failed to fetch schedule' },
        { status: 500 }
      )
    }

    // Group entries by day and transform them for public viewing
    const groupedData: { [dayIndex: number]: any[] } = {}

    entries?.forEach((entry) => {
      if (!groupedData[entry.day_index]) {
        groupedData[entry.day_index] = []
      }

      // Transform private entries to show as "busy"
      const publicEntry = {
        id: entry.id,
        startTime: entry.start_time,
        endTime: entry.end_time || '',
        description: entry.is_private ? 'Busy' : entry.description,
        isPrivate: entry.is_private
      }

      groupedData[entry.day_index].push(publicEntry)
    })

    return NextResponse.json({
      schedule: groupedData,
      username: username
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}