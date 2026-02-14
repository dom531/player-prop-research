-- Create player cache table for fast autocomplete and lookups
-- This reduces API calls from 2-3 seconds to ~50ms per search

CREATE TABLE IF NOT EXISTS nba_players_cache (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  team TEXT,
  is_active BOOLEAN DEFAULT true,
  last_updated TIMESTAMP DEFAULT NOW()
);

-- Create index for fast name lookups
CREATE INDEX IF NOT EXISTS idx_player_name
ON nba_players_cache(full_name);

-- Create index for active players only
CREATE INDEX IF NOT EXISTS idx_active_players
ON nba_players_cache(is_active) WHERE is_active = true;

-- Add comment
COMMENT ON TABLE nba_players_cache IS 'Cached list of NBA players for fast autocomplete and ID lookups. Refreshes weekly.';
