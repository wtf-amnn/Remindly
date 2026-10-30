import React from 'react';
import { Link } from 'react-router-dom';
import { APP_CONFIG } from '../../config/appConfig';
import { isSupabaseConfigured } from '../../lib/supabase';
import { AlertCircle, Plus, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';

interface HeaderProps {
  onAddConnection?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onAddConnection }) => {
  return (
    <>
      {/* Unconfigured Supabase Banner */}
      {!isSupabaseConfigured && (
        <div className="bg-amber-950/80 border-b border-amber-800/50 px-4 py-2 text-xs text-amber-200 flex items-center justify-between z-40">
          <div className="flex items-center gap-2 max-w-2xl">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Demo / Unconnected:</strong> Missing or placeholder Supabase credentials. Add your keys in <code className="bg-amber-900/60 px-1 py-0.5 rounded text-amber-100">.env</code> to connect live data.
            </span>
          </div>
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-white font-medium shrink-0 ml-3"
          >
            Supabase Console &rarr;
          </a>
        </div>
      )}

      {/* Main Top Header */}
      <header className="sticky top-0 z-30 bg-[#090d16]/85 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
<div className="w-10 h-10 rounded-xl overflow-hidden drop-shadow-md group-hover:scale-105 transition-transform">
  <img
    src="/icons/newLogo.png"
    alt="Remindly"
    className="w-full h-full object-contain bg-transparent"
  />
</div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight leading-none group-hover:text-indigo-300 transition-colors">
                {APP_CONFIG.name}
              </h1>
              <p className="text-[11px] text-slate-400 hidden sm:block mt-0.5">
                {APP_CONFIG.tagline}
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            {onAddConnection && (
              <Button
                variant="primary"
                size="sm"
                icon={<Plus className="w-4 h-4" />}
                onClick={onAddConnection}
                className="text-xs sm:text-sm font-semibold"
              >
                <span className="hidden sm:inline">Add Connection</span>
                <span className="sm:hidden">Add</span>
              </Button>
            )}
          </div>
        </div>
      </header>
    </>
  );
};
