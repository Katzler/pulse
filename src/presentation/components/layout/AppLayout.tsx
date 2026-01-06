import { Outlet } from 'react-router-dom';

import { Header } from './Header';

/**
 * Main application layout wrapper.
 * Provides consistent structure across all pages.
 */
export function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
