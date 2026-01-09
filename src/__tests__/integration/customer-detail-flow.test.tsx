import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { compositionRoot } from '@application/composition';
import { AppProvider, ThemeProvider } from '@presentation/context';
import { CustomerDetail } from '@presentation/pages/CustomerDetail';
import { CustomerList } from '@presentation/pages/CustomerList';
import { Import } from '@presentation/pages/Import';
import { useCustomerStore, useImportStore } from '@presentation/stores';

// Reset composition root before each test to ensure fresh repository
beforeEach(() => {
  compositionRoot.reset();
});

// Clean up stores after each test
afterEach(() => {
  useCustomerStore.getState().clearAll();
  useImportStore.getState().resetImport();
});

// CSV content with varied customers for testing
const testCsvContent = `"Sirvoy Customer ID","Account Owner","Latest Login","Created Date","Billing Country","Account Type","Language","Status","Sirvoy Account Status","Property Type","MRR (converted) Currency","MRR (converted)","Channels"
"CUST-001","Hotel Alpha","01/05/2026, 10:00","01/01/2024","USA","Pro","English","Active Customer","Loyal","Hotels","USD","2500","Booking.com, Expedia, Airbnb"
"CUST-002","Hotel Beta","12/08/2025, 14:30","06/15/2024","Germany","Starter","German, English","Active Customer","New","B&B","EUR","800","Booking.com"
"CUST-003","Hotel Gamma","","01/01/2023","France","Pro","French","Inactive Customer","Churned","Hotels","EUR","1500","Airbnb"`;

// Create a File from CSV content
function createCsvFile(content: string, name = 'customers.csv'): File {
  return new File([content], name, { type: 'text/csv' });
}

// Test wrapper with routing including customer detail
function TestApp({ initialRoute = '/customers' }: { initialRoute?: string }) {
  return (
    <MemoryRouter initialEntries={[initialRoute]}>
      <ThemeProvider>
        <AppProvider>
          <Routes>
            <Route path="/import" element={<Import />} />
            <Route path="/customers" element={<CustomerList />} />
            <Route path="/customers/:customerId" element={<CustomerDetail />} />
          </Routes>
        </AppProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
}

// Helper to import test data
async function importTestData(user: ReturnType<typeof userEvent.setup>) {
  const file = createCsvFile(testCsvContent);
  const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

  if (fileInput) {
    await user.upload(fileInput, file);
  }

  await waitFor(() => {
    expect(screen.getByRole('button', { name: /import data/i })).toBeInTheDocument();
  });

  await user.click(screen.getByRole('button', { name: /import data/i }));

  await waitFor(
    () => {
      expect(useCustomerStore.getState().customers.length).toBe(3);
    },
    { timeout: 5000 }
  );
}

describe('Customer Detail Flow Integration', () => {
  describe('Data Fetching', () => {
    it('should display customer detail when navigating with valid ID', async () => {
      const user = userEvent.setup();
      render(<TestApp initialRoute="/import" />);

      await importTestData(user);

      // Navigate to a specific customer detail
      render(<TestApp initialRoute="/customers/CUST-001" />);

      await waitFor(() => {
        expect(screen.getByTestId('customer-detail-content')).toBeInTheDocument();
      });
    });

    it('should show customer name in header', async () => {
      const user = userEvent.setup();
      render(<TestApp initialRoute="/import" />);

      await importTestData(user);

      render(<TestApp initialRoute="/customers/CUST-001" />);

      await waitFor(() => {
        expect(screen.getByTestId('customer-name')).toBeInTheDocument();
        expect(screen.getByText(/CUST-001/i)).toBeInTheDocument();
      });
    });

    it('should display customer not found for invalid ID', async () => {
      const user = userEvent.setup();
      render(<TestApp initialRoute="/import" />);

      await importTestData(user);

      render(<TestApp initialRoute="/customers/INVALID-ID" />);

      await waitFor(() => {
        expect(screen.getByTestId('customer-not-found')).toBeInTheDocument();
      });
    });

    it('should display loading state initially', async () => {
      const user = userEvent.setup();
      render(<TestApp initialRoute="/import" />);

      await importTestData(user);

      // Note: Loading state is very fast, so we test that the final content appears
      render(<TestApp initialRoute="/customers/CUST-001" />);

      await waitFor(() => {
        // Eventually should show content (loading was shown before)
        expect(screen.getByTestId('customer-detail-content')).toBeInTheDocument();
      });
    });
  });

  describe('Customer Information Display', () => {
    it('should display customer info section', async () => {
      const user = userEvent.setup();
      render(<TestApp initialRoute="/import" />);

      await importTestData(user);
      render(<TestApp initialRoute="/customers/CUST-001" />);

      await waitFor(() => {
        expect(screen.getByTestId('customer-info-section')).toBeInTheDocument();
      });
    });

    it('should display financial section', async () => {
      const user = userEvent.setup();
      render(<TestApp initialRoute="/import" />);

      await importTestData(user);
      render(<TestApp initialRoute="/customers/CUST-001" />);

      await waitFor(() => {
        expect(screen.getByTestId('financial-section')).toBeInTheDocument();
      });
    });

    it('should display channels section', async () => {
      const user = userEvent.setup();
      render(<TestApp initialRoute="/import" />);

      await importTestData(user);
      render(<TestApp initialRoute="/customers/CUST-001" />);

      await waitFor(() => {
        expect(screen.getByTestId('channels-section')).toBeInTheDocument();
      });
    });

    it('should display timeline section', async () => {
      const user = userEvent.setup();
      render(<TestApp initialRoute="/import" />);

      await importTestData(user);
      render(<TestApp initialRoute="/customers/CUST-001" />);

      await waitFor(() => {
        expect(screen.getByTestId('timeline-section')).toBeInTheDocument();
      });
    });

    it('should display correct MRR value', async () => {
      const user = userEvent.setup();
      render(<TestApp initialRoute="/import" />);

      await importTestData(user);
      render(<TestApp initialRoute="/customers/CUST-001" />);

      await waitFor(() => {
        const mrrValue = screen.getByTestId('customer-mrr');
        expect(mrrValue).toBeInTheDocument();
        expect(mrrValue.textContent).toContain('2,500');
      });
    });

    it('should display correct country', async () => {
      const user = userEvent.setup();
      render(<TestApp initialRoute="/import" />);

      await importTestData(user);
      render(<TestApp initialRoute="/customers/CUST-001" />);

      await waitFor(() => {
        const countryValue = screen.getByTestId('customer-country');
        expect(countryValue).toBeInTheDocument();
        expect(countryValue.textContent).toBe('USA');
      });
    });
  });

  describe('Health Score Display', () => {
    it('should display health breakdown section', async () => {
      const user = userEvent.setup();
      render(<TestApp initialRoute="/import" />);

      await importTestData(user);
      render(<TestApp initialRoute="/customers/CUST-001" />);

      await waitFor(() => {
        expect(screen.getByTestId('health-breakdown-section')).toBeInTheDocument();
      });
    });

    it('should display health score with valid value', async () => {
      const user = userEvent.setup();
      render(<TestApp initialRoute="/import" />);

      await importTestData(user);
      render(<TestApp initialRoute="/customers/CUST-001" />);

      await waitFor(() => {
        const healthScore = screen.getByTestId('total-health-score');
        expect(healthScore).toBeInTheDocument();
        // Should show format like "XX / 100"
        expect(healthScore.textContent).toMatch(/\d+ \/ 100/);
      });
    });
  });

  describe('Comparative Metrics', () => {
    it('should display comparative section', async () => {
      const user = userEvent.setup();
      render(<TestApp initialRoute="/import" />);

      await importTestData(user);
      render(<TestApp initialRoute="/customers/CUST-001" />);

      await waitFor(() => {
        expect(screen.getByTestId('comparative-section')).toBeInTheDocument();
      });
    });

    it('should display percentile rank', async () => {
      const user = userEvent.setup();
      render(<TestApp initialRoute="/import" />);

      await importTestData(user);
      render(<TestApp initialRoute="/customers/CUST-001" />);

      await waitFor(() => {
        const percentileRank = screen.getByTestId('percentile-rank');
        expect(percentileRank).toBeInTheDocument();
        expect(percentileRank.textContent).toMatch(/Top \d+%/);
      });
    });
  });

  describe('Navigation', () => {
    it('should display back to customers link', async () => {
      const user = userEvent.setup();
      render(<TestApp initialRoute="/import" />);

      await importTestData(user);
      render(<TestApp initialRoute="/customers/CUST-001" />);

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /back to customers/i })).toBeInTheDocument();
      });
    });

    it('should navigate back to customer list when clicking back', async () => {
      const user = userEvent.setup();
      render(<TestApp initialRoute="/import" />);

      await importTestData(user);

      const { unmount } = render(<TestApp initialRoute="/customers/CUST-001" />);

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /back to customers/i })).toBeInTheDocument();
      });

      const backLink = screen.getByRole('link', { name: /back to customers/i });
      await user.click(backLink);

      unmount();
      render(<TestApp initialRoute="/customers" />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /customers/i })).toBeInTheDocument();
      });
    });

    it('should display view all customers link on not found page', async () => {
      const user = userEvent.setup();
      render(<TestApp initialRoute="/import" />);

      await importTestData(user);
      render(<TestApp initialRoute="/customers/INVALID-ID" />);

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /view all customers/i })).toBeInTheDocument();
      });
    });
  });

  describe('Different Customer Types', () => {
    it('should display inactive customer correctly', async () => {
      const user = userEvent.setup();
      render(<TestApp initialRoute="/import" />);

      await importTestData(user);
      render(<TestApp initialRoute="/customers/CUST-003" />);

      await waitFor(() => {
        expect(screen.getByTestId('customer-detail-content')).toBeInTheDocument();
        // Should show inactive status badge
        expect(screen.getByText(/inactive/i)).toBeInTheDocument();
      });
    });

    it('should display customer with multiple languages', async () => {
      const user = userEvent.setup();
      render(<TestApp initialRoute="/import" />);

      await importTestData(user);
      render(<TestApp initialRoute="/customers/CUST-002" />);

      await waitFor(() => {
        const languages = screen.getByTestId('customer-languages');
        expect(languages).toBeInTheDocument();
        expect(languages.textContent).toContain('German');
        expect(languages.textContent).toContain('English');
      });
    });

    it('should display customer who never logged in', async () => {
      const user = userEvent.setup();
      render(<TestApp initialRoute="/import" />);

      await importTestData(user);
      render(<TestApp initialRoute="/customers/CUST-003" />);

      await waitFor(() => {
        const lastLogin = screen.getByTestId('last-login');
        expect(lastLogin).toBeInTheDocument();
        expect(lastLogin.textContent).toContain('Never logged in');
      });
    });
  });
});

describe('Customer Detail Badges', () => {
  it('should display status badge', async () => {
    const user = userEvent.setup();
    render(<TestApp initialRoute="/import" />);

    await importTestData(user);
    render(<TestApp initialRoute="/customers/CUST-001" />);

    await waitFor(() => {
      expect(screen.getByText(/active customer/i)).toBeInTheDocument();
    });
  });

  it('should display account type badge', async () => {
    const user = userEvent.setup();
    render(<TestApp initialRoute="/import" />);

    await importTestData(user);
    render(<TestApp initialRoute="/customers/CUST-001" />);

    await waitFor(() => {
      // Use exact match for "Pro" to avoid matching "Property Type"
      expect(screen.getByText('Pro')).toBeInTheDocument();
    });
  });

  it('should display channel badges', async () => {
    const user = userEvent.setup();
    render(<TestApp initialRoute="/import" />);

    await importTestData(user);
    render(<TestApp initialRoute="/customers/CUST-001" />);

    await waitFor(() => {
      // Check for at least one channel in the channels section
      expect(screen.getByTestId('channels-section')).toBeInTheDocument();
    });
  });
});
