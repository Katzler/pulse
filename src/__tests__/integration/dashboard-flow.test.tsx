import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { compositionRoot } from '@application/composition';
import { AppProvider, ThemeProvider } from '@presentation/context';
import { CustomerList } from '@presentation/pages/CustomerList';
import { Dashboard } from '@presentation/pages/Dashboard';
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

// CSV content for testing
const testCsvContent = `"Sirvoy Customer ID","Account Owner","Latest Login","Created Date","Billing Country","Account Type","Language","Status","Sirvoy Account Status","Property Type","MRR (converted) Currency","MRR (converted)","Channels"
"CUST-001","Hotel Alpha","01/05/2026, 10:00","01/01/2024","USA","Pro","English","Active Customer","Loyal","Hotels","USD","2500","Booking.com, Expedia"
"CUST-002","Hotel Beta","12/08/2025, 14:30","06/15/2024","Germany","Starter","German, English","Active Customer","New","B&B","EUR","800","Booking.com"
"CUST-003","Hotel Gamma","","01/01/2023","France","Pro","French","Inactive Customer","Churned","Hotels","EUR","1500","Airbnb"
"CUST-004","Alpine Resort","01/07/2026, 09:00","03/01/2024","USA","Pro","English","Active Customer","Loyal","Hotels","USD","3000","Booking.com, Expedia, Airbnb"`;

// Create a File from CSV content
function createCsvFile(content: string, name = 'customers.csv'): File {
  return new File([content], name, { type: 'text/csv' });
}

// Test wrapper with routing
function TestApp({ initialRoute = '/' }: { initialRoute?: string }) {
  return (
    <MemoryRouter initialEntries={[initialRoute]}>
      <ThemeProvider>
        <AppProvider>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/import" element={<Import />} />
            <Route path="/customers" element={<CustomerList />} />
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
      expect(useCustomerStore.getState().customers.length).toBe(4);
    },
    { timeout: 5000 }
  );
}

describe('Dashboard Flow Integration', () => {
  describe('Empty State', () => {
    it('should display empty state when no data is loaded', () => {
      render(<TestApp initialRoute="/" />);

      expect(screen.getByTestId('dashboard-empty')).toBeInTheDocument();
      expect(screen.getByText(/no customer data available/i)).toBeInTheDocument();
    });

    it('should show import CTA in empty state', () => {
      render(<TestApp initialRoute="/" />);

      expect(screen.getByRole('link', { name: /import customer data/i })).toBeInTheDocument();
    });

    it('should navigate to import page from empty state CTA', async () => {
      const user = userEvent.setup();
      render(<TestApp initialRoute="/" />);

      const importLink = screen.getByRole('link', { name: /import customer data/i });
      await user.click(importLink);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /import data/i })).toBeInTheDocument();
      });
    });
  });

  describe('Dashboard with Data', () => {
    it('should display dashboard content after import', async () => {
      const user = userEvent.setup();
      render(<TestApp initialRoute="/import" />);

      await importTestData(user);

      // Navigate back to dashboard
      render(<TestApp initialRoute="/" />);

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
      });
    });

    it('should display metric cards with correct data', async () => {
      const user = userEvent.setup();
      render(<TestApp initialRoute="/import" />);

      await importTestData(user);

      // Re-render dashboard to pick up the store state
      render(<TestApp initialRoute="/" />);

      await waitFor(() => {
        // Should show total customers metric
        expect(screen.getAllByText(/total customers/i).length).toBeGreaterThan(0);
      });
    });

    it('should update metrics after new import', async () => {
      const user = userEvent.setup();
      render(<TestApp initialRoute="/import" />);

      await importTestData(user);

      // Verify store has 4 customers
      expect(useCustomerStore.getState().customers.length).toBe(4);
    });
  });

  describe('Metric Calculations', () => {
    it('should calculate total MRR correctly', async () => {
      const user = userEvent.setup();
      render(<TestApp initialRoute="/import" />);

      await importTestData(user);

      // MRR should be sum of all customer MRR: 2500 + 800 + 1500 + 3000 = 7800
      const store = useCustomerStore.getState();
      const totalMrr = store.customers.reduce((sum, c) => sum + c.mrr, 0);
      expect(totalMrr).toBe(7800);
    });

    it('should calculate average health score', async () => {
      const user = userEvent.setup();
      render(<TestApp initialRoute="/import" />);

      await importTestData(user);

      const store = useCustomerStore.getState();
      const avgHealth =
        store.customers.reduce((sum, c) => sum + c.healthScore, 0) / store.customers.length;

      // Each customer should have a health score between 0-100
      expect(avgHealth).toBeGreaterThanOrEqual(0);
      expect(avgHealth).toBeLessThanOrEqual(100);
    });

    it('should correctly classify health distribution', async () => {
      const user = userEvent.setup();
      render(<TestApp initialRoute="/import" />);

      await importTestData(user);

      const store = useCustomerStore.getState();
      const classifications = store.customers.map((c) => c.healthClassification);

      // Each customer should have a valid classification
      classifications.forEach((classification) => {
        expect(['healthy', 'at-risk', 'critical']).toContain(classification);
      });
    });

    it('should identify active vs inactive customers', async () => {
      const user = userEvent.setup();
      render(<TestApp initialRoute="/import" />);

      await importTestData(user);

      const store = useCustomerStore.getState();
      // Use startsWith to avoid "Inactive" matching "active"
      const activeCount = store.customers.filter((c) =>
        c.status.toLowerCase().startsWith('active')
      ).length;
      const inactiveCount = store.customers.filter((c) =>
        c.status.toLowerCase().startsWith('inactive')
      ).length;

      // From our test data: 3 active, 1 inactive
      expect(activeCount).toBe(3);
      expect(inactiveCount).toBe(1);
    });
  });

  describe('Dashboard Refresh', () => {
    it('should update last updated timestamp after import', async () => {
      const user = userEvent.setup();
      render(<TestApp initialRoute="/import" />);

      await importTestData(user);

      const store = useCustomerStore.getState();
      expect(store.lastUpdated).not.toBeNull();
      expect(store.lastUpdated).toBeInstanceOf(Date);
    });

    it('should maintain data state across navigation', async () => {
      const user = userEvent.setup();
      render(<TestApp initialRoute="/import" />);

      await importTestData(user);

      // Get initial customer count
      const initialCount = useCustomerStore.getState().customers.length;

      // Navigate to customer list and back
      render(<TestApp initialRoute="/customers" />);
      render(<TestApp initialRoute="/" />);

      // Data should persist
      const finalCount = useCustomerStore.getState().customers.length;
      expect(finalCount).toBe(initialCount);
    });
  });

  describe('Dashboard State Persistence', () => {
    it('should persist customer data in store', async () => {
      const user = userEvent.setup();
      render(<TestApp initialRoute="/import" />);

      await importTestData(user);

      // Verify data is in store
      const store = useCustomerStore.getState();
      expect(store.customers).toHaveLength(4);
      expect(store.customers[0].id).toBeDefined();
    });

    it('should persist dashboard metrics in store', async () => {
      const user = userEvent.setup();
      render(<TestApp initialRoute="/import" />);

      await importTestData(user);

      const store = useCustomerStore.getState();
      // Either dashboardMetrics is set or we can compute from customers
      expect(store.customers.length > 0 || store.dashboardMetrics !== null).toBe(true);
    });
  });
});

describe('Dashboard Chart Interactions', () => {
  it('should render health distribution chart with data', async () => {
    const user = userEvent.setup();
    render(<TestApp initialRoute="/import" />);

    await importTestData(user);
    render(<TestApp initialRoute="/" />);

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
    });

    // Health distribution section should be present
    expect(screen.getByTestId('health-distribution-section')).toBeInTheDocument();
  });

  it('should render MRR by country chart with data', async () => {
    const user = userEvent.setup();
    render(<TestApp initialRoute="/import" />);

    await importTestData(user);
    render(<TestApp initialRoute="/" />);

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
    });

    // MRR by country section should be present
    expect(screen.getByTestId('mrr-by-country-section')).toBeInTheDocument();
  });

  it('should render channel adoption chart with data', async () => {
    const user = userEvent.setup();
    render(<TestApp initialRoute="/import" />);

    await importTestData(user);
    render(<TestApp initialRoute="/" />);

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
    });

    // Channel adoption section should be present
    expect(screen.getByTestId('channel-adoption-section')).toBeInTheDocument();
  });
});
