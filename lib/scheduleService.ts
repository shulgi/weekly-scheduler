import { supabase } from './supabase'
import type { ScheduleEntry, DatabaseScheduleEntry } from '@/types'

export class ScheduleService {
  static async getWeekSchedule(weekKey: string): Promise<{ [dayIndex: number]: ScheduleEntry[] }> {
    const { data, error } = await supabase
      .from('schedule_entries')
      .select('*')
      .eq('week_key', weekKey)
      .order('start_time')

    if (error) {
      console.error('Error fetching schedule:', error)
      return {}
    }

    // Group entries by day_index
    const groupedData: { [dayIndex: number]: ScheduleEntry[] } = {}
    
    data?.forEach((entry: DatabaseScheduleEntry) => {
      if (!groupedData[entry.day_index]) {
        groupedData[entry.day_index] = []
      }
      
      groupedData[entry.day_index].push({
        id: entry.id,
        startTime: entry.start_time,
        endTime: entry.end_time || '',
        description: entry.description,
        isPrivate: entry.is_private || false
      })
    })

    return groupedData
  }

  static async saveEntry(
    weekKey: string,
    dayIndex: number,
    entry: Omit<ScheduleEntry, 'id'>
  ): Promise<ScheduleEntry | null> {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) return null

    const { data, error } = await supabase
      .from('schedule_entries')
      .insert({
        user_id: user.user.id,
        week_key: weekKey,
        day_index: dayIndex,
        start_time: entry.startTime,
        end_time: entry.endTime || null,
        description: entry.description,
        is_private: entry.isPrivate || false
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving entry:', error)
      return null
    }

    return {
      id: data.id,
      startTime: data.start_time,
      endTime: data.end_time || '',
      description: data.description,
      isPrivate: data.is_private || false
    }
  }

  static async updateEntry(entryId: string, updates: Partial<Omit<ScheduleEntry, 'id'>>): Promise<boolean> {
    const updateData: any = {}
    
    if (updates.startTime !== undefined) updateData.start_time = updates.startTime
    if (updates.endTime !== undefined) updateData.end_time = updates.endTime || null
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.isPrivate !== undefined) updateData.is_private = updates.isPrivate

    const { error } = await supabase
      .from('schedule_entries')
      .update(updateData)
      .eq('id', entryId)

    if (error) {
      console.error('Error updating entry:', error)
      return false
    }

    return true
  }

  static async deleteEntry(entryId: string): Promise<boolean> {
    const { error } = await supabase
      .from('schedule_entries')
      .delete()
      .eq('id', entryId)

    if (error) {
      console.error('Error deleting entry:', error)
      return false
    }

    return true
  }
}