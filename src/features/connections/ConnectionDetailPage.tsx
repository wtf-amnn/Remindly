import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { personsService } from '../../services/personsService';
import { getRelationshipTypeBadge } from '../../config/appConfig';
import { buildWhatsAppUrl, buildMailtoUrl, formatDate, getDaysUntilEvent } from '../../utils/formatters';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { ConnectionModal } from './ConnectionModal';
import { EventModal } from '../events/EventModal';
import { WishDetailModal } from '../wishes/WishDetailModal';
import { useToast } from '../../components/ui/ToastContext';
import type { Person, CalendarEvent, Wish, MemoryItem, WishWithDetails } from '../../types';
import {
  ArrowLeft,
  Mail,
  Phone,
  MessageCircle,
  Edit2,
  Trash2,
  Calendar,
  Sparkles,
  Building,
  Heart,
  BookOpen,
  Plus,
  Clock,
  CheckCircle2,
} from 'lucide-react';

export const ConnectionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [person, setPerson] = useState<Person | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [selectedWish, setSelectedWish] = useState<WishWithDetails | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const [personData, relData] = await Promise.all([
        personsService.getPersonById(id),
        personsService.getPersonEventsAndWishes(id),
      ]);
      setPerson(personData);
      setEvents(relData.events);
      setWishes(relData.wishes);
    } catch (err: unknown) {
      console.error('Failed to load connection:', err);
      toastError('Could not load connection details');
    } finally {
      setIsLoading(false);
    }
  }, [id, toastError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async () => {
    if (!person) return;
    setIsDeleting(true);
    try {
      await personsService.deletePerson(person.person_id);
      success(`Deleted ${person.full_name}`);
      navigate('/connections');
    } catch (err: unknown) {
      console.error('Failed to delete person:', err);
      toastError('Failed to delete connection');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-slate-400">Loading connection profile...</p>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="text-center py-20 space-y-4">
        <h2 className="text-xl font-bold text-white">Connection Not Found</h2>
        <p className="text-sm text-slate-400">This profile may have been removed or does not exist.</p>
        <Button variant="secondary" onClick={() => navigate('/connections')} icon={<ArrowLeft className="w-4 h-4" />}>
          Back to Directory
        </Button>
      </div>
    );
  }

  const relBadge = getRelationshipTypeBadge(person.relationship_to_me);
  const initials = person.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const whatsappUrl = buildWhatsAppUrl(person.whatsapp_phone || person.phone, `Hi ${person.full_name}! Thinking of you.`);
  const mailtoUrl = buildMailtoUrl(person.email, `Checking in`, `Hi ${person.full_name},\n\nHope you are having a wonderful week!`);

  const memoriesList: MemoryItem[] = Array.isArray(person.memories)
    ? (person.memories as MemoryItem[])
    : [];

  return (
    <div className="space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/connections"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Connections
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<Edit2 className="w-3.5 h-3.5" />}
            onClick={() => setIsEditOpen(true)}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={<Trash2 className="w-3.5 h-3.5 text-rose-400" />}
            onClick={() => setIsDeleteOpen(true)}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Main Profile Header Card */}
      <Card className="relative overflow-hidden border-indigo-500/20 bg-gradient-to-b from-indigo-950/20 via-slate-900/60 to-slate-900/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-pink-500 p-0.5 shadow-xl shadow-indigo-600/20 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center font-bold text-2xl text-indigo-300">
                {initials}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {person.full_name}
                </h1>
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${relBadge}`}>
                  {person.relationship_to_me || 'Friend'}
                </span>
              </div>

              {(person.profession || person.company) && (
                <div className="text-xs sm:text-sm text-slate-400 mt-1 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>
                    {person.profession}
                    {person.company && ` at ${person.company}`}
                  </span>
                </div>
              )}

              {person.nicknames && person.nicknames.length > 0 && (
                <div className="text-xs text-indigo-300/80 mt-1">
                  Known as: {person.nicknames.join(', ')}
                </div>
              )}
            </div>
          </div>

          {/* Quick Contact Action Buttons */}
          <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
            {/* WhatsApp */}
            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 transition-all cursor-pointer"
                title="Send WhatsApp message"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>WhatsApp</span>
              </a>
            ) : (
              <button
                disabled
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-slate-800/40 text-slate-500 border border-slate-800 cursor-not-allowed"
                title="No WhatsApp phone provided"
              >
                <MessageCircle className="w-4 h-4" />
                <span>No WhatsApp</span>
              </button>
            )}

            {/* Email */}
            {mailtoUrl ? (
              <a
                href={mailtoUrl}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-sky-600/20 text-sky-300 border border-sky-500/30 hover:bg-sky-600/30 transition-all cursor-pointer"
                title="Send email"
              >
                <Mail className="w-4 h-4 text-sky-400" />
                <span>Email</span>
              </a>
            ) : (
              <button
                disabled
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-slate-800/40 text-slate-500 border border-slate-800 cursor-not-allowed"
                title="No email address provided"
              >
                <Mail className="w-4 h-4" />
                <span>No Email</span>
              </button>
            )}

            {/* Call */}
            {person.phone ? (
              <a
                href={`tel:${person.phone}`}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 transition-all cursor-pointer"
                title="Call phone"
              >
                <Phone className="w-4 h-4 text-indigo-400" />
                <span className="hidden sm:inline">Call</span>
              </a>
            ) : null}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Personal Context & Traits */}
        <div className="lg:col-span-1 space-y-6">
          {/* Contact Details */}
          <Card>
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Phone className="w-4 h-4 text-indigo-400" /> Contact Info
            </h3>
            <div className="space-y-2.5 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Email Address</span>
                <span className="text-slate-200 font-medium">
                  {person.email || <span className="text-slate-600 italic">Not set</span>}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Primary Phone</span>
                <span className="text-slate-200 font-medium">
                  {person.phone || <span className="text-slate-600 italic">Not set</span>}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">WhatsApp Number</span>
                <span className="text-slate-200 font-medium">
                  {person.whatsapp_phone || person.phone || <span className="text-slate-600 italic">Not set</span>}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Gender</span>
                <span className="text-slate-200 font-medium">
                  {person.gender || <span className="text-slate-600 italic">Unspecified</span>}
                </span>
              </div>
            </div>
          </Card>

          {/* Communication Style */}
          <Card>
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" /> Communication Style
            </h3>
            {person.communication_style && person.communication_style.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {person.communication_style.map((style, i) => (
                  <Badge key={i} variant="primary" className="text-xs py-1">
                    {style}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No communication style recorded yet.</p>
            )}
          </Card>

          {/* Interests & Notes */}
          <Card>
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Heart className="w-4 h-4 text-pink-400" /> Interests & Notes
            </h3>
            <div className="space-y-3 text-xs">
              {person.hobbies && person.hobbies.length > 0 && (
                <div>
                  <span className="text-slate-400 block text-[11px] mb-1">Hobbies</span>
                  <div className="flex flex-wrap gap-1">
                    {person.hobbies.map((h, i) => (
                      <Badge key={i} variant="default" className="text-[11px]">
                        {h}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {person.likes && person.likes.length > 0 && (
                <div>
                  <span className="text-emerald-400 block text-[11px] mb-1">Likes</span>
                  <p className="text-slate-300">{person.likes.join(', ')}</p>
                </div>
              )}

              {person.dislikes && person.dislikes.length > 0 && (
                <div>
                  <span className="text-rose-400 block text-[11px] mb-1">Dislikes</span>
                  <p className="text-slate-300">{person.dislikes.join(', ')}</p>
                </div>
              )}

              {person.notes && person.notes.length > 0 && (
                <div className="pt-2 border-t border-slate-800">
                  <span className="text-slate-400 block text-[11px] mb-1">Notes</span>
                  <ul className="list-disc list-inside space-y-1 text-slate-300 leading-relaxed">
                    {person.notes.map((note, i) => (
                      <li key={i}>{note}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Events, Wishes, and Memories */}
        <div className="lg:col-span-2 space-y-6">
          {/* Associated Events */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-400" />
                Tracked Events ({events.length})
              </h3>
              <Button
                size="sm"
                variant="outline"
                icon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => setIsAddEventOpen(true)}
                className="text-xs py-1"
              >
                Add Event
              </Button>
            </div>

            {events.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl">
                No events tracked for {person.full_name}. Add a birthday or anniversary!
              </div>
            ) : (
              <div className="space-y-2">
                {events.map((ev) => {
                  const countdown = getDaysUntilEvent(ev.event_date, ev.isRecurring);

                  return (
                    <div
                      key={ev.event_id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-950/70 border border-indigo-500/20 flex flex-col items-center justify-center text-indigo-300 shrink-0">
                          <span className="text-[10px] font-semibold uppercase">
                            {ev.event_date ? new Date(ev.event_date).toLocaleString('default', { month: 'short' }) : 'Event'}
                          </span>
                          <span className="text-xs font-bold leading-none">
                            {ev.event_date ? ev.event_date.split('-')[2] : '--'}
                          </span>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-white">{ev.event_name}</div>
                          <div className="text-[11px] text-slate-400">
                            {formatDate(ev.event_date)}
                            {ev.isRecurring && <span className="text-indigo-400 ml-1.5">(Annual)</span>}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          countdown.isToday
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
                            : countdown.days <= 7 && !countdown.isPast
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {countdown.text}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Generated Wishes */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Generated Wishes ({wishes.length})
              </h3>
            </div>

            {wishes.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl">
                No wishes currently generated for this connection. Wishes are automatically prepared by n8n when upcoming events approach.
              </div>
            ) : (
              <div className="space-y-3">
                {wishes.map((w) => {
                  const enrichedWish: WishWithDetails = {
                    ...w,
                    person,
                  };

                  return (
                    <div
                      key={w.wish_id}
                      onClick={() => setSelectedWish(enrichedWish)}
                      className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/40 cursor-pointer transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-slate-500" />
                          Generated {formatDate(w.created_at)}
                        </span>
                        {w.isSent ? (
                          <Badge variant="success" className="text-[11px] gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Sent
                          </Badge>
                        ) : (
                          <Badge variant="warning" className="text-[11px]">
                            New Wish Awaiting Action
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed">
                        {w.short_wish || w.long_wish || w.mail_wish?.subject || 'Custom Wish Message'}
                      </p>

                      <div className="flex items-center gap-2 text-[11px] text-indigo-400 font-medium pt-1">
                        Review & Send &rarr;
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Shared Memories */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-400" />
                Shared Memories ({memoriesList.length})
              </h3>
            </div>

            {memoriesList.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl">
                No memories recorded yet. Edit this connection to add shared trips, projects, or milestones.
              </div>
            ) : (
              <div className="relative pl-4 space-y-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                {memoriesList.map((m, idx) => (
                  <div key={m.id || idx} className="relative">
                    <div className="absolute -left-[19px] top-1.5 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-slate-900" />
                    <div className="text-xs font-semibold text-white">
                      {m.title}
                      {m.date && <span className="text-slate-400 font-normal ml-2">({m.date})</span>}
                    </div>
                    {m.description && (
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">{m.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Edit Connection Modal */}
      {isEditOpen && (
        <ConnectionModal
          isOpen={isEditOpen}
          person={person}
          onClose={() => setIsEditOpen(false)}
          onSuccess={() => {
            setIsEditOpen(false);
            loadData();
          }}
        />
      )}

      {/* Add Event Modal */}
      {isAddEventOpen && (
        <EventModal
          isOpen={isAddEventOpen}
          initialPersonId={person.person_id}
          onClose={() => setIsAddEventOpen(false)}
          onSuccess={() => {
            setIsAddEventOpen(false);
            loadData();
          }}
        />
      )}

      {/* Wish Detail & Sending Modal */}
      {selectedWish && (
        <WishDetailModal
          isOpen={Boolean(selectedWish)}
          wish={selectedWish}
          onClose={() => setSelectedWish(null)}
          onStatusChanged={() => {
            setSelectedWish(null);
            loadData();
          }}
        />
      )}

      {/* Delete Confirmation */}
      {isDeleteOpen && (
        <ConfirmDialog
          isOpen={isDeleteOpen}
          title={`Delete ${person.full_name}?`}
          message="Are you sure you want to delete this connection? All associated events and wishes will also be removed."
          confirmLabel="Delete Connection"
          variant="danger"
          isLoading={isDeleting}
          onClose={() => setIsDeleteOpen(false)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
};
