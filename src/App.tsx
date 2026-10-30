import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/ui/ToastContext';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { ConnectionsListPage } from './features/connections/ConnectionsListPage';
import { ConnectionDetailPage } from './features/connections/ConnectionDetailPage';
import { WishesPage } from './features/wishes/WishesPage';
import { EventsPage } from './features/events/EventsPage';

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="connections" element={<ConnectionsListPage />} />
            <Route path="connections/:id" element={<ConnectionDetailPage />} />
            <Route path="wishes" element={<WishesPage />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
};

export default App;
