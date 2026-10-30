import React, { useState, useEffect, useCallback } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { wishesService } from '../../services/wishesService';
import { formatDate, getDaysUntilEvent, getUpcomingEventsForDashboard } from '../../utils/formatters';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { WishDetailModal } from '../wishes/WishDetailModal';
import { EventModal } from '../events/EventModal';
import { useToast } from '../../components/ui/ToastContext';
import type { DashboardStats, WishWithDetails, CalendarEventWithPerson } from '../../types';
import {
  Users,
  Calendar,
  Sparkles,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';

interface LayoutContext {
  openAddConnection?: () => void;
}

export const DashboardPage: React.FC = () => {
  const { openAddConnection } = useOutletContext<LayoutContext>() || {};
  const { error: toastError } = useToast();

  const [stats, setStats] = useState<DashboardStats>({
    totalConnections: 0,
    upcomingEventsThisMonth: 0,
    pendingWishes: 0,
    sentWishes: 0,
  });
  const [recentWishes, setRecentWishes] = useState<WishWithDetails[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEventWithPerson[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [selectedWish, setSelectedWish] = useState<WishWithDetails | null>(null);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await wishesService.getDashboardData();
      setStats(data.stats);
      setRecentWishes(data.recentWishes);
      setUpcomingEvents(data.upcomingEvents);
    } catch (err: unknown) {
      console.error('Failed to load dashboard:', err);
      toastError('Could not load dashboard metrics. Check Supabase connection.');
    } finally {
      setIsLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Filter and sort events for the upcoming events calendar:
  // - Display only events occurring from today through the next 30 days (inclusive).
  // - Sort events chronologically, with the nearest upcoming event first.
  // - Exclude past events.
  const dashboardUpcomingEvents = getUpcomingEventsForDashboard(upcomingEvents);

  const groupedEvents = dashboardUpcomingEvents.reduce<Record<string, CalendarEventWithPerson[]>>(
    (acc, item) => {
      const key = item.upcomingDateStr;
      if (!acc[key]) acc[key] = [];
      acc[key].push(item.event);
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-900 border border-indigo-500/20 p-6 sm:p-8 backdrop-blur-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-medium text-indigo-300">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Relationship Intelligence Center</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Stay Thoughtfully Connected
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Track important dates, remember personal details, and send thoughtful wishes to stay connected.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {openAddConnection && (
              <Button
                variant="primary"
                icon={<Plus className="w-4 h-4" />}
                onClick={openAddConnection}
                className="font-semibold shadow-lg shadow-indigo-600/30"
              >
                Add Connection
              </Button>
            )}
            <Button
              variant="outline"
              icon={<Calendar className="w-4 h-4" />}
              onClick={() => setIsAddEventOpen(true)}
            >
              Add Event
            </Button>
          </div>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute right-0 top-0 -mt-12 -mr-12 w-80 h-80 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 -mb-12 w-64 h-64 rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Total Connections */}
        <Link to="/connections" className="block group">
          <Card className="hover:border-indigo-500/40 transition-all p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Connections
              </span>
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                <Users className="w-4 h-4" />
              </div>
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {stats.totalConnections}
              </div>
            )}
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 group-hover:text-indigo-300 transition-colors">
              <span>View full directory</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </Card>
        </Link>

        {/* Stat 2: Upcoming Events This Month */}
        <Link to="/events" className="block group">
          <Card className="hover:border-purple-500/40 transition-all p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                This Month
              </span>
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {stats.upcomingEventsThisMonth}
              </div>
            )}
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 group-hover:text-purple-300 transition-colors">
              <span>Events in current month</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </Card>
        </Link>

        {/* Stat 3: Pending Wishes */}
        <Link to="/wishes" className="block group">
          <Card className="hover:border-amber-500/40 transition-all p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Wishes Ready
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl sm:text-3xl font-bold text-amber-300 tracking-tight">
                {stats.pendingWishes}
              </div>
            )}
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 group-hover:text-amber-300 transition-colors">
              <span>Awaiting dispatch</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </Card>
        </Link>

        {/* Stat 4: Sent Wishes */}
        <Link to="/wishes" className="block group">
          <Card className="hover:border-emerald-500/40 transition-all p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Wishes Sent
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl sm:text-3xl font-bold text-emerald-300 tracking-tight">
                {stats.sentWishes}
              </div>
            )}
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 group-hover:text-emerald-300 transition-colors">
              <span>Dispatched to friends</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </Card>
        </Link>
      </div>

      {/* Main Grid: Pending Wishes Action Center & Upcoming Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Wishes Action Center */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              Wishes Awaiting Action
            </h2>
            <Link
              to="/wishes"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
            >
              View All Wishes
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-28 w-full rounded-2xl" />
              <Skeleton className="h-28 w-full rounded-2xl" />
            </div>
          ) : recentWishes.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-sm font-semibold text-slate-200">No New Wishes Pending</h3>

            </div>
          ) : (
            <div className="space-y-3">
              {recentWishes.map((wish) => {
                const person = wish.person;
                const event = wish.event;

                return (
                  <Card
                    key={wish.wish_id}
                    hoverable
                    onClick={() => setSelectedWish(wish)}
                    className="cursor-pointer border-slate-800 hover:border-indigo-500/40 p-4 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-indigo-950/70 border border-indigo-500/20 flex items-center justify-center font-bold text-xs text-indigo-300 shrink-0">
                          {person?.full_name ? person.full_name[0].toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div className="text-xs sm:text-sm font-semibold text-white">
                            {person?.full_name || 'Connection'}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {event?.event_name || 'Event'} • {formatDate(event?.event_date)}
                          </div>
                        </div>
                      </div>

                      <Badge variant="warning" className="text-[10px] shrink-0">
                        Ready to Send
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 mb-3">
                      {wish.short_wish || wish.long_wish || wish.mail_wish?.subject || 'Personalized message prepared.'}
                    </p>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
                      <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                        {wish.long_wish && <span className="text-emerald-400">WhatsApp</span>}
                        {wish.short_wish && <span className="text-indigo-400">SMS</span>}
                        {wish.mail_wish && <span className="text-sky-400">Email</span>}
                      </div>

                      <span className="font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                        Review & Send &rarr;
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Upcoming Events Grouped by Date */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-400" />
              Upcoming Events Calendar
            </h2>
            <Link
              to="/events"
              className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
            >
              View All Events
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-20 w-full rounded-2xl" />
            </div>
          ) : Object.keys(groupedEvents).length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mx-auto">
                <Calendar className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-sm font-semibold text-slate-200">No Events Scheduled</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Add birthdays, milestones, and anniversaries for your connections to keep track of
                important life moments.
              </p>
              <Button
                variant="secondary"
                size="sm"
                icon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => setIsAddEventOpen(true)}
              >
                Add Your First Event
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedEvents).map(([dateStr, eventsOnDate]) => {
                const sampleEv = eventsOnDate[0];
                const countdown = getDaysUntilEvent(dateStr, sampleEv.isRecurring);

                return (
                  <div
                    key={dateStr}
                    className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm space-y-2.5"
                  >
                    {/* Date group heading */}
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">
                          {formatDate(dateStr)}
                        </span>
                      </div>
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
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

                    {/* Events on this date */}
                    <div className="space-y-2">
                      {eventsOnDate.map((ev) => (
                        <div
                          key={ev.event_id}
                          className="flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                            <span className="font-semibold text-slate-200 truncate">
                              {ev.event_name}
                            </span>
                            {ev.person && (
                              <Link
                                to={`/connections/${ev.person.person_id}`}
                                className="text-indigo-400 hover:text-indigo-300 truncate"
                              >
                                for {ev.person.full_name}
                              </Link>
                            )}
                          </div>

                          {ev.isRecurring && (
                            <span className="text-[10px] text-slate-400 shrink-0">
                              Annual
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Wish Detail & Sending Modal */}
      {selectedWish && (
        <WishDetailModal
          isOpen={Boolean(selectedWish)}
          wish={selectedWish}
          onClose={() => setSelectedWish(null)}
          onStatusChanged={() => {
            setSelectedWish(null);
            fetchDashboard();
          }}
        />
      )}

      {/* Add Event Modal */}
      {isAddEventOpen && (
        <EventModal
          isOpen={isAddEventOpen}
          onClose={() => setIsAddEventOpen(false)}
          onSuccess={() => {
            setIsAddEventOpen(false);
            fetchDashboard();
          }}
        />
      )}
    </div>
  );
};
