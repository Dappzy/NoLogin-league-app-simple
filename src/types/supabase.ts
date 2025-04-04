export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      players: {
        Row: {
          id: string
          name: string
          rank: number
          position: number
          matches_won: number
          matches_lost: number
          current_streak: number
          challenges_declined: number
          lives: number
          weekly_matches: number
          password: string
          last_match_date: string | null
          last_challenge_response: string | null
          created_at: string
        }
        Insert: {
          id: string
          name: string
          rank: number
          position: number
          matches_won?: number
          matches_lost?: number
          current_streak?: number
          challenges_declined?: number
          lives?: number
          weekly_matches?: number
          password: string
          last_match_date?: string | null
          last_challenge_response?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          rank?: number
          position?: number
          matches_won?: number
          matches_lost?: number
          current_streak?: number
          challenges_declined?: number
          lives?: number
          weekly_matches?: number
          password?: string
          last_match_date?: string | null
          last_challenge_response?: string | null
          created_at?: string
        }
      }
      challenges: {
        Row: {
          id: string
          challenger_id: string
          defender_id: string
          status: string
          date: string
          response_deadline: string
          created_at: string
        }
        Insert: {
          id: string
          challenger_id: string
          defender_id: string
          status: string
          date: string
          response_deadline: string
          created_at?: string
        }
        Update: {
          id?: string
          challenger_id?: string
          defender_id?: string
          status?: string
          date?: string
          response_deadline?: string
          created_at?: string
        }
      }
      matches: {
        Row: {
          id: string
          challenger_id: string
          defender_id: string
          date: string
          completed: boolean
          winner_id: string
          score: string
          created_at: string
        }
        Insert: {
          id: string
          challenger_id: string
          defender_id: string
          date: string
          completed: boolean
          winner_id: string
          score: string
          created_at?: string
        }
        Update: {
          id?: string
          challenger_id?: string
          defender_id?: string
          date?: string
          completed?: boolean
          winner_id?: string
          score?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
