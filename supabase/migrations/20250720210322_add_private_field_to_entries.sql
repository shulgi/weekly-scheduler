-- Add is_private field to schedule_entries table
ALTER TABLE schedule_entries 
ADD COLUMN is_private BOOLEAN NOT NULL DEFAULT FALSE;