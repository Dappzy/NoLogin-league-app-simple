import { supabase } from '../supabase';
import type { Player, Challenge, Match } from '../types';

// Player functions
export async function fetchPlayers(): Promise<Player[]> {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .order('position', { ascending: true });
  
  if (error) {
    console.error('Error fetching players:', error);
    return [];
  }
  
  // Convert snake_case to camelCase for our frontend
  return data.map(player => ({
    id: player.id,
    name: player.name,
    rank: player.rank,
    position: player.position,
    matchesWon: player.matches_won,
    matchesLost: player.matches_lost,
    currentStreak: player.current_streak,
    challengesDeclined: player.challenges_declined,
    lives: player.lives,
    weeklyMatches: player.weekly_matches,
    password: player.password,
    lastMatchDate: player.last_match_date,
    lastChallengeResponse: player.last_challenge_response
  }));
}

export async function updatePlayer(player: Player): Promise<void> {
  const { error } = await supabase
    .from('players')
    .update({
      name: player.name,
      rank: player.rank,
      position: player.position,
      matches_won: player.matchesWon,
      matches_lost: player.matchesLost,
      current_streak: player.currentStreak,
      challenges_declined: player.challengesDeclined,
      lives: player.lives,
      password: player.password,
      last_match_date: player.lastMatchDate,
      last_challenge_response: player.lastChallengeResponse
    })
    .eq('id', player.id);
  
  if (error) {
    console.error('Error updating player:', error);
  }
}

export async function updatePlayersBatch(players: Player[]): Promise<void> {
  const updates = players.map(player => ({
    id: player.id,
    name: player.name,
    rank: player.rank,
    position: player.position,
    matches_won: player.matchesWon,
    matches_lost: player.matchesLost,
    current_streak: player.currentStreak,
    challenges_declined: player.challengesDeclined,
    lives: player.lives,
    password: player.password,
    last_match_date: player.lastMatchDate,
    last_challenge_response: player.lastChallengeResponse
  }));

  // Supabase doesn't have built-in batch update, so we need to use upsert
  const { error } = await supabase
    .from('players')
    .upsert(updates);
  
  if (error) {
    console.error('Error batch updating players:', error);
  }
}

// Challenge functions
export async function fetchChallenges(): Promise<Challenge[]> {
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .order('date', { ascending: false });
  
  if (error) {
    console.error('Error fetching challenges:', error);
    return [];
  }
  
  return data.map(challenge => ({
    id: challenge.id,
    challengerId: challenge.challenger_id,
    defenderId: challenge.defender_id,
    status: challenge.status as 'pending' | 'accepted' | 'declined' | 'completed',
    date: challenge.date,
    responseDeadline: challenge.response_deadline
  }));
}

export async function createChallenge(challenge: Challenge): Promise<string | null> {
  const { data, error } = await supabase
    .from('challenges')
    .insert({
      id: challenge.id,
      challenger_id: challenge.challengerId,
      defender_id: challenge.defenderId,
      status: challenge.status,
      date: challenge.date,
      response_deadline: challenge.responseDeadline
    })
    .select('id')
    .single();
  
  if (error) {
    console.error('Error creating challenge:', error);
    return null;
  }
  
  return data.id;
}

export async function updateChallenge(challenge: Challenge): Promise<void> {
  const { error } = await supabase
    .from('challenges')
    .update({
      challenger_id: challenge.challengerId,
      defender_id: challenge.defenderId,
      status: challenge.status,
      date: challenge.date,
      response_deadline: challenge.responseDeadline
    })
    .eq('id', challenge.id);
  
  if (error) {
    console.error('Error updating challenge:', error);
  }
}

// Match functions
export async function fetchMatches(): Promise<Match[]> {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .order('date', { ascending: false });
  
  if (error) {
    console.error('Error fetching matches:', error);
    return [];
  }
  
  return data.map(match => ({
    id: match.id,
    challengerId: match.challenger_id,
    defenderId: match.defender_id,
    date: match.date,
    completed: match.completed,
    winnerId: match.winner_id,
    score: match.score
  }));
}

export async function createMatch(match: Match): Promise<string | null> {
  const { data, error } = await supabase
    .from('matches')
    .insert({
      id: match.id,
      challenger_id: match.challengerId,
      defender_id: match.defenderId,
      date: match.date,
      completed: match.completed,
      winner_id: match.winnerId,
      score: match.score
    })
    .select('id')
    .single();
  
  if (error) {
    console.error('Error creating match:', error);
    return null;
  }
  
  return data.id;
}

// Subscribe to realtime changes
export function subscribeToPlayers(callback: (players: Player[]) => void): () => void {
  const subscription = supabase
    .channel('public:players')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => {
      fetchPlayers().then(callback);
    })
    .subscribe();
  
  return () => {
    supabase.removeChannel(subscription);
  };
}

export function subscribeToChallenges(callback: (challenges: Challenge[]) => void): () => void {
  const subscription = supabase
    .channel('public:challenges')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'challenges' }, () => {
      fetchChallenges().then(callback);
    })
    .subscribe();
  
  return () => {
    supabase.removeChannel(subscription);
  };
}

export function subscribeToMatches(callback: (matches: Match[]) => void): () => void {
  const subscription = supabase
    .channel('public:matches')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => {
      fetchMatches().then(callback);
    })
    .subscribe();
  
  return () => {
    supabase.removeChannel(subscription);
  };
}
