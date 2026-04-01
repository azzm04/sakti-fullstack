export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  created_at: Date;
  updated_at: Date;
}

export interface TelegramStatus {
  is_activated: boolean;
  chat_id?: string;
  username?: string;
  last_notification?: Date;
}

export interface Candidate {
  rank: number;
  id: string;
  name: string;
  ipk: number;
  parent_income: number;
  topsis_score: number;
  recommendation_status: 'Prioritas Utama' | 'Direkomendasikan' | 'Cadangan';
}

export interface RankingResult {
  candidates: Candidate[];
  total: number;
  page: number;
  total_pages: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'mahasiswa' | 'admin';
  student_id?: string;
  major?: string;
}