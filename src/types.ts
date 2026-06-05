export interface Habit {
  id: string;
  name: string;
  category: "health" | "learning" | "mind" | "routine" | "fitness" | string;
  streak: number;
  bestStreak: number;
  color: string; // Color coding (e.g., hex or tailwind class)
  history: { [dateStr: string]: boolean }; // 'YYYY-MM-DD' -> true if completed
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  date: string; // 'YYYY-MM-DD'
  title: string;
  content: string;
  mood: number; // 1 (Terrible) to 5 (Wonderful)
  createdAt: string;
}

export interface CoachInsight {
  overallMood: string;
  sentimentScore: number; // 0 to 100
  bulletAdvice: string[];
  encouragement: string;
  challenge: string;
  focusWord: string;
  generatedAt: string;
}
