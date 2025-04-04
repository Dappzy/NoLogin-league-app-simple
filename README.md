# 🏆 Championship Ladder

A real-time sports ladder tournament system with a balanced "lives" mechanic. Players challenge upward to climb rankings while maintaining fair play through an innovative lives system that encourages both offensive challenges and defensive matches. Built with React, TypeScript, and Supabase.

<div align="center">
  
  ![Championship Ladder](https://via.placeholder.com/800x400.png?text=Championship+Ladder+Screenshot)
  
  **A real-time sports ladder tournament system with balanced gameplay**
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
  [![GitHub](https://img.shields.io/badge/GitHub-Dappzy-blue?logo=github)](https://github.com/Dappzy)
  [![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-4.9-blue)](https://www.typescriptlang.org/)
  [![Supabase](https://img.shields.io/badge/Supabase-2.0-green)](https://supabase.io/)
  [![Tailwind](https://img.shields.io/badge/Tailwind-3.0-blue)](https://tailwindcss.com/)
  
</div>

## 📋 Overview

Championship Ladder is a modern, real-time ladder tournament system built for sports communities. Players challenge others above them to climb the rankings, with a unique "lives" system that ensures fair play and active participation from all competitors.

<div align="center">
  <img src="https://via.placeholder.com/800x400.png?text=Lives+System+Screenshot" width="80%" alt="Lives System"/>
</div>

## ✨ Features

<table>
  <tr>
    <td width="50%">
      <h3>🔄 Dynamic Challenge System</h3>
      <ul>
        <li>Challenge players up to 3 positions above you</li>
        <li>Top 5 players can challenge 2 positions above</li>
        <li>Real-time challenge notifications</li>
        <li>7-day match completion timeframe</li>
      </ul>
    </td>
    <td width="50%">
      <img src="https://via.placeholder.com/400x200.png?text=Challenge+System" width="100%" alt="Challenge System"/>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src="https://via.placeholder.com/400x200.png?text=Lives+System" width="100%" alt="Lives System"/>
    </td>
    <td width="50%">
      <h3>❤️ Innovative Lives System</h3>
      <ul>
        <li>Start with 2 lives</li>
        <li>Issuing challenges costs 1 life</li>
        <li>Accepting challenges earns 1 life (max 5)</li>
        <li>Prevents ranking camping and challenge spamming</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>📱 Mobile-Optimized Interface</h3>
      <ul>
        <li>Responsive design works on all devices</li>
        <li>Clean, intuitive UI for player standings</li>
        <li>Quick actions for challenging and responding</li>
        <li>WhatsApp integration for player communication</li>
      </ul>
    </td>
    <td width="50%">
      <img src="https://via.placeholder.com/400x200.png?text=Mobile+Interface" width="100%" alt="Mobile Interface"/>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src="https://via.placeholder.com/400x200.png?text=Admin+Panel" width="100%" alt="Admin Panel"/>
    </td>
    <td width="50%">
      <h3>🔐 Admin Controls</h3>
      <ul>
        <li>Manage player profiles</li>
        <li>Oversee challenges and match results</li>
        <li>Reset or modify ladder rankings</li>
        <li>Season management with automated resets</li>
      </ul>
    </td>
  </tr>
</table>

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account (for database and authentication)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/Dappzy/NoLogin-league-app-simple.git
   cd NoLogin-league-app-simple
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

4. Run the development server
   ```bash
   npm run dev
   # or
   yarn dev
   ```

## 🧠 The Lives System Explained

The lives system is the core mechanic that makes Championship Ladder fair and engaging:

<div align="center">
  <table>
    <tr>
      <th>Problem</th>
      <th>Solution</th>
    </tr>
    <tr>
      <td>Higher-ranked players could refuse all challenges to protect their position</td>
      <td>Players gain lives by accepting challenges, incentivizing them to play matches even when they have more to lose than gain</td>
    </tr>
    <tr>
      <td>Lower-ranked players could spam challenges without accepting matches from below</td>
      <td>Challenges cost lives, creating a resource that must be managed and earned through fair play</td>
    </tr>
    <tr>
      <td>Inactive players holding positions</td>
      <td>Without playing matches to earn lives, players eventually can't challenge upward</td>
    </tr>
  </table>
</div>

This creates a balanced ladder where players must both challenge upward and defend their position.

## 📊 Database Schema

The application uses Supabase with the following main tables:

> **Important Note for Setup:** When deploying your own version of this app, you must create your own Supabase project and database. This ensures your instance will be completely isolated from the live version. Each Supabase project has its own unique URL and API keys, so there's no risk of interference with the original app.

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

<div align="center">
  <table>
    <tr>
      <td align="center" width="96">
        <img src="https://skillicons.dev/icons?i=react" width="48" height="48" alt="React" />
        <br>React
      </td>
      <td align="center" width="96">
        <img src="https://skillicons.dev/icons?i=ts" width="48" height="48" alt="TypeScript" />
        <br>TypeScript
      </td>
      <td align="center" width="96">
        <img src="https://skillicons.dev/icons?i=tailwind" width="48" height="48" alt="Tailwind" />
        <br>Tailwind
      </td>
      <td align="center" width="96">
        <a href="https://supabase.com/">
          <img src="https://avatars.githubusercontent.com/u/54469796?s=48&v=4" width="48" height="48" alt="Supabase" />
        </a>
        <br>Supabase
      </td>
    </tr>
  </table>
</div>

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgements

- Special thanks to Bali Social Club for the inspiration
- All the padel players in Bali who tested and provided feedback

---

<div align="center">
  <sub>Built with ❤️ for the love of the game</sub>
  <br>
  <sub>Created by <a href="https://github.com/Dappzy">Dappzy</a></sub>
</div>
