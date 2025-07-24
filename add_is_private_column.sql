-- Add is_private column to schedule_entries table
ALTER TABLE schedule_entries ADD COLUMN is_private BOOLEAN DEFAULT FALSE;