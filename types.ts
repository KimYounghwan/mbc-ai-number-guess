
export interface Guess {
  value: number;
  feedback: 'High' | 'Low' | 'Correct';
  timestamp: number;
}

export interface GameState {
  targetNumber: number;
  guesses: Guess[];
  isGameOver: boolean;
  statusMessage: string;
  aiCommentary: string;
  isAiLoading: boolean;
}

export enum Difficulty {
  EASY = 'EASY',
  NORMAL = 'NORMAL',
  HARD = 'HARD'
}
