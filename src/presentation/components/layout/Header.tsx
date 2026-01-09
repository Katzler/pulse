import { NavLink } from 'react-router-dom';

import { ThemeToggle } from '@presentation/components/common';

/**
 * Get nav link classes based on active state
 */
function getNavLinkClasses(isActive: boolean): string {
  const base = 'px-4 py-2 rounded-md text-sm font-medium transition-colors';

  if (isActive) {
    return `${base} bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400`;
  }

  return `${base} text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-surface-700`;
}

/**
 * Application header with navigation and theme toggle
 */
export function Header() {
  return (
    <header className="bg-white border-b border-gray-200 dark:bg-surface-900 dark:border-surface-700">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <NavLink to="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <svg
                  className="h-5 w-5 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 12h4l3-9 4 18 3-9h4" />
                </svg>
              </div>
              <span className="text-xl font-semibold text-gray-900 dark:text-white">
                Pulse
              </span>
            </NavLink>
          </div>

          {/* Navigation and Actions */}
          <div className="flex items-center gap-2">
            <nav className="flex items-center gap-1">
              <NavLink
                to="/"
                end
                className={({ isActive }) => getNavLinkClasses(isActive)}
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/customers"
                className={({ isActive }) => getNavLinkClasses(isActive)}
              >
                Customers
              </NavLink>
              <NavLink
                to="/import"
                className={({ isActive }) => getNavLinkClasses(isActive)}
              >
                Import
              </NavLink>
            </nav>

            {/* Theme Toggle */}
            <div className="ml-2 pl-2 border-l border-gray-200 dark:border-surface-700">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
