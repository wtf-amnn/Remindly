import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/ToastContext';
import { personsService } from '../../services/personsService';
import { APP_CONFIG } from '../../config/appConfig';
import type { Person, PersonInsert, MemoryItem } from '../../types';
import { Plus, Trash2, User, Phone, Mail, Sparkles, BookOpen, Heart } from 'lucide-react';

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  person?: Person | null; // If editing
}

export const ConnectionModal: React.FC<ConnectionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  person,
}) => {
  const { success, error: toastError } = useToast();
  const isEditing = Boolean(person);
  const [activeTab, setActiveTab] = useState<'basics' | 'contact' | 'traits' | 'memories'>('basics');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('');
  const [relationshipToMe, setRelationshipToMe] = useState('friend');
  const [customRelationship, setCustomRelationship] = useState('');
  const [profession, setProfession] = useState('');
  const [company, setCompany] = useState('');

  // Contact
  const [phone, setPhone] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [email, setEmail] = useState('');

  // Arrays (entered as comma-separated or tags)
  const [nicknamesInput, setNicknamesInput] = useState('');
  const [hobbiesInput, setHobbiesInput] = useState('');
  const [likesInput, setLikesInput] = useState('');
  const [dislikesInput, setDislikesInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [communicationStyle, setCommunicationStyle] = useState<string[]>([]);

  // Memories
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [newMemoryTitle, setNewMemoryTitle] = useState('');
  const [newMemoryDate, setNewMemoryDate] = useState('');
  const [newMemoryDesc, setNewMemoryDesc] = useState('');

  // Errors
  const [errors, setErrors] = useState<{ fullName?: string; email?: string }>({});

  useEffect(() => {
    if (person) {
      setFullName(person.full_name || '');
      setGender(person.gender || '');
      
      const isPredefinedRel = APP_CONFIG.relationshipTypes.some(
        (r) => r.value.toLowerCase() === (person.relationship_to_me || '').toLowerCase()
      );
      if (isPredefinedRel) {
        setRelationshipToMe(person.relationship_to_me || 'friend');
        setCustomRelationship('');
      } else if (person.relationship_to_me) {
        setRelationshipToMe('custom');
        setCustomRelationship(person.relationship_to_me);
      } else {
        setRelationshipToMe('friend');
      }

      setProfession(person.profession || '');
      setCompany(person.company || '');
      setPhone(person.phone || '');
      setWhatsappPhone(person.whatsapp_phone || '');
      setEmail(person.email || '');

      setNicknamesInput(person.nicknames?.join(', ') || '');
      setHobbiesInput(person.hobbies?.join(', ') || '');
      setLikesInput(person.likes?.join(', ') || '');
      setDislikesInput(person.dislikes?.join(', ') || '');
      setNotesInput(person.notes?.join('\n') || '');
      setCommunicationStyle(person.communication_style || []);

      if (Array.isArray(person.memories)) {
        setMemories(person.memories as MemoryItem[]);
      } else {
        setMemories([]);
      }
    } else {
      // Reset defaults
      setFullName('');
      setGender('Prefer not to say');
      setRelationshipToMe('friend');
      setCustomRelationship('');
      setProfession('');
      setCompany('');
      setPhone('');
      setWhatsappPhone('');
      setEmail('');
      setNicknamesInput('');
      setHobbiesInput('');
      setLikesInput('');
      setDislikesInput('');
      setNotesInput('');
      setCommunicationStyle([]);
      setMemories([]);
    }
    setErrors({});
    setActiveTab('basics');
  }, [person, isOpen]);

  const parseArrayInput = (input: string): string[] => {
    return input
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const handleAddMemory = () => {
    if (!newMemoryTitle.trim()) return;
    const newMem: MemoryItem = {
      id: Math.random().toString(36).substring(2, 9),
      title: newMemoryTitle.trim(),
      date: newMemoryDate || undefined,
      description: newMemoryDesc.trim(),
    };
    setMemories([...memories, newMem]);
    setNewMemoryTitle('');
    setNewMemoryDate('');
    setNewMemoryDesc('');
  };

  const handleRemoveMemory = (index: number) => {
    setMemories(memories.filter((_, i) => i !== index));
  };

  const toggleCommStyle = (style: string) => {
    setCommunicationStyle((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
    );
  };

  const validate = (): boolean => {
    const newErrors: { fullName?: string; email?: string } = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (email && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      setActiveTab('basics');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalRelationship =
        relationshipToMe === 'custom' ? customRelationship.trim() || 'other' : relationshipToMe;

      const payload: PersonInsert = {
        full_name: fullName.trim(),
        gender: gender || null,
        relationship_to_me: finalRelationship || null,
        profession: profession.trim() || null,
        company: company.trim() || null,
        phone: phone.trim() || null,
        whatsapp_phone: whatsappPhone.trim() || (phone.trim() ? phone.trim() : null),
        email: email.trim() || null,
        nicknames: parseArrayInput(nicknamesInput),
        hobbies: parseArrayInput(hobbiesInput),
        likes: parseArrayInput(likesInput),
        dislikes: parseArrayInput(dislikesInput),
        notes: parseArrayInput(notesInput),
        communication_style: communicationStyle.length > 0 ? communicationStyle : null,
        memories: memories.length > 0 ? memories : null,
      };

      if (isEditing && person) {
        await personsService.updatePerson(person.person_id, payload);
        success(`Updated connection for ${payload.full_name}`);
      } else {
        await personsService.createPerson(payload);
        success(`Added ${payload.full_name} to connections`);
      }

      onSuccess();
    } catch (err: unknown) {
      console.error('Error saving connection:', err);
      const msg = err instanceof Error ? err.message : 'Failed to save connection';
      toastError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Connection: ${person?.full_name}` : 'Add New Connection'}
      description="Keep detailed personal context to help generate heartfelt, tailored wishes."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-950/70 border border-slate-800 rounded-xl overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('basics')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'basics'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Basic Info
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('contact')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'contact'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            Contact Info
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('traits')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'traits'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Personality & Traits
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('memories')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'memories'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Memories ({memories.length})
          </button>
        </div>

        {/* Tab 1: Basics */}
        {activeTab === 'basics' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <Input
              label="Full Name"
              required
              placeholder="e.g. Alex Morgan"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              error={errors.fullName}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Relationship to Me"
                value={relationshipToMe}
                onChange={(e) => setRelationshipToMe(e.target.value)}
                options={[
                  ...APP_CONFIG.relationshipTypes.map((r) => ({
                    value: r.value,
                    label: r.label,
                  })),
                  { value: 'custom', label: 'Custom Relationship...' },
                ]}
              />

              <Select
                label="Gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                options={APP_CONFIG.genders.map((g) => ({
                  value: g,
                  label: g,
                }))}
              />
            </div>

            {relationshipToMe === 'custom' && (
              <Input
                label="Specify Custom Relationship"
                placeholder="e.g. Hiking Partner, Former Manager"
                value={customRelationship}
                onChange={(e) => setCustomRelationship(e.target.value)}
              />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Profession / Role"
                placeholder="e.g. Software Architect"
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
              />
              <Input
                label="Company / Organization"
                placeholder="e.g. NovaTech Systems"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>

            <Input
              label="Nicknames (comma separated)"
              placeholder="e.g. Lex, Morgs"
              value={nicknamesInput}
              onChange={(e) => setNicknamesInput(e.target.value)}
              helperText="Used to craft friendly opening salutations"
            />
          </div>
        )}

        {/* Tab 2: Contact */}
        {activeTab === 'contact' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <Input
              label="Email Address"
              type="email"
              icon={<Mail className="w-4 h-4" />}
              placeholder="alex@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              helperText="Enables direct mailto wish launcher"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Phone (SMS & Calls)"
                type="tel"
                icon={<Phone className="w-4 h-4" />}
                placeholder="+14155552671"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                helperText="Include country code (+1...)"
              />
              <Input
                label="WhatsApp Phone"
                type="tel"
                icon={<Phone className="w-4 h-4 text-emerald-400" />}
                placeholder="+14155552671"
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
                helperText="Leave blank to use primary phone"
              />
            </div>
          </div>
        )}

        {/* Tab 3: Traits */}
        {activeTab === 'traits' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Communication Style Preference
              </label>
              <div className="flex flex-wrap gap-2">
                {APP_CONFIG.communicationStyles.map((style) => {
                  const isSelected = communicationStyle.includes(style);
                  return (
                    <button
                      key={style}
                      type="button"
                      onClick={() => toggleCommStyle(style)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {style}
                    </button>
                  );
                })}
              </div>
            </div>

            <Input
              label="Hobbies & Interests (comma separated)"
              placeholder="e.g. Rock Climbing, Sci-Fi Reading, Espresso Brewing"
              value={hobbiesInput}
              onChange={(e) => setHobbiesInput(e.target.value)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Likes & Favorites"
                placeholder="e.g. Single origin coffee, Clean code"
                value={likesInput}
                onChange={(e) => setLikesInput(e.target.value)}
              />
              <Input
                label="Dislikes & Pet Peeves"
                placeholder="e.g. Cold brew, Micro-management"
                value={dislikesInput}
                onChange={(e) => setDislikesInput(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Personal Notes & Reminders
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Allergic to shellfish. Prefers texting on weekdays."
                className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl py-2 px-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Tab 4: Memories */}
        {activeTab === 'memories' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Memory List */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {memories.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl">
                  No memories added yet. Add shared experiences below to give wishes extra warmth!
                </div>
              ) : (
                memories.map((m, idx) => (
                  <div
                    key={m.id || idx}
                    className="flex items-start justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800"
                  >
                    <div>
                      <div className="text-xs font-semibold text-white flex items-center gap-2">
                        {m.title}
                        {m.date && <span className="text-[10px] text-slate-400 font-normal">({m.date})</span>}
                      </div>
                      {m.description && (
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">{m.description}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveMemory(idx)}
                      className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                      aria-label="Remove memory"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add Memory Box */}
            <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800/80 space-y-3">
              <div className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5" /> Add Shared Memory
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    placeholder="Memory title (e.g. Tech Summit Trip)"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    value={newMemoryTitle}
                    onChange={(e) => setNewMemoryTitle(e.target.value)}
                  />
                </div>
                <div>
                  <input
                    type="date"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                    value={newMemoryDate}
                    onChange={(e) => setNewMemoryDate(e.target.value)}
                  />
                </div>
              </div>
              <input
                type="text"
                placeholder="Description or funny anecdote..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                value={newMemoryDesc}
                onChange={(e) => setNewMemoryDesc(e.target.value)}
              />
              <div className="flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  icon={<Plus className="w-3.5 h-3.5" />}
                  onClick={handleAddMemory}
                  disabled={!newMemoryTitle.trim()}
                  className="text-xs"
                >
                  Save Memory
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            className="font-semibold px-6"
          >
            {isEditing ? 'Save Changes' : 'Create Connection'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
