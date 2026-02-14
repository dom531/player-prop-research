-- Player Performance Database Schema
-- Run this SQL in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS player_performance (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  player_name TEXT NOT NULL,
  team TEXT,
  game_date DATE NOT NULL,
  opponent TEXT NOT NULL,
  is_home BOOLEAN DEFAULT true,
  minutes_played INTEGER,
  points INTEGER,
  rebounds INTEGER,
  assists INTEGER,
  usage_rate DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_player_performance_name
ON player_performance(player_name);

ALTER TABLE player_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access"
ON player_performance FOR SELECT
TO anon
USING (true);
