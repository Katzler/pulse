import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect,it } from 'vitest';

import App from './App';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
};

describe('App', () => {
  it('renders the dashboard heading', () => {
    renderWithProviders(<App />);
    expect(
      screen.getByRole('heading', { name: /customer success metrics dashboard/i })
    ).toBeInTheDocument();
  });

  it('shows no data message when data is not loaded', () => {
    renderWithProviders(<App />);
    expect(screen.getByText(/no data loaded yet/i)).toBeInTheDocument();
  });
});
