-- Cache tables for daily homepage (NBA trends, injuries, schedule)

CREATE TABLE IF NOT EXISTS homepage_trends_cache (
  id BIGSERIAL PRIMARY KEY,
  sport TEXT NOT NULL,
  as_of TIMESTAMPTZ NOT NULL,
  player_name TEXT NOT NULL,
  team TEXT,
  prop_type TEXT NOT NULL,
  line NUMERIC NOT NULL,
  best_book TEXT,
  over_odds INTEGER,
  hit_rate NUMERIC,
  consistency NUMERIC,
  volatility NUMERIC,
  edge_score NUMERIC,
  risk_level TEXT,
  sample_size INTEGER,
  meta_json JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_homepage_trends_sport_as_of
  ON homepage_trends_cache (sport, as_of DESC);

CREATE INDEX IF NOT EXISTS idx_homepage_trends_edge
  ON homepage_trends_cache (edge_score DESC);

CREATE TABLE IF NOT EXISTS homepage_injuries_cache (
  id BIGSERIAL PRIMARY KEY,
  sport TEXT NOT NULL,
  player_name TEXT NOT NULL,
  team TEXT,
  injury TEXT,
  status TEXT,
  updated_at TIMESTAMPTZ NOT NULL,
  source TEXT
);

CREATE INDEX IF NOT EXISTS idx_homepage_injuries_updated
  ON homepage_injuries_cache (updated_at DESC);

CREATE TABLE IF NOT EXISTS homepage_schedule_cache (
  id BIGSERIAL PRIMARY KEY,
  sport TEXT NOT NULL,
  game_date DATE NOT NULL,
  away_team TEXT NOT NULL,
  home_team TEXT NOT NULL,
  tipoff_time TIMESTAMPTZ,
  game_status TEXT,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_homepage_schedule_game_date
  ON homepage_schedule_cache (game_date DESC);

CREATE INDEX IF NOT EXISTS idx_homepage_schedule_updated
  ON homepage_schedule_cache (updated_at DESC);
