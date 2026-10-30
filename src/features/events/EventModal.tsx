import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/ToastContext';
import { eventsService } from '../../services/eventsService';
import { personsService } from '../../services/personsService';
import type { CalendarEvent, CalendarEventInsert, Person } from '../../types';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  event?: CalendarEvent | null;
  initialPersonId?: string | null;
}

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  event,
  initialPersonId,
}) => {
  const { success, error: toastError } = useToast();
  const isEditing = Boolean(event);

  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [isRecurring, setIsRecurring] = useState(true);
  const [personId, setPersonId] = useState<string>('');
  const [personsList, setPersonsList] = useState<Person[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ eventName?: string; eventDate?: string }>({});

  useEffect(() => {
    // Load persons for selector
    personsService.getPersons({ limit: 200 }).then((res) => {
      setPersonsList(res.data);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (event) {
      setEventName(event.event_name);
      setEventDate(event.event_date);
      setIsRecurring(Boolean(event.isRecurring));
      setPersonId(event.person_id || '');
    } else {
      setEventName('');
      // Default date to today formatted YYYY-MM-DD
      const now = new Date();
      const yr = now.getFullYear();
      const mo = String(now.getMonth() + 1).padStart(2, '0');
      const da = String(now.getDate()).padStart(2, '0');
      setEventDate(`${yr}-${mo}-${da}`);
      setIsRecurring(true);
      setPersonId(initialPersonId || '');
    }
    setErrors({});
  }, [event, initialPersonId, isOpen]);

  const validate = () => {
    const errs: { eventName?: string; eventDate?: string } = {};
    if (!eventName.trim()) errs.eventName = 'Event name is required';
    if (!eventDate) errs.eventDate = 'Event date is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload: CalendarEventInsert = {
        event_name: eventName.trim(),
        event_date: eventDate,
        isRecurring,
        person_id: personId || null,
      };

      if (isEditing && event) {
        await eventsService.updateEvent(event.event_id, payload);
        success(`Updated event: ${payload.event_name}`);
      } else {
        await eventsService.createEvent(payload);
        success(`Added event: ${payload.event_name}`);
      }

      onSuccess();
    } catch (err: unknown) {
      console.error('Failed to save event:', err);
      toastError('Failed to save event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const commonEventSuggestions = ['Birthday', 'Anniversary', 'Work Anniversary', 'Graduation', 'Promotion'];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Event' : 'Add Important Event'}
      description="Track milestones to trigger personalized wishes"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            label="Event Name"
            required
            placeholder="e.g. Birthday, Wedding Anniversary"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            error={errors.eventName}
          />
          {/* Quick suggestions */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {commonEventSuggestions.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setEventName(name)}
                className="text-[11px] px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 cursor-pointer transition-colors"
              >
                + {name}
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Event Date"
          type="date"
          required
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          error={errors.eventDate}
        />

        <Select
          label="Associated Connection (Optional)"
          value={personId}
          onChange={(e) => setPersonId(e.target.value)}
          options={[
            { value: '', label: '-- General Event (No specific person) --' },
            ...personsList.map((p) => ({
              value: p.person_id,
              label: `${p.full_name} (${p.relationship_to_me || 'Friend'})`,
            })),
          ]}
        />

        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800">
          <input
            id="isRecurring"
            type="checkbox"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
            className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          />
          <label htmlFor="isRecurring" className="text-xs text-slate-300 cursor-pointer select-none">
            <span className="font-semibold text-white block">Annual Recurring Event</span>
            Repeats every year on this month & date (birthdays, anniversaries)
          </label>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {isEditing ? 'Save Changes' : 'Create Event'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
