export interface Profile {
  id: string;
  full_name: string | null;
  username: string | null;
  bio: string | null;
  total_xp: number;
  created_at: string;
  updated_at: string;
}

export interface Deck {
  id: string;
  user_id: string;
  title: string;
  source_filename: string | null;
  source_text?: string | null;
  last_studied_at: string | null;
  created_at: string;
  question_count?: number;
}

export interface Question {
  id: string;
  deck_id: string;
  question: string;
  options: string[];
  correct_answer: string;
  hint: string;
  explanation: string;
  order_index: number;
}

export interface SessionQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  hint: string;
  explanation: string;
  isReview?: boolean;
  reviewType?: "failed" | "explained";
}

export interface QuestionReview {
  id: string;
  user_id: string;
  deck_id: string;
  question: string;
  question_hash: string;
  correct_answer: string;
  options: string[];
  hint: string;
  explanation: string;
  review_type: "failed" | "explained";
  times_seen: number;
  last_seen_at: string;
}

export interface GeneratedQuestion {
  question: string;
  correct_answer: string;
  options: string[];
  hint: string;
  explanation: string;
}
