/**
 * Formats a date string (YYYY-MM-DD or ISO) into a human-friendly format
 */
export function formatDate(dateString?: string | null): string {
  if (!dateString) return 'No date';
  try {
    const parts = dateString.split('T')[0].split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
    const d = new Date(dateString);
    return isNaN(d.getTime())
      ? dateString
      : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateString;
  }
}

export type DateRangeFilter =
  | 'All Events'
  | 'Next 7 Days'
  | 'Next 30 Days'
  | 'Past 7 Days'
  | 'all'
  | 'next-7'
  | 'next-30'
  | 'past-7';

export const DATE_RANGE_OPTIONS: { label: string; value: DateRangeFilter }[] = [
  { label: 'Next 7 Days', value: 'Next 7 Days' },
  { label: 'Next 30 Days', value: 'Next 30 Days' },
  { label: 'Past 7 Days', value: 'Past 7 Days' },
  { label: 'All Events', value: 'All Events' },
];

function normalizeFilter(range: string): 'all' | 'next-7' | 'next-30' | 'past-7' {
  const r = range.toLowerCase().replace(/\s+/g, '-');
  if (r.includes('past-7') || r.includes('past')) return 'past-7';
  if (r.includes('next-30')) return 'next-30';
  if (r.includes('next-7')) return 'next-7';
  return 'all';
}

/**
 * Checks whether an event falls within a specific date range filter based on current/reference date.
 */
export function isEventInDateRange(
  dateString: string | null | undefined,
  isRecurring: boolean = false,
  range: DateRangeFilter | string = 'All Events',
  referenceDate: Date = new Date()
): boolean {
  const norm = normalizeFilter(range);
  if (norm === 'all') return true;
  if (!dateString) return false;

  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);

  const clean = dateString.split('T')[0];
  const parts = clean.split('-');
  if (parts.length !== 3) return false;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return false;

  if (isRecurring) {
    const thisYearDate = new Date(today.getFullYear(), month, day, 0, 0, 0, 0);
    const nextYearDate = new Date(today.getFullYear() + 1, month, day, 0, 0, 0, 0);
    const prevYearDate = new Date(today.getFullYear() - 1, month, day, 0, 0, 0, 0);

    const diffThisYear = Math.round((thisYearDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const diffNextYear = Math.round((nextYearDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const diffPrevYear = Math.round((prevYearDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    const upcomingDiff = diffThisYear >= 0 ? diffThisYear : diffNextYear;
    const pastDiff = diffThisYear < 0 ? diffThisYear : diffPrevYear;

    if (norm === 'next-7') return upcomingDiff >= 0 && upcomingDiff <= 7;
    if (norm === 'next-30') return upcomingDiff >= 0 && upcomingDiff <= 30;
    if (norm === 'past-7') return pastDiff >= -7 && pastDiff < 0;
  } else {
    const target = new Date(year, month, day, 0, 0, 0, 0);
    const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (norm === 'next-7') return diffDays >= 0 && diffDays <= 7;
    if (norm === 'next-30') return diffDays >= 0 && diffDays <= 30;
    if (norm === 'past-7') return diffDays >= -7 && diffDays < 0;
  }

  return true;
}

/**
 * Filters and sorts events for the Dashboard Upcoming Events Calendar:
 * - Only events occurring from today through the next 30 days (inclusive).
 * - Chronologically sorted with nearest upcoming event first.
 * - Excludes past events.
 */
export function getUpcomingEventsForDashboard<T extends { event_date: string; isRecurring?: boolean; event_name?: string }>(
  events: T[],
  referenceDate: Date = new Date()
): {
  upcomingDateStr: string;
  diffDays: number;
  event: T;
}[] {
  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);

  const results: {
    upcomingDateStr: string;
    diffDays: number;
    event: T;
  }[] = [];

  for (const ev of events) {
    if (!ev.event_date) continue;
    const clean = ev.event_date.split('T')[0];
    const parts = clean.split('-');
    if (parts.length !== 3) continue;

    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (isNaN(year) || isNaN(month) || isNaN(day)) continue;

    let targetDate: Date;
    if (ev.isRecurring) {
      const thisYear = new Date(today.getFullYear(), month, day, 0, 0, 0, 0);
      if (thisYear.getTime() >= today.getTime()) {
        targetDate = thisYear;
      } else {
        targetDate = new Date(today.getFullYear() + 1, month, day, 0, 0, 0, 0);
      }
    } else {
      targetDate = new Date(year, month, day, 0, 0, 0, 0);
    }

    const diffDays = Math.round((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // Display only events occurring from today through next 30 days (inclusive).
    // Exclude past events (diffDays < 0).
    if (diffDays >= 0 && diffDays <= 30) {
      const yStr = targetDate.getFullYear();
      const mStr = String(targetDate.getMonth() + 1).padStart(2, '0');
      const dStr = String(targetDate.getDate()).padStart(2, '0');
      const upcomingDateStr = `${yStr}-${mStr}-${dStr}`;

      results.push({
        upcomingDateStr,
        diffDays,
        event: ev,
      });
    }
  }

  // Sort events chronologically, with nearest upcoming event first
  results.sort((a, b) => {
    if (a.diffDays !== b.diffDays) {
      return a.diffDays - b.diffDays;
    }
    const nameA = a.event.event_name || '';
    const nameB = b.event.event_name || '';
    return nameA.localeCompare(nameB);
  });

  return results;
}

/**
 * Calculates days remaining until the given event date (accounting for recurring annual events)
 */
export function getDaysUntilEvent(dateString: string, isRecurring: boolean = false): {
  days: number;
  text: string;
  isToday: boolean;
  isPast: boolean;
} {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const parts = dateString.split('T')[0].split('-');
    if (parts.length !== 3) {
      return { days: 0, text: 'Invalid date', isToday: false, isPast: false };
    }

    let targetYear = parseInt(parts[0], 10);
    const targetMonth = parseInt(parts[1], 10) - 1;
    const targetDay = parseInt(parts[2], 10);

    let target = new Date(targetYear, targetMonth, targetDay);
    target.setHours(0, 0, 0, 0);

    if (isRecurring) {
      // If recurring, calculate for current or next year
      target = new Date(today.getFullYear(), targetMonth, targetDay);
      if (target.getTime() < today.getTime()) {
        target = new Date(today.getFullYear() + 1, targetMonth, targetDay);
      }
    }

    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return { days: 0, text: 'Today', isToday: true, isPast: false };
    }
    if (diffDays === 1) {
      return { days: 1, text: 'Tomorrow', isToday: false, isPast: false };
    }
    if (diffDays > 1) {
      return { days: diffDays, text: `In ${diffDays} days`, isToday: false, isPast: false };
    }
    return { days: diffDays, text: `${Math.abs(diffDays)} days ago`, isToday: false, isPast: true };
  } catch {
    return { days: 0, text: 'Unknown', isToday: false, isPast: false };
  }
}

/**
 * Normalizes a phone number for WhatsApp wa.me links
 * Strips out +, -, spaces, parentheses
 */
export function cleanPhoneNumber(phone?: string | null): string {
  if (!phone) return '';
  return phone.replace(/[^\d]/g, '');
}

/**
 * Builds a direct wa.me WhatsApp URL with encoded message
 */
export function buildWhatsAppUrl(phone?: string | null, message?: string | null): string | null {
  const cleaned = cleanPhoneNumber(phone);
  if (!cleaned) return null;
  const encoded = encodeURIComponent(message || '');
  return `https://wa.me/${cleaned}?text=${encoded}`;
}

/**
 * Builds a mailto link with encoded subject and body
 */
export function buildMailtoUrl(email?: string | null, subject?: string | null, body?: string | null): string | null {
  if (!email || !email.trim()) return null;
  const params: string[] = [];
  if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
  if (body) params.push(`body=${encodeURIComponent(body)}`);
  const query = params.length > 0 ? `?${params.join('&')}` : '';
  return `mailto:${email.trim()}${query}`;
}

/**
 * Builds an SMS URI with prefilled message
 */
export function buildSmsUrl(phone?: string | null, message?: string | null): string | null {
  const cleaned = cleanPhoneNumber(phone);
  if (!cleaned) return null;
  const encoded = encodeURIComponent(message || '');
  // Using sms:number?body=message which is supported on iOS and Android
  return `sms:${cleaned}?body=${encoded}`;
}

/**
 * Copies text to clipboard and handles fallback
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Clipboard copy failed:', err);
    return false;
  }
}

/**
 * Truncates text with an ellipsis if it exceeds maxLength
 */
export function truncateText(text: string | null | undefined, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
}
