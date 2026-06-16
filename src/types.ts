export type TaskType = 'homework' | 'exam' | 'project' | 'study';

export const SUBJECTS = [
  'Math', 'Science', 'History', 'Literature', 'Language', 'Computer Science', 'Art', 'Other'
] as const;

export type SubjectOption = typeof SUBJECTS[number];

export interface Task {
  id: string;
  title: string;
  type: TaskType;
  subject?: string;
  description?: string;
  dueDate: string;
  completed: boolean;
  notes?: string;
  createdAt: string;
  completedAt?: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  iconType: 'early-bird' | 'master-planner' | 'first-step' | 'streak';
  earnedAt: string;
}

export interface UserState {
  points: number;
  badges: Badge[];
  currentStreak: number;
  lastCompletedDate?: string;
}
