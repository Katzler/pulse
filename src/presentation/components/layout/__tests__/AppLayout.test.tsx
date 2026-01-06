import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AppLayout } from '../AppLayout';

const renderWithRouter = (initialEntries = ['/']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<div>Test Page Content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
};

describe('AppLayout', () => {
  it('renders header', () => {
    renderWithRouter();
    expect(screen.getByText('Customer Success')).toBeInTheDocument();
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
