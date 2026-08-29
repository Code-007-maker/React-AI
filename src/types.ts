export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export type ReflectionTone = 'empathetic' | 'analytical' | 'socratic' | 'summarizer';

export type ReflectionCategory =
  | 'daily_journal'
  | 'deep_reflection'
  | 'goal_setting'
  | 'problem_solving'
  | 'gratitude'
  | 'brainstorming';

export type MoodType =
  | 'reflective'
  | 'energized'
  | 'calm'
  | 'focused'
  | 'overwhelmed'
  | 'grateful';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface JournalEntry {
  id?: string;
  userId: string;
  title: string;
  category: ReflectionCategory;
  mood?: MoodType;
  tone: ReflectionTone;
  messages: ChatMessage[];
  summary?: string;
  keyInsights?: string[];
  actionItems?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface ChatRequestPayload {
  messages: { role: 'user' | 'assistant'; content: string }[];
  tone?: ReflectionTone;
  category?: ReflectionCategory;
  contextTitle?: string;
}

export interface SummarizeRequestPayload {
  messages: { role: 'user' | 'assistant'; content: string }[];
  title?: string;
}

export interface SummarizeResponsePayload {
  summary: string;
  keyInsights: string[];
  actionItems: string[];
}
