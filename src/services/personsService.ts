import { supabase } from '../lib/supabase';
import type { Person, PersonInsert, PersonUpdate, CalendarEvent, Wish } from '../types';

export interface GetPersonsParams {
  search?: string;
  gender?: string;
  relationship?: string;
  sortBy?: 'full_name' | 'created_at';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const personsService = {
  async getPersons(params: GetPersonsParams = {}): Promise<{ data: Person[]; count: number }> {
    const {
      search,
      gender,
      relationship,
      sortBy = 'full_name',
      sortOrder = 'asc',
      page = 1,
      limit = 50,
    } = params;

    let query = supabase.from('persons').select('*', { count: 'exact' });

    if (search && search.trim()) {
      query = query.ilike('full_name', `%${search.trim()}%`);
    }

    if (gender && gender !== 'all') {
      query = query.eq('gender', gender);
    }

    if (relationship && relationship !== 'all') {
      query = query.ilike('relationship_to_me', relationship);
    }

    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;
    if (error) {
      console.error('Error fetching persons:', error);
      throw error;
    }

    return {
      data: (data as Person[]) || [],
      count: count || 0,
    };
  },

  async getPersonById(personId: string): Promise<Person> {
    const { data, error } = await supabase
      .from('persons')
      .select('*')
      .eq('person_id', personId)
      .single();

    if (error) {
      console.error(`Error fetching person with id ${personId}:`, error);
      throw error;
    }

    return data as Person;
  },

  async getPersonEventsAndWishes(personId: string): Promise<{ events: CalendarEvent[]; wishes: Wish[] }> {
    const [eventsRes, wishesRes] = await Promise.all([
      supabase
        .from('events')
        .select('*')
        .eq('person_id', personId)
        .order('event_date', { ascending: true }),
      supabase
        .from('wishes')
        .select('*')
        .eq('person_id', personId)
        .order('created_at', { ascending: false }),
    ]);

    if (eventsRes.error) console.error('Error fetching person events:', eventsRes.error);
    if (wishesRes.error) console.error('Error fetching person wishes:', wishesRes.error);

    return {
      events: (eventsRes.data as CalendarEvent[]) || [],
      wishes: (wishesRes.data as Wish[]) || [],
    };
  },

  async createPerson(payload: PersonInsert): Promise<Person> {
    const { data, error } = await supabase
      .from('persons')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('Error creating person:', error);
      throw error;
    }

    return data as Person;
  },

  async updatePerson(personId: string, updates: PersonUpdate): Promise<Person> {
    const { data, error } = await supabase
      .from('persons')
      .update(updates)
      .eq('person_id', personId)
      .select()
      .single();

    if (error) {
      console.error(`Error updating person ${personId}:`, error);
      throw error;
    }

    return data as Person;
  },

  async deletePerson(personId: string): Promise<void> {
    const { error } = await supabase
      .from('persons')
      .delete()
      .eq('person_id', personId);

    if (error) {
      console.error(`Error deleting person ${personId}:`, error);
      throw error;
    }
  },
};
