-- Run this in Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)

-- Players table
CREATE TABLE players (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  stats JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Matches table
CREATE TABLE matches (
  id TEXT PRIMARY KEY,
  game_mode TEXT NOT NULL,
  starting_score INTEGER NOT NULL,
  player_ids TEXT[] NOT NULL,
  player_names TEXT[] NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  current_player_index INTEGER NOT NULL DEFAULT 0,
  scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  winner_id TEXT,
  winner_name TEXT,
  created_at BIGINT NOT NULL,
  completed_at BIGINT,
  turns JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- H2H records table
CREATE TABLE h2h_records (
  id TEXT PRIMARY KEY,
  player1_id TEXT NOT NULL,
  player2_id TEXT NOT NULL,
  player1_wins INTEGER NOT NULL DEFAULT 0,
  player2_wins INTEGER NOT NULL DEFAULT 0,
  total_matches INTEGER NOT NULL DEFAULT 0,
  last_played BIGINT NOT NULL
);

-- App state (for active match ID, etc.)
CREATE TABLE app_state (
  key TEXT PRIMARY KEY,
  value JSONB
);

-- Insert default active match state
INSERT INTO app_state (key, value) VALUES ('active_match_id', 'null'::jsonb);

-- Indexes for common queries
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_created_at ON matches(created_at);
CREATE INDEX idx_h2h_players ON h2h_records(player1_id, player2_id);

-- Disable RLS (Row Level Security) for public access (Option A: no auth)
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE h2h_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_state ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access to all tables
CREATE POLICY "Allow all access to players" ON players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to matches" ON matches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to h2h_records" ON h2h_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to app_state" ON app_state FOR ALL USING (true) WITH CHECK (true);
