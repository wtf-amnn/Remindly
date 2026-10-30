export * from './database';

export type FilterGender = 'all' | 'Male' | 'Female' | 'Other';
export type FilterSentStatus = 'all' | 'pending' | 'sent';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
  duration?: number;
}
