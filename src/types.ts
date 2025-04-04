export interface Player {
  id: string;
  name: string;
  rank: number;
  position: number;
  matchesWon: number;
  matchesLost: number;
  currentStreak: number;
  challengesDeclined: number;
  lastChallengeResponse?: string;
  lives: number;
  lastMatchDate?: string;
  password: string; // 4-character PIN for player authentication
}

export interface Match {
  id: string;
  challengerId: string;
  defenderId: string;
  date: string;
  completed: boolean;
  winnerId?: string;
  score?: string;
}

export interface Challenge {
  id: string;
  challengerId: string;
  defenderId: string;
  date: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  responseDeadline: string;
  declineReason?: string;
  counterChallenge?: boolean;
}