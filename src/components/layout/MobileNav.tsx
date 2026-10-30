import React from 'react';
import { NavLink } from 'react-router-dom';
import { APP_CONFIG } from '../../config/appConfig';
import { LayoutDashboard, Users, Sparkles, Calendar, HeartHandshake } from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard className="w-5 h-5" />,
  Users: <Users className="w-5 h-5" />,
  Sparkles: <Sparkles className="w-5 h-5" />,
  Calendar: <Calendar className="w-5 h-5" />,
};

export const MobileNav: React.FC = () => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/80 px-2 py-1 safe-area-pb">
      <div className="flex items-center justify-around">
        {APP_CONFIG.navigation.map((item) => {
          const icon = iconMap[item.iconName] || <HeartHandshake className="w-5 h-5" />;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all duration-150 min-w-[64px] ${
                  isActive
                    ? 'text-indigo-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <div className="relative">
                {icon}
              </div>
              <span className="text-[11px] mt-1 tracking-tight">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
