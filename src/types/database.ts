export interface MemoryItem {
  id?: string;
  title: string;
  date?: string;
  description: string;
  tags?: string[];
}

export interface MailWishPayload {
  subject?: string;
  body?: string;
}

export interface Person {
  person_id: string;
  full_name: string;
  gender: string | null;
  profession: string | null;
  company: string | null;
  phone: string | null;
  whatsapp_phone: string | null;
  email: string | null;
  relationship_to_me: string | null;
  communication_style: string[] | null;
  nicknames: string[] | null;
  hobbies: string[] | null;
  likes: string[] | null;
  dislikes: string[] | null;
  memories: MemoryItem[] | Record<string, unknown> | null;
  notes: string[] | null;
  created_at: string | null;
}

export type PersonInsert = Omit<Person, 'person_id' | 'created_at'> & {
  person_id?: string;
  created_at?: string;
};

export type PersonUpdate = Partial<Omit<Person, 'person_id'>>;

export interface CalendarEvent {
  event_id: string;
  event_name: string;
  event_date: string; // YYYY-MM-DD
  isRecurring: boolean;
  created_at: string;
  person_id: string | null;
}

export type CalendarEventInsert = Omit<CalendarEvent, 'event_id' | 'created_at'> & {
  event_id?: string;
  created_at?: string;
};

export type CalendarEventUpdate = Partial<Omit<CalendarEvent, 'event_id'>>;

export interface CalendarEventWithPerson extends CalendarEvent {
  person?: Person | null;
}

export interface Wish {
  wish_id: string;
  created_at: string;
  mail_wish: MailWishPayload | null;
  short_wish: string | null;
  long_wish: string | null;
  event_id: string | null;
  person_id: string | null;
  isSent: boolean | null;
}

export type WishInsert = Omit<Wish, 'wish_id' | 'created_at'> & {
  wish_id?: string;
  created_at?: string;
};

export type WishUpdate = Partial<Omit<Wish, 'wish_id'>>;

export interface WishWithDetails extends Wish {
  person?: Person | null;
  event?: CalendarEvent | null;
}

export interface DashboardStats {
  totalConnections: number;
  upcomingEventsThisMonth: number;
  pendingWishes: number;
  sentWishes: number;
}
