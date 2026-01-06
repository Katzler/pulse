import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import App from './App';

describe('App', () => {
  it('renders the application with header', () => {
    render(<App />);
    expect(screen.getByText('Customer Success')).toBeInTheDocument();
  });

  it('renders the dashboard page by default', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    render(<App />);
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /customers/i })).toBeInTheDocument();
    // Navigation has Import link, Dashboard empty state also has Import button/link
    expect(screen.getAllByRole('link', { name: /import/i }).length).toBeGreaterThanOrEqual(1);
  });
});
