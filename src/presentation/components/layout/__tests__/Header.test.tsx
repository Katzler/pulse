import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ThemeProvider } from '@presentation/context';

import { Header } from '../Header';

const renderWithRouter = (initialEntries = ['/']) => {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={initialEntries}>
        <Header />
      </MemoryRouter>
    </ThemeProvider>
  );
};

describe('Header', () => {
  it('renders the application name', () => {
    renderWithRouter();
    expect(screen.getByText('Pulse')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    renderWithRouter();
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /customers/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /import/i })).toBeInTheDocument();
  });

  it('navigation links have correct hrefs', () => {
    renderWithRouter();
    expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /customers/i })).toHaveAttribute('href', '/customers');
    expect(screen.getByRole('link', { name: /import/i })).toHaveAttribute('href', '/import');
  });

  it('highlights active dashboard link when on home page', () => {
    renderWithRouter(['/']);
    const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
    expect(dashboardLink).toHaveClass('bg-blue-50');
  });

  it('highlights active customers link when on customers page', () => {
    renderWithRouter(['/customers']);
    const customersLink = screen.getByRole('link', { name: /customers/i });
    expect(customersLink).toHaveClass('bg-blue-50');
  });

  it('logo links to home', () => {
    renderWithRouter();
    const logoLink = screen.getByRole('link', { name: /pulse/i });
    expect(logoLink).toHaveAttribute('href', '/');
  });
});
