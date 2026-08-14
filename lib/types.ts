export type GamePhase = "lobby" | "question" | "reveal" | "leaderboard";

export interface GameRow {
  code: string;
  status: "lobby" | "active" | "finished";
  phase: GamePhase;
  current_question: number;
  total_questions: number;
  question_started_at: string | null;
  created_at: string;
}

export interface TeamRow {
  id: string;
  game_code: string;
  name: string;
  color: string;
  joined_at: string;
}

export interface PublicQuestion {
  idx: number;
  total: number;
  question: string;
  options: string[];
  timeLimit: number;
}

export interface RevealQuestion extends PublicQuestion {
  correctIndex: number;
  explanation: string;
}

export interface LeaderboardEntry {
  teamId: string;
  name: string;
  color: string;
  score: number;
  correct: number;
}
