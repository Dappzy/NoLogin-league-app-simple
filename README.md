# 🏆 Championship Ladder

A real-time sports ladder tournament system with a dynamic challenge system and innovative lives mechanic. Built with React, TypeScript, and Supabase.

## 📋 Overview

Championship Ladder is a modern, real-time ladder tournament system built for sports communities. Players challenge others above them to climb the rankings, with a unique "lives" system that ensures fair play and active participation.

## ✨ Current Features

- **Dynamic Challenge System**
  - Challenge players up to 3 positions above you
  - Top 5 players can challenge 2 positions above
  - 7-day match completion timeframe

- **Lives System**
  - Players start with 2 lives
  - Issuing challenges costs 1 life
  - Accepting challenges earns 1 life (max 5)
  - Prevents both ranking camping and challenge spamming

- **Mobile-Optimized Interface**
  - Responsive design works on all devices
  - Clean player standings view
  - One-click challenging and response system
  - WhatsApp integration for direct communication

## 🚀 Getting Started

### Prerequisites
- Node.js 16.x or higher
- A Supabase account

### Installation

1. Clone the repository
```bash
git clone https://github.com/Dappzy/NoLogin-league-app-simple.git
cd NoLogin-league-app-simple
```

2. Install dependencies
```bash
npm install
```

3. Create a Supabase project and database

4. Create `.env` file with your Supabase credentials
```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

> **Important Note for Setup:** When deploying your own version of this app, you must create your own Supabase project and database. This ensures your instance will be completely isolated from the live version. Each Supabase project has its own unique URL and API keys, so there's no risk of interference with the original app.

5. Start the development server
```bash
npm run dev
```

## 💾 Database Schema

The app uses a Supabase database with the following main tables:

- **players** - Player profiles and statistics
- **challenges** - Active and historical challenges between players
- **matches** - Completed matches with results and position changes

<details>
<summary>View complete schema</summary>

```sql
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
```

</details>

## 🔧 Tech Stack

- **React** - Frontend framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Supabase** - Database and auth

## 🗺️ Roadmap

Future features we're planning to add:

- **Admin Dashboard** - For managing players, matches, and ladder rankings
- **Season Management** - Automated season resets and historical data
- **Statistics Dashboard** - Detailed player stats and visualizations
- **Tournament Mode** - Bracket-style tournaments alongside the ladder
- **Notification System** - Email and push notifications for challenges
- **Public API** - For third-party integrations

## 👥 Contributing

Contributions are welcome! If you'd like to help improve the Championship Ladder app, please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add some amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgements

- Special thanks to Bali Social Club for the inspiration
- All the padel players in Bali who tested and provided feedback

---

<div align="center">
  <sub>Built with ❤️ by <a href="https://github.com/Dappzy">Dappzy</a></sub>
</div>
