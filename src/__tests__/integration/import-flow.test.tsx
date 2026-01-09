import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { compositionRoot } from '@application/composition';
import { AppProvider, ThemeProvider } from '@presentation/context';
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

// Test wrapper with real providers
function TestApp({ initialRoute = '/' }: { initialRoute?: string }) {
  return (
    <MemoryRouter initialEntries={[initialRoute]}>
      <ThemeProvider>
        <AppProvider>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/import" element={<Import />} />
          </Routes>
        </AppProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
}

// Valid CSV content for testing
const validCsvContent = `"Sirvoy Customer ID","Account Owner","Latest Login","Created Date","Billing Country","Account Type","Language","Status","Sirvoy Account Status","Property Type","MRR (converted) Currency","MRR (converted)","Channels"
"CUST-001","Hotel Alpha","01/05/2026, 10:00","01/01/2024","USA","Pro","English","Active Customer","Loyal","Hotels","USD","2500","Booking.com, Expedia"
"CUST-002","Hotel Beta","01/03/2026, 14:30","06/15/2024","Germany","Starter","German, English","Active Customer","New","B&B","EUR","800","Booking.com"
"CUST-003","Hotel Gamma","","01/01/2023","France","Pro","French","Inactive Customer","Churned","Hotels","EUR","1500","Airbnb"`;

// Create a File from CSV content
function createCsvFile(content: string, name = 'customers.csv'): File {
  return new File([content], name, { type: 'text/csv' });
}

describe('Import Flow Integration', () => {
  it('should render import page with file upload', () => {
    render(<TestApp initialRoute="/import" />);

    expect(screen.getByRole('heading', { name: /Import Data/i })).toBeInTheDocument();
  });

  it('should show file upload area', () => {
    render(<TestApp initialRoute="/import" />);

    // Use accessible query - the upload area has role="button" and aria-label
    expect(screen.getByRole('button', { name: /upload customer csv file/i })).toBeInTheDocument();
  });

  it('should import CSV file and update store', async () => {
    const user = userEvent.setup();
    render(<TestApp initialRoute="/import" />);

    const file = createCsvFile(validCsvContent);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    expect(fileInput).not.toBeNull();
    await user.upload(fileInput, file);

    // Wait for Import Data button to appear
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /import data/i })).toBeInTheDocument();
    });

    // Click the Import Data button
    await user.click(screen.getByRole('button', { name: /import data/i }));

    // Wait for import to complete and store to be updated
    await waitFor(
      () => {
        const customers = useCustomerStore.getState().customers;
        expect(customers.length).toBe(3);
      },
      { timeout: 5000 }
    );
  });

  it('should calculate health scores for imported customers', async () => {
    const user = userEvent.setup();
    render(<TestApp initialRoute="/import" />);

    const file = createCsvFile(validCsvContent);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    expect(fileInput).not.toBeNull();
    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /import data/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /import data/i }));

    await waitFor(
      () => {
        const customers = useCustomerStore.getState().customers;
        expect(customers.length).toBeGreaterThan(0);
        // All customers should have valid health scores
        customers.forEach((customer) => {
          expect(customer.healthScore).toBeGreaterThanOrEqual(0);
          expect(customer.healthScore).toBeLessThanOrEqual(100);
        });
      },
      { timeout: 5000 }
    );
  });

  it('should handle customers who never logged in', async () => {
    const user = userEvent.setup();
    render(<TestApp initialRoute="/import" />);

    const file = createCsvFile(validCsvContent);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    expect(fileInput).not.toBeNull();
    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /import data/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /import data/i }));

    await waitFor(
      () => {
        const customers = useCustomerStore.getState().customers;
        const neverLoggedIn = customers.find((c) => c.id === 'CUST-003');
        expect(neverLoggedIn).toBeDefined();
        expect(neverLoggedIn?.latestLogin).toBeNull();
      },
      { timeout: 5000 }
    );
  });

  it('should reject non-CSV files', async () => {
    const user = userEvent.setup();
    render(<TestApp initialRoute="/import" />);

    const invalidFile = new File(['not a csv'], 'document.txt', { type: 'text/plain' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    expect(fileInput).not.toBeNull();
    await user.upload(fileInput, invalidFile);

    await waitFor(() => {
      // Should show error or not process the file
      const customers = useCustomerStore.getState().customers;
      expect(customers.length).toBe(0);
    });
  });
});

describe('Dashboard with data', () => {
  it('should show metrics when data is present', async () => {
    const user = userEvent.setup();
    // First import data
    const { unmount } = render(<TestApp initialRoute="/import" />);

    const file = createCsvFile(validCsvContent);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    expect(fileInput).not.toBeNull();
    await user.upload(fileInput, file);

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

    // Render dashboard with the same app state
    unmount();
    render(<TestApp initialRoute="/" />);

    await waitFor(() => {
      // Use getAllByText since the dashboard may display "Total Customers" in multiple places
      expect(screen.getAllByText(/Total Customers/i).length).toBeGreaterThan(0);
    });
  });
});
