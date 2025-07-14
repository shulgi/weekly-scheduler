export interface ScheduleEntry {
  id: string;
  startTime: string;
  endTime: string;
  description: string;
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
  created_at: string;
  updated_at: string;
}