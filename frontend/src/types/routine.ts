export interface RoutineNode {
  id: string;
  title: string;
  frequencyType: "daily" | "custom";
  frequencyDays: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  isArchived: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface RoutineLog {
  id: number;
  routineId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  createdAt: string;
}

export interface RoutineStats {
  currentStreak: number;
  last7Days: { date: string; completed: boolean; applicable: boolean }[];
  monthlySummaries: { month: string; completed: number; total: number }[];
}
