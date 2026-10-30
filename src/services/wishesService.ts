import { supabase } from '../lib/supabase';
import { getUpcomingEventsForDashboard } from '../utils/formatters';
import type { WishWithDetails, DashboardStats, CalendarEventWithPerson } from '../types';

export interface GetWishesParams {
  isSent?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export const wishesService = {
  async getWishes(params: GetWishesParams = {}): Promise<{ data: WishWithDetails[]; count: number }> {
    const { isSent, search, page = 1, limit = 50 } = params;

    let query = supabase
      .from('wishes')
      .select('*, person:persons(*), event:events(*)', { count: 'exact' });

    if (isSent !== undefined) {
      if (isSent) {
        query = query.eq('isSent', true);
      } else {
        // Pending wishes: either false or null
        query = query.or('isSent.is.null,isSent.eq.false');
      }
    }

    query = query.order('created_at', { ascending: false });

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;
    if (error) {
      console.error('Error fetching wishes:', error);
      throw error;
    }

    let results = (data as unknown as WishWithDetails[]) || [];

    // Filter by search text in person full_name or event event_name client-side if joined search
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      results = results.filter((w) => {
        const personMatch = w.person?.full_name?.toLowerCase().includes(q);
        const eventMatch = w.event?.event_name?.toLowerCase().includes(q);
        const shortMatch = w.short_wish?.toLowerCase().includes(q);
        const longMatch = w.long_wish?.toLowerCase().includes(q);
        return Boolean(personMatch || eventMatch || shortMatch || longMatch);
      });
    }

    return {
      data: results,
      count: count || results.length,
    };
  },

  async getWishById(wishId: string): Promise<WishWithDetails> {
    const { data, error } = await supabase
      .from('wishes')
      .select('*, person:persons(*), event:events(*)')
      .eq('wish_id', wishId)
      .single();

    if (error) {
      console.error(`Error fetching wish ${wishId}:`, error);
      throw error;
    }

    return data as unknown as WishWithDetails;
  },

  async markAsSent(wishId: string): Promise<void> {
    const { error } = await supabase
      .from('wishes')
      .update({ isSent: true })
      .eq('wish_id', wishId);

    if (error) {
      console.error(`Error marking wish ${wishId} as sent:`, error);
      throw error;
    }
  },

  async markAsUnsent(wishId: string): Promise<void> {
    const { error } = await supabase
      .from('wishes')
      .update({ isSent: false })
      .eq('wish_id', wishId);

    if (error) {
      console.error(`Error reverting wish ${wishId} to unsent:`, error);
      throw error;
    }
  },

  async deleteWish(wishId: string): Promise<void> {
    const { error } = await supabase
      .from('wishes')
      .delete()
      .eq('wish_id', wishId);

    if (error) {
      console.error(`Error deleting wish ${wishId}:`, error);
      throw error;
    }
  },

  async getDashboardData(): Promise<{
    stats: DashboardStats;
    recentWishes: WishWithDetails[];
    upcomingEvents: CalendarEventWithPerson[];
  }> {
    // 1. Count persons
    const personsRes = await supabase.from('persons').select('person_id', { count: 'exact', head: true });
    const totalConnections = personsRes.count || 0;

    // 2. Count wishes (pending vs sent)
    const [pendingRes, sentRes] = await Promise.all([
      supabase.from('wishes').select('wish_id', { count: 'exact', head: true }).or('isSent.is.null,isSent.eq.false'),
      supabase.from('wishes').select('wish_id', { count: 'exact', head: true }).eq('isSent', true),
    ]);

    const pendingWishes = pendingRes.count || 0;
    const sentWishes = sentRes.count || 0;

    // 3. Fetch recent new wishes for quick action
    const { data: recentWishesData } = await supabase
      .from('wishes')
      .select('*, person:persons(*), event:events(*)')
      .or('isSent.is.null,isSent.eq.false')
      .order('created_at', { ascending: false })
      .limit(5);

    // 4. Fetch upcoming events
    const { data: eventsData } = await supabase
      .from('events')
      .select('*, person:persons(*)')
      .order('event_date', { ascending: true });

    const allEvents = (eventsData as CalendarEventWithPerson[]) || [];

    // Filter events for this month
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonthStr = String(today.getMonth() + 1).padStart(2, '0');

    const thisMonthEvents = allEvents.filter((ev) => {
      if (!ev.event_date) return false;
      const parts = ev.event_date.split('-');
      if (parts.length < 2) return false;
      const evMonth = parts[1];
      const evYear = parseInt(parts[0], 10);
      if (ev.isRecurring) return evMonth === currentMonthStr;
      return evMonth === currentMonthStr && evYear === currentYear;
    });

    return {
      stats: {
        totalConnections,
        upcomingEventsThisMonth: thisMonthEvents.length,
        pendingWishes,
        sentWishes,
      },
      recentWishes: (recentWishesData as unknown as WishWithDetails[]) || [],
      upcomingEvents: getUpcomingEventsForDashboard(allEvents).map((item) => item.event),
    };
  },
};
