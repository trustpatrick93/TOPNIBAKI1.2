export interface DiaryEntry {
  id: string;
  content: string;
  createdAt: string; // ISO String
  category: string; // e.g., 'Work', 'Personal', 'Growth'
}

export interface WeeklyTask {
  id: string;
  dayOfWeek: number; // 0 for Sunday, 1 for Monday, etc.
  title: string;
  timeStart: string; // "HH:MM"
  timeEnd: string; // "HH:MM"
  completed: boolean;
  syncTarget: boolean; // Sync with Google Calendar
  gcalEventId?: string; // Connected Google Calendar event ID
  monthlyEventId?: string; // Linked MonthlyEvent ID
  date?: string; // Scheduled date in YYYY-MM-DD format
}

export type EventStatus = 'pending' | 'completed' | 'canceled';

export interface MonthlyEvent {
  id: string;
  title: string;
  start: string; // "YYYY-MM-DD" or ISO date-time string
  end: string;   // "YYYY-MM-DD" or ISO date-time string
  status: EventStatus;
  cancelReason?: string;
  gcalEventId?: string;
  isGcalOnly?: boolean; // Event fetched from Google Calendar that is synced
  weeklyTaskId?: string; // Linked WeeklyTask ID
}

export interface Category {
  id: string;
  name: string;
  color: string; // HEX or Tailwind color class
}
