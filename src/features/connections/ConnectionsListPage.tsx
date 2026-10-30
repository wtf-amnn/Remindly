import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { personsService } from '../../services/personsService';
import { APP_CONFIG, getRelationshipTypeBadge } from '../../config/appConfig';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { useToast } from '../../components/ui/ToastContext';
import { ConnectionModal } from './ConnectionModal';
import type { Person } from '../../types';
import {
  Search,
  Plus,
  Users,
  Building,
  Mail,
  Phone,
  Edit2,
  Trash2,
  ChevronRight,
  Filter,
  Sparkles,
} from 'lucide-react';

export const ConnectionsListPage: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [persons, setPersons] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [relFilter, setRelFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'full_name' | 'created_at'>('full_name');
  const [page, setPage] = useState(1);
  const limit = 24;

  // Modals
  const [modalPerson, setModalPerson] = useState<Person | null | undefined>(undefined); // undefined: closed, null: new, Person: edit
  const [deletingPerson, setDeletingPerson] = useState<Person | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchConnections = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await personsService.getPersons({
        search,
        gender: genderFilter,
        relationship: relFilter,
        sortBy,
        page,
        limit,
      });
      setPersons(res.data);
      setTotalCount(res.count);
    } catch (err: unknown) {
      console.error('Failed to load connections:', err);
      toastError('Could not load connections. Please check your Supabase configuration.');
    } finally {
      setIsLoading(false);
    }
  }, [search, genderFilter, relFilter, sortBy, page, toastError]);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  // Listen to global data mutation events
  useEffect(() => {
    const handleMutation = () => fetchConnections();
    window.addEventListener('rm_data_mutated', handleMutation);
    return () => window.removeEventListener('rm_data_mutated', handleMutation);
  }, [fetchConnections]);

  const handleDeleteConfirm = async () => {
    if (!deletingPerson) return;
    setIsDeleting(true);
    try {
      await personsService.deletePerson(deletingPerson.person_id);
      success(`Removed ${deletingPerson.full_name} from connections`);
      setDeletingPerson(null);
      fetchConnections();
    } catch (err: unknown) {
      console.error('Failed to delete person:', err);
      toastError('Failed to delete connection');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-indigo-400" />
            Your Connections
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Browse, manage, and nurture your personal and professional relationships ({totalCount} total)
          </p>
        </div>

        <Button
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setModalPerson(null)}
          className="font-semibold shrink-0"
        >
          Add Connection
        </Button>
      </div>

      {/* Search and Filters Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by full name, nickname..."
              className="w-full bg-slate-950/70 border border-slate-800 focus:border-indigo-500 rounded-xl py-2 pl-10 pr-4 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* Relationship Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <div className="flex items-center gap-1 text-xs text-slate-400 shrink-0">
              <Filter className="w-3.5 h-3.5" />
              <span>Filters:</span>
            </div>

            <select
              className="bg-slate-950/70 border border-slate-800 rounded-xl text-xs py-2 px-3 text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
              value={relFilter}
              onChange={(e) => {
                setRelFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Relationships</option>
              {APP_CONFIG.relationshipTypes.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>

            <select
              className="bg-slate-950/70 border border-slate-800 rounded-xl text-xs py-2 px-3 text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
              value={genderFilter}
              onChange={(e) => {
                setGenderFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Genders</option>
              {APP_CONFIG.genders.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>

            <select
              className="bg-slate-950/70 border border-slate-800 rounded-xl text-xs py-2 px-3 text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'full_name' | 'created_at')}
            >
              <option value="full_name">Sort: A to Z</option>
              <option value="created_at">Sort: Recently Added</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Connections */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : persons.length === 0 ? (
        <EmptyState
          icon={<Users className="w-7 h-7 text-indigo-400" />}
          title={search || relFilter !== 'all' ? 'No matching connections' : 'No connections yet'}
          description={
            search || relFilter !== 'all'
              ? 'Try adjusting your search filters to find what you are looking for.'
              : 'Add your first friend, colleague, or loved one to start tracking important moments.'
          }
          actionLabel="Add Connection"
          actionIcon={<Plus className="w-4 h-4" />}
          onAction={() => setModalPerson(null)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {persons.map((person) => {
            const relBadge = getRelationshipTypeBadge(person.relationship_to_me);
            const initials = person.full_name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);

            return (
              <Card
                key={person.person_id}
                hoverable
                className="flex flex-col justify-between group transition-all"
              >
                <div>
                  {/* Top Header Card */}
<div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 mb-3">
  <div className="flex items-center gap-3 min-w-0">
    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-900/60 to-purple-900/60 border border-indigo-500/30 flex items-center justify-center font-bold text-base text-indigo-300 shadow-inner shrink-0">
      {initials}
    </div>

    <div className="min-w-0 overflow-hidden">
      <Link
        to={`/connections/${person.person_id}`}
        className="font-semibold text-base text-white hover:text-indigo-300 transition-colors block truncate"
      >
        {person.full_name}
      </Link>

      {person.profession && (
        <div className="text-xs text-slate-400 truncate mt-0.5">
          {person.profession}
          {person.company && (
            <span className="text-slate-500"> at {person.company}</span>
          )}
        </div>
      )}
    </div>
  </div>

  <span
    className={`text-[11px] font-medium px-2.5 py-1 rounded-full border text-center leading-tight max-w-[110px] whitespace-normal break-words ${relBadge}`}
  >
    {person.relationship_to_me || 'Friend'}
  </span>
</div>

                  {/* Contact Badges */}
                  <div className="space-y-1.5 my-3 text-xs text-slate-400">
                    {person.email && (
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{person.email}</span>
                      </div>
                    )}
                    {person.phone && (
                      <div className="flex items-center gap-2 truncate">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{person.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Nicknames or Hobbies */}
                  {person.hobbies && person.hobbies.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {person.hobbies.slice(0, 3).map((h, idx) => (
                        <Badge key={idx} variant="default" className="text-[10px] py-0 px-2">
                          {h}
                        </Badge>
                      ))}
                      {person.hobbies.length > 3 && (
                        <span className="text-[10px] text-slate-400 self-center">
                          +{person.hobbies.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-between pt-3 mt-4 border-t border-slate-800/80">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setModalPerson(person)}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Edit Connection"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingPerson(person)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Delete Connection"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <Link
                    to={`/connections/${person.person_id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    View Profile
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination if more than limit */}
      {totalCount > limit && (
        <div className="flex items-center justify-center gap-3 pt-4">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="text-xs text-slate-400">
            Page {page} of {Math.ceil(totalCount / limit)}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= Math.ceil(totalCount / limit)}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Add / Edit Connection Modal */}
      {modalPerson !== undefined && (
        <ConnectionModal
          isOpen={modalPerson !== undefined}
          person={modalPerson}
          onClose={() => setModalPerson(undefined)}
          onSuccess={() => {
            setModalPerson(undefined);
            fetchConnections();
          }}
        />
      )}

      {/* Delete Confirmation */}
      {deletingPerson && (
        <ConfirmDialog
          isOpen={Boolean(deletingPerson)}
          title={`Delete ${deletingPerson.full_name}?`}
          message="Are you sure you want to delete this connection? All associated events and wishes for this person will also be removed."
          confirmLabel="Delete Connection"
          variant="danger"
          isLoading={isDeleting}
          onClose={() => setDeletingPerson(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
};
