import React from 'react';
import { NavLink } from 'react-router-dom';
import { APP_CONFIG } from '../../config/appConfig';
import {
  LayoutDashboard,
  Users,
  Sparkles,
  Calendar,
  HeartHandshake,
} from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard className="w-5 h-5" />,
  Users: <Users className="w-5 h-5" />,
  Sparkles: <Sparkles className="w-5 h-5" />,
  Calendar: <Calendar className="w-5 h-5" />,
};

export const Sidebar: React.FC = () => {
  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-900/60 border-r border-slate-800/80 p-4 shrink-0 min-h-[calc(100vh-65px)]">
      {/* Navigation items */}
      <nav className="space-y-1.5 flex-1">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
          Navigation
        </div>
        {APP_CONFIG.navigation.map((item) => {
          const icon = iconMap[item.iconName] || <HeartHandshake className="w-5 h-5" />;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`
              }
            >
              <span className="shrink-0">{icon}</span>
              <div className="flex-1">
                <div>{item.label}</div>
              </div>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="pt-4 border-t border-slate-800/60 px-3">
        <div className="text-[11px] text-slate-400 flex items-center justify-between">
          <span>v{APP_CONFIG.version} PWA</span>
          <span className="inline-flex items-center gap-1.5 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Ready
          </span>
        </div>
      </div>
    </aside>
  );
};
