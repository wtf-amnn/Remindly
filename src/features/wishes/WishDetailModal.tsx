import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/ToastContext';
import { wishesService } from '../../services/wishesService';
import {
  formatDate,
  buildMailtoUrl,
  buildWhatsAppUrl,
  buildSmsUrl,
  copyToClipboard,
} from '../../utils/formatters';
import type { WishWithDetails } from '../../types';
import {
  Mail,
  MessageSquare,
  MessageCircle,
  Copy,
  Check,
  ExternalLink,
  Calendar,
  User,
  CheckCircle2,
  RotateCcw,
  AlertTriangle,
  Info,
} from 'lucide-react';

interface WishDetailModalProps {
  isOpen: boolean;
  wish: WishWithDetails | null;
  onClose: () => void;
  onStatusChanged: () => void;
}

export const WishDetailModal: React.FC<WishDetailModalProps> = ({
  isOpen,
  wish,
  onClose,
  onStatusChanged,
}) => {
  const { success, error: toastError, info } = useToast();
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'sms' | 'email'>('whatsapp');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isConfirmingSent, setIsConfirmingSent] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  if (!wish) return null;

  const person = wish.person;
  const event = wish.event;
  const emailData = wish.mail_wish || {};
  const isSent = Boolean(wish.isSent);

  // Recipient details
  const recipientEmail = person?.email;
  const recipientPhone = person?.phone;
  const recipientWhatsApp = person?.whatsapp_phone || person?.phone;

  // Prepared links
  const whatsappUrl = buildWhatsAppUrl(recipientWhatsApp, wish.long_wish || wish.short_wish);
  const smsUrl = buildSmsUrl(recipientPhone, wish.short_wish || wish.long_wish);
  const mailtoUrl = buildMailtoUrl(
    recipientEmail,
    emailData.subject || `Warm wishes for ${event?.event_name || 'your special day'}`,
    emailData.body || wish.long_wish || ''
  );

  const handleCopy = async (text: string | null | undefined, key: string) => {
    if (!text) return;
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedKey(key);
      info('Copied message to clipboard');
      setTimeout(() => setCopiedKey(null), 2500);
    } else {
      toastError('Failed to copy to clipboard');
    }
  };

  const handleMarkAsSent = async () => {
    setIsUpdatingStatus(true);
    try {
      await wishesService.markAsSent(wish.wish_id);
      success('Wish marked as sent! Moved to Sent Wishes archive.');
      setIsConfirmingSent(false);
      onStatusChanged();
      onClose();
    } catch (err: unknown) {
      console.error('Failed to mark wish as sent:', err);
      toastError('Failed to update wish status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleMarkAsUnsent = async () => {
    setIsUpdatingStatus(true);
    try {
      await wishesService.markAsUnsent(wish.wish_id);
      success('Wish moved back to New Wishes.');
      onStatusChanged();
      onClose();
    } catch (err: unknown) {
      console.error('Failed to revert wish status:', err);
      toastError('Failed to update wish status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={
          <div className="flex items-center gap-2">
            <span>Send Personalized Wish</span>
            {isSent ? (
              <Badge variant="success" className="gap-1">
                <CheckCircle2 className="w-3 h-3" /> Already Sent
              </Badge>
            ) : (
              <Badge variant="warning">Awaiting Action</Badge>
            )}
          </div>
        }
        description={`Tailored for ${person?.full_name || 'Connection'} • ${event?.event_name || 'Event'}`}
        maxWidth="2xl"
      >
        <div className="space-y-5">
          {/* Recipient & Event Summary Banner */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <div className="text-slate-400 text-[11px]">Recipient</div>
                <div className="font-semibold text-white truncate">
                  {person?.full_name || 'Unknown Connection'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <div className="text-slate-400 text-[11px]">Event</div>
                <div className="font-semibold text-white truncate">
                  {event?.event_name || 'Special Occasion'} ({formatDate(event?.event_date)})
                </div>
              </div>
            </div>
          </div>

          {/* Format Tabs: WhatsApp (Long), SMS (Short), Email */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl">
            <button
              onClick={() => setActiveTab('whatsapp')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'whatsapp'
                  ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>WhatsApp / Long</span>
            </button>

            <button
              onClick={() => setActiveTab('sms')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'sms'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <span>SMS / Short</span>
            </button>

            <button
              onClick={() => setActiveTab('email')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'email'
                  ? 'bg-sky-600/20 text-sky-300 border border-sky-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Mail className="w-4 h-4 text-sky-400" />
              <span>Email</span>
            </button>
          </div>

          {/* TAB 1: WhatsApp (Long Wish) */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="relative p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Long Form Message
                  </span>
                  <button
                    onClick={() => handleCopy(wish.long_wish || wish.short_wish, 'whatsapp')}
                    className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer p-1"
                  >
                    {copiedKey === 'whatsapp' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-medium">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Message</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed select-text">
                  {wish.long_wish || wish.short_wish || (
                    <span className="italic text-slate-500">No long wish format available.</span>
                  )}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="text-xs text-slate-400 w-full sm:w-auto">
                  WhatsApp Target:{' '}
                  <span className="font-mono text-slate-300">
                    {recipientWhatsApp || 'None configured'}
                  </span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  {whatsappUrl ? (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 transition-all cursor-pointer w-full sm:w-auto"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Open WhatsApp
                      <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                    </a>
                  ) : (
                    <Button disabled variant="secondary" size="sm">
                      No WhatsApp Phone Available
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SMS (Short Wish) */}
          {activeTab === 'sms' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="relative p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Short Form Message
                  </span>
                  <button
                    onClick={() => handleCopy(wish.short_wish || wish.long_wish, 'sms')}
                    className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer p-1"
                  >
                    {copiedKey === 'sms' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-medium">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Message</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed select-text">
                  {wish.short_wish || wish.long_wish || (
                    <span className="italic text-slate-500">No short wish format available.</span>
                  )}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="text-xs text-slate-400 w-full sm:w-auto">
                  Phone Target:{' '}
                  <span className="font-mono text-slate-300">
                    {recipientPhone || 'None configured'}
                  </span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  {smsUrl ? (
                    <a
                      href={smsUrl}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 transition-all cursor-pointer w-full sm:w-auto"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Open SMS App
                      <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                    </a>
                  ) : (
                    <Button disabled variant="secondary" size="sm">
                      No Phone Number Available
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Email */}
          {activeTab === 'email' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Subject */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Subject Line
                  </span>
                  <button
                    onClick={() => handleCopy(emailData.subject, 'subject')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer"
                  >
                    {copiedKey === 'subject' ? 'Copied!' : 'Copy Subject'}
                  </button>
                </div>
                <div className="text-sm font-semibold text-white select-text">
                  {emailData.subject || `Happy ${event?.event_name || 'Special Day'}!`}
                </div>
              </div>

              {/* Body */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Email Body
                  </span>
                  <button
                    onClick={() => handleCopy(emailData.body || wish.long_wish, 'email-body')}
                    className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer"
                  >
                    {copiedKey === 'email-body' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-medium">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Body</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed select-text">
                  {emailData.body || wish.long_wish || (
                    <span className="italic text-slate-500">No email body generated.</span>
                  )}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="text-xs text-slate-400 w-full sm:w-auto">
                  Email Recipient:{' '}
                  <span className="font-mono text-slate-300">
                    {recipientEmail || 'None configured'}
                  </span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  {mailtoUrl ? (
                    <a
                      href={mailtoUrl}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-600/25 transition-all cursor-pointer w-full sm:w-auto"
                    >
                      <Mail className="w-4 h-4" />
                      Open Email Client
                      <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                    </a>
                  ) : (
                    <Button disabled variant="secondary" size="sm">
                      No Email Address Available
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Important Notice regarding external app opening */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400">
            <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Opening WhatsApp, SMS, or Email prepares your message in your client app. Once you have sent the wish, click <strong>Mark as Sent</strong> below to keep your records in sync.
            </p>
          </div>

          {/* Bottom Confirmation Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>

            <div className="flex items-center gap-2">
              {isSent ? (
                <Button
                  variant="outline"
                  icon={<RotateCcw className="w-4 h-4" />}
                  onClick={handleMarkAsUnsent}
                  isLoading={isUpdatingStatus}
                >
                  Mark as Unsent
                </Button>
              ) : (
                <Button
                  variant="success"
                  icon={<CheckCircle2 className="w-4 h-4" />}
                  onClick={() => setIsConfirmingSent(true)}
                  isLoading={isUpdatingStatus}
                  className="font-semibold shadow-lg shadow-emerald-600/20"
                >
                  Mark as Sent
                </Button>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Confirmation Dialog for Mark as Sent */}
      <ConfirmDialog
        isOpen={isConfirmingSent}
        variant="primary"
        title="Confirm Wish Sent"
        message={`Confirm that you have dispatched this wish to ${person?.full_name || 'your connection'}? It will be moved to Sent Wishes.`}
        confirmLabel="Yes, Mark as Sent"
        cancelLabel="Not Yet"
        isLoading={isUpdatingStatus}
        onClose={() => setIsConfirmingSent(false)}
        onConfirm={handleMarkAsSent}
      />
    </>
  );
};
