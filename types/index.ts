export interface ScheduleEntry {
  id: string;
  startTime: string;
  endTime: string;
  description: string;
  isPrivate: boolean;
}

export interface WeekSchedule {
  [dayIndex: number]: ScheduleEntry[];
}

export interface ScheduleData {
  [weekKey: string]: WeekSchedule;
}

export interface DatabaseScheduleEntry {
  id: string;
  user_id: string;
  week_key: string;
  day_index: number;
  start_time: string;
  end_time: string;
  description: string;
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}