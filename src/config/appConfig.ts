export interface RelationshipTypeOption {
  value: string;
  label: string;
  badgeColor: string;
  category: 'personal' | 'professional' | 'other';
}

export interface NavItemConfig {
  path: string;
  label: string;
  description: string;
  iconName: string;
}

export const APP_CONFIG = {
  name: 'Remindly',
  shortName: 'Remindly',
  tagline: 'Remember people. Celebrate moments. Stay connected.',
  description: 'Manage personal and professional connections, track important life events, and send thoughtful wishes seamlessly.',
  version: '1.0.0',

  assets: {
    logoSvg: '/icons/newLogo.png',
    favicon: '/icons/newLogo.png',
    icon192: '/icons/newLogo.png',
    icon512: '/icons/newLogo.png',
    appleTouchIcon: '/icons/newLogo.png',
    maskableIcon: '/icons/newLogo.png',
  },

  theme: {
    colorTheme: 'dark',
    primaryColor: '#818cf8', // Indigo 400
    accentColor: '#c084fc',  // Purple 400
    backgroundColor: '#090d16',
    surfaceColor: '#0f172a',
    surfaceBorder: '#1e293b',
    textColor: '#f8fafc',
    mutedColor: '#94a3b8',
  },

  navigation: [
    {
      path: '/',
      label: 'Dashboard',
      description: 'Overview of your relationships & upcoming events',
      iconName: 'LayoutDashboard',
    },
    {
      path: '/connections',
      label: 'Connections',
      description: 'Manage and explore your contacts directory',
      iconName: 'Users',
    },
    {
      path: '/wishes',
      label: 'Wishes',
      description: 'Review and send personalized event wishes',
      iconName: 'Sparkles',
    },
    {
      path: '/events',
      label: 'Events',
      description: 'Track birthdays, anniversaries, and milestones',
      iconName: 'Calendar',
    },
  ] as NavItemConfig[],

  relationshipTypes: [
    { value: 'friend', label: 'Friend', badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', category: 'personal' },
    { value: 'close friend', label: 'Close Friend', badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30', category: 'personal' },
    { value: 'best friend', label: 'Best Friend', badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30', category: 'personal' },
    { value: 'cousin', label: 'Cousin', badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30', category: 'personal' },
    { value: 'family member', label: 'Family Member', badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30', category: 'personal' },
    { value: 'colleague', label: 'Colleague', badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30', category: 'professional' },
    { value: 'client', label: 'Client', badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30', category: 'professional' },
    { value: 'mentor', label: 'Mentor', badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30', category: 'professional' },
    { value: 'other', label: 'Other', badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-500/30', category: 'other' },
  ] as RelationshipTypeOption[],

  genders: ['Male', 'Female'] as const,

  communicationStyles: [
    'Casual & Friendly',
    'Warm & Empathetic',
    'Professional & Direct',
    'Playful & Humorous',
    'Brief & Concise',
    'Detailed & Thoughtful',
  ],

  defaultPaginationLimit: 20,

  storageKeys: {
    connectionsViewMode: 'rm_connections_view_mode',
    wishesFilterTab: 'rm_wishes_active_tab',
    dismissedPwaBanner: 'rm_pwa_banner_dismissed',
  },
} as const;

export function getRelationshipTypeBadge(type?: string | null): string {
  if (!type) return 'bg-slate-800 text-slate-300 border-slate-700';
  const found = APP_CONFIG.relationshipTypes.find(
    (r) => r.value.toLowerCase() === type.toLowerCase()
  );
  return found ? found.badgeColor : 'bg-violet-500/20 text-violet-300 border-violet-500/30';
}
