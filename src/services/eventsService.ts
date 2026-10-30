import { supabase } from '../lib/supabase';
import type { CalendarEvent, CalendarEventInsert, CalendarEventUpdate, CalendarEventWithPerson } from '../types';

export const eventsService = {
  async getEvents(params: { personId?: string; limit?: number } = {}): Promise<CalendarEventWithPerson[]> {
    let query = supabase
      .from('events')
      .select('*, person:persons(*)');

    if (params.personId) {
      query = query.eq('person_id', params.personId);
    }

    query = query.order('event_date', { ascending: true });

    if (params.limit) {
      query = query.limit(params.limit);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching events:', error);
      throw error;
    }

    return (data as CalendarEventWithPerson[]) || [];
  },

  async getUpcomingEventsThisMonth(): Promise<CalendarEventWithPerson[]> {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // 1-12
    const currentMonthStr = String(currentMonth).padStart(2, '0');

    // Fetch all events with person info
    const { data, error } = await supabase
      .from('events')
      .select('*, person:persons(*)')
      .order('event_date', { ascending: true });

    if (error) {
      console.error('Error fetching events this month:', error);
      throw error;
    }

    const allEvents = (data as CalendarEventWithPerson[]) || [];

    // Filter events that fall in the current month (or recurring ones)
    const thisMonthEvents = allEvents.filter((ev) => {
      if (!ev.event_date) return false;
      const parts = ev.event_date.split('-');
      if (parts.length < 2) return false;
      const evMonth = parts[1];
      const evYear = parseInt(parts[0], 10);

      // If it's recurring, it matches if month equals current month
      if (ev.isRecurring) {
        return evMonth === currentMonthStr;
      }
      // If one-off, check year and month
      return evMonth === currentMonthStr && evYear === currentYear;
    });

    return thisMonthEvents;
  },

  async createEvent(payload: CalendarEventInsert): Promise<CalendarEvent> {
    const { data, error } = await supabase
      .from('events')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('Error creating event:', error);
      throw error;
    }

    return data as CalendarEvent;
  },

  async updateEvent(eventId: string, updates: CalendarEventUpdate): Promise<CalendarEvent> {
    const { data, error } = await supabase
      .from('events')
      .update(updates)
      .eq('event_id', eventId)
      .select()
      .single();

    if (error) {
      console.error(`Error updating event ${eventId}:`, error);
      throw error;
    }

    return data as CalendarEvent;
  },

  async deleteEvent(eventId: string): Promise<void> {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('event_id', eventId);

    if (error) {
      console.error(`Error deleting event ${eventId}:`, error);
      throw error;
    }
  },
};
