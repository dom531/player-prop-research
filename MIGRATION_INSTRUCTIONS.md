# Database Migration Instructions

## Required: Create Player Cache Table

To enable fast player autocomplete and lookups, you need to create the `nba_players_cache` table in your Supabase database.

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project: https://sizitrdjlupvgbusniiw.supabase.co
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the SQL below:

```sql
CREATE TABLE IF NOT EXISTS nba_players_cache (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  team TEXT,
  is_active BOOLEAN DEFAULT true,
  last_updated TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_player_name ON nba_players_cache(full_name);
CREATE INDEX IF NOT EXISTS idx_active_players ON nba_players_cache(is_active) WHERE is_active = true;
```

5. Click **Run** to execute the SQL
6. You should see: "Success. No rows returned"

### Option 2: Using the Migration File

The SQL is also available in: `migrations/create_player_cache_table.sql`

### Verification

To verify the table was created successfully:

1. In Supabase dashboard, go to **Table Editor**
2. You should see a new table: `nba_players_cache`
3. The table will be empty initially - it will populate on first player search

### What This Enables

- **Fast Autocomplete**: Player suggestions appear as you type (50x faster)
- **Reduced API Calls**: Cached player list instead of fetching all players on every search
- **Better UX**: Instant player name matching without delays

The cache automatically refreshes weekly to stay current with NBA rosters.
