import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { eventsService } from '../../services/eventsService';
import {
  formatDate,
  getDaysUntilEvent,
  isEventInDateRange,
  DATE_RANGE_OPTIONS,
  type DateRangeFilter,
} from '../../utils/formatters';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EventModal } from './EventModal';
import { useToast } from '../../components/ui/ToastContext';
import type { CalendarEventWithPerson } from '../../types';
import {
  Calendar,
  Plus,
  Repeat,
  User,
  Trash2,
  Edit2,
  Search,
  Filter,
} from 'lucide-react';

export const EventsPage: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [events, setEvents] = useState<CalendarEventWithPerson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState<DateRangeFilter>('All Events');

  // Modals
  const [modalEvent, setModalEvent] = useState<CalendarEventWithPerson | null | undefined>(undefined);
  const [deletingEvent, setDeletingEvent] = useState<CalendarEventWithPerson | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await eventsService.getEvents();
      setEvents(data);
    } catch (err: unknown) {
      console.error('Failed to load events:', err);
      toastError('Could not load events');
    } finally {
      setIsLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleDelete = async () => {
    if (!deletingEvent) return;
    setIsDeleting(true);
    try {
      await eventsService.deleteEvent(deletingEvent.event_id);
      success(`Deleted event: ${deletingEvent.event_name}`);
      setDeletingEvent(null);
      fetchEvents();
    } catch (err: unknown) {
      console.error('Failed to delete event:', err);
      toastError('Failed to delete event');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredEvents = events.filter((ev) => {
    // 1. Date Range Filter
    const matchesDate = isEventInDateRange(ev.event_date, ev.isRecurring, dateFilter);
    if (!matchesDate) return false;

    // 2. Search Text Filter
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const eventMatch = ev.event_name.toLowerCase().includes(q);
    const personMatch = ev.person?.full_name.toLowerCase().includes(q);
    return Boolean(eventMatch || personMatch);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Calendar className="w-6 h-6 text-indigo-400" />
            Events & Milestones
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Birthdays, anniversaries, and personal milestones that inspire thoughtful wishes
          </p>
        </div>

        <Button
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setModalEvent(null)}
          className="font-semibold shrink-0"
        >
          Add Event
        </Button>
      </div>

      {/* Search and Filters Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search events by name or person..."
              className="w-full bg-slate-950/70 border border-slate-800 focus:border-indigo-500 rounded-xl py-2 pl-10 pr-4 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Date Range Select Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              id="events-date-range-filter"
              aria-label="Filter events by date range"
              className="bg-slate-950/70 border border-slate-800 rounded-xl text-xs py-2 px-3 text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer w-full sm:w-auto"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as DateRangeFilter)}
            >
              <option value="All Events">All Events</option>
              <option value="Next 7 Days">Next 7 Days</option>
              <option value="Next 30 Days">Next 30 Days</option>
              <option value="Past 7 Days">Past 7 Days</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Pill Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-[11px] text-slate-400 font-medium mr-1 hidden sm:inline">Range:</span>
          {DATE_RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setDateFilter(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                dateFilter === opt.value
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'bg-slate-950/40 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800/80'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Events List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <EmptyState
          icon={<Calendar className="w-7 h-7 text-indigo-400" />}
          title={search || dateFilter !== 'All Events' ? 'No matching events found' : 'No events scheduled'}
          description={
            search || dateFilter !== 'All Events'
              ? 'Try adjusting your search query or date range filter to view other events.'
              : 'Add birthdays, milestones, or anniversaries to get wishes prepared automatically.'
          }
          actionLabel="Add Event"
          actionIcon={<Plus className="w-4 h-4" />}
          onAction={() => setModalEvent(null)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEvents.map((ev) => {
            const countdown = getDaysUntilEvent(ev.event_date, ev.isRecurring);

            return (
              <Card key={ev.event_id} hoverable className="flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-indigo-950/70 border border-indigo-500/20 flex flex-col items-center justify-center text-indigo-300 shrink-0">
                        <span className="text-[10px] font-semibold uppercase">
                          {ev.event_date ? new Date(ev.event_date).toLocaleString('default', { month: 'short' }) : 'Date'}
                        </span>
                        <span className="text-sm font-bold leading-none">
                          {ev.event_date ? ev.event_date.split('-')[2] : '--'}
                        </span>
                      </div>
                      <div className="overflow-hidden">
                        <h3 className="text-sm font-semibold text-white truncate">{ev.event_name}</h3>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {formatDate(ev.event_date)}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${
                        countdown.isToday
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/30 animate-pulse'
                          : countdown.days <= 7 && !countdown.isPast
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {countdown.text}
                    </span>
                  </div>

                  {/* Association & Recurring Badges */}
                  <div className="space-y-2 my-3">
                    {ev.person ? (
                      <Link
                        to={`/connections/${ev.person.person_id}`}
                        className="flex items-center gap-2 text-xs text-indigo-300 hover:text-indigo-200 transition-colors p-2 rounded-lg bg-slate-950/50 border border-slate-800/80"
                      >
                        <User className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="truncate font-medium">{ev.person.full_name}</span>
                        {ev.person.relationship_to_me && (
                          <span className="text-[10px] text-slate-400 capitalize">
                            ({ev.person.relationship_to_me})
                          </span>
                        )}
                      </Link>
                    ) : (
                      <div className="text-xs text-slate-500 italic p-2 rounded-lg bg-slate-950/30 border border-slate-800/40">
                        General Event
                      </div>
                    )}

                    {ev.isRecurring && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <Repeat className="w-3 h-3 text-indigo-400" />
                        <span>Repeats annually</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-end gap-1 pt-3 border-t border-slate-800/80">
                  <button
                    onClick={() => setModalEvent(ev)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    title="Edit Event"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingEvent(ev)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    title="Delete Event"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modalEvent !== undefined && (
        <EventModal
          isOpen={modalEvent !== undefined}
          event={modalEvent}
          onClose={() => setModalEvent(undefined)}
          onSuccess={() => {
            setModalEvent(undefined);
            fetchEvents();
          }}
        />
      )}

      {/* Delete Dialog */}
      {deletingEvent && (
        <ConfirmDialog
          isOpen={Boolean(deletingEvent)}
          title={`Delete ${deletingEvent.event_name}?`}
          message="Are you sure you want to remove this event? Any related generated wishes will also be unlinked."
          confirmLabel="Delete Event"
          variant="danger"
          isLoading={isDeleting}
          onClose={() => setDeletingEvent(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
};
