-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create schedule_entries table
CREATE TABLE schedule_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    week_key TEXT NOT NULL,
    day_index INTEGER NOT NULL CHECK (day_index >= 0 AND day_index <= 6),
    start_time TEXT NOT NULL,
    end_time TEXT,
    description TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_schedule_entries_user_id ON schedule_entries(user_id);
CREATE INDEX idx_schedule_entries_week_key ON schedule_entries(user_id, week_key);
CREATE INDEX idx_schedule_entries_day ON schedule_entries(user_id, week_key, day_index);

-- Enable Row Level Security on schedule_entries
ALTER TABLE schedule_entries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own schedule entries" ON schedule_entries
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own schedule entries" ON schedule_entries
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own schedule entries" ON schedule_entries
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own schedule entries" ON schedule_entries
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_schedule_entries_updated_at
    BEFORE UPDATE ON schedule_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();