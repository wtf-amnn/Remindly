import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { PwaInstallBanner } from './PwaInstallBanner';
import { ConnectionModal } from '../../features/connections/ConnectionModal';

export const AppLayout: React.FC = () => {
  const [isAddConnectionOpen, setIsAddConnectionOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col">
      <PwaInstallBanner />
      <Header onAddConnection={() => setIsAddConnectionOpen(true)} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 max-w-full overflow-x-hidden">
          <Outlet context={{ openAddConnection: () => setIsAddConnectionOpen(true) }} />
        </main>
      </div>

      <MobileNav />

      {/* Global Add Connection Modal */}
      {isAddConnectionOpen && (
        <ConnectionModal
          isOpen={isAddConnectionOpen}
          onClose={() => setIsAddConnectionOpen(false)}
          onSuccess={() => {
            setIsAddConnectionOpen(false);
            // Dispatch a custom event to notify listeners across the app
            window.dispatchEvent(new CustomEvent('rm_data_mutated'));
          }}
        />
      )}
    </div>
  );
};
