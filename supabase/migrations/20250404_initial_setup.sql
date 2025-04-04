-- Create players table
CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  rank DECIMAL(3,1) NOT NULL,
  position INTEGER NOT NULL UNIQUE,
  matches_won INTEGER NOT NULL DEFAULT 0,
  matches_lost INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  challenges_declined INTEGER NOT NULL DEFAULT 0,
  lives INTEGER NOT NULL DEFAULT 2,
  password TEXT NOT NULL,
  last_match_date TIMESTAMPTZ,
  last_challenge_response TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create challenges table
CREATE TABLE IF NOT EXISTS challenges (
  id TEXT PRIMARY KEY,
  challenger_id TEXT NOT NULL REFERENCES players(id),
  defender_id TEXT NOT NULL REFERENCES players(id),
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'completed')),
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  response_deadline TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create matches table
CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  challenger_id TEXT NOT NULL REFERENCES players(id),
  defender_id TEXT NOT NULL REFERENCES players(id),
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  winner_id TEXT REFERENCES players(id),
  score TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_challenges_challenger_id ON challenges(challenger_id);
CREATE INDEX IF NOT EXISTS idx_challenges_defender_id ON challenges(defender_id);
CREATE INDEX IF NOT EXISTS idx_matches_challenger_id ON matches(challenger_id);
CREATE INDEX IF NOT EXISTS idx_matches_defender_id ON matches(defender_id);

-- Create RLS policies for secure access
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Create policies to allow anonymous access (for now)
CREATE POLICY "Allow anonymous select" ON players FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert" ON players FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update" ON players FOR UPDATE USING (true);

CREATE POLICY "Allow anonymous select" ON challenges FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert" ON challenges FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update" ON challenges FOR UPDATE USING (true);

CREATE POLICY "Allow anonymous select" ON matches FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert" ON matches FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update" ON matches FOR UPDATE USING (true);

-- Insert sample data
INSERT INTO players (id, name, rank, position, lives, password)
VALUES 
  ('1', 'Marius', 4.0, 1, 2, 'CAKE'),
  ('2', 'Hank', 4.0, 2, 2, 'BLUE'),
  ('3', 'Simon', 4.0, 3, 2, 'DUCK'),
  ('4', 'Fabian', 4.0, 4, 2, 'JAZZ'),
  ('5', 'Ben', 4.5, 5, 2, 'MINT'),
  ('6', 'Elie', 4.0, 6, 2, 'KITE'),
  ('7', 'Maximilien', 4.5, 7, 2, 'FROG'),
  ('8', 'Mathias', 4.0, 8, 2, 'LIME'),
  ('9', 'Pickles', 4.5, 9, 2, 'ROCK'),
  ('10', 'Benjamin', 4.5, 10, 2, 'WOLF'),
  ('11', 'Jeffrey', 4.5, 11, 2, 'SALT'),
  ('12', 'Massih', 4.5, 12, 2, 'NEST'),
  ('13', 'Chris', 4.0, 13, 2, 'MOON'),
  ('14', 'Igor M.', 4.5, 14, 2, 'PEAK'),
  ('15', 'Bas', 4.0, 15, 2, 'FISH')
ON CONFLICT (id) DO NOTHING;
