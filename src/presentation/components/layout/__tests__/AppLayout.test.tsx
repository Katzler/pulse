import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ThemeProvider } from '@presentation/context';

import { AppLayout } from '../AppLayout';

const renderWithRouter = (initialEntries = ['/']) => {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<div>Test Page Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  );
};

describe('AppLayout', () => {
  it('renders header', () => {
    renderWithRouter();
    expect(screen.getByText('Pulse')).toBeInTheDocument();
  });

  it('renders child content via Outlet', () => {
    renderWithRouter();
    expect(screen.getByText('Test Page Content')).toBeInTheDocument();
  });

  it('has proper page structure', () => {
    renderWithRouter();
    // Main content area exists
    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});
