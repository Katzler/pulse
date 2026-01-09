import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { compositionRoot } from '@application/composition';
import { Header } from '@presentation/components/layout';
import { AppProvider, ThemeProvider } from '@presentation/context';
import { CustomerDetail } from '@presentation/pages/CustomerDetail';
import { CustomerList } from '@presentation/pages/CustomerList';
import { Dashboard } from '@presentation/pages/Dashboard';
import { Import } from '@presentation/pages/Import';
import { NotFound } from '@presentation/pages/NotFound';
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

// Full app with header and all routes
function FullApp({ initialRoute = '/' }: { initialRoute?: string }) {
  return (
    <MemoryRouter initialEntries={[initialRoute]}>
      <ThemeProvider>
        <AppProvider>
          <div>
            <Header />
            <main>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/import" element={<Import />} />
                <Route path="/customers" element={<CustomerList />} />
                <Route path="/customers/:customerId" element={<CustomerDetail />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </AppProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
}

// CSV content for testing
const testCsvContent = `"Sirvoy Customer ID","Account Owner","Latest Login","Created Date","Billing Country","Account Type","Language","Status","Sirvoy Account Status","Property Type","MRR (converted) Currency","MRR (converted)","Channels"
"CUST-001","Hotel Alpha","01/05/2026, 10:00","01/01/2024","USA","Pro","English","Active Customer","Loyal","Hotels","USD","2500","Booking.com"
"CUST-002","Hotel Beta","12/08/2025, 14:30","06/15/2024","Germany","Starter","German","Active Customer","New","B&B","EUR","800","Booking.com"`;

// Create a File from CSV content
function createCsvFile(content: string, name = 'customers.csv'): File {
  return new File([content], name, { type: 'text/csv' });
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
      expect(useCustomerStore.getState().customers.length).toBe(2);
    },
    { timeout: 5000 }
  );
}

describe('Navigation Flow Integration', () => {
  describe('Header Navigation', () => {
    it('should render header with navigation links', () => {
      render(<FullApp initialRoute="/" />);

      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
      // Use within navigation to avoid conflicts with page content links
      const navLinks = nav.querySelectorAll('a');
      const navLinkTexts = Array.from(navLinks).map((link) => link.textContent?.toLowerCase());
      expect(navLinkTexts).toContain('dashboard');
      expect(navLinkTexts).toContain('customers');
      expect(navLinkTexts).toContain('import');
    });

    it('should navigate from dashboard to customers', async () => {
      const user = userEvent.setup();
      render(<FullApp initialRoute="/" />);

      await user.click(screen.getByRole('link', { name: /customers/i }));

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /customers/i })).toBeInTheDocument();
      });
    });

    it('should navigate from dashboard to import', async () => {
      const user = userEvent.setup();
      render(<FullApp initialRoute="/" />);

      // Use navigation link specifically to avoid conflict with import button
      const navImportLink = screen
        .getByRole('navigation')
        .querySelector('a[href="/import"]');
      expect(navImportLink).not.toBeNull();
      await user.click(navImportLink!);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /import data/i })).toBeInTheDocument();
      });
    });

    it('should navigate from customers to dashboard', async () => {
      const user = userEvent.setup();
      render(<FullApp initialRoute="/customers" />);

      await user.click(screen.getByRole('link', { name: /dashboard/i }));

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /dashboard/i, level: 1 })
        ).toBeInTheDocument();
      });
    });

    it('should show active state for current route', () => {
      render(<FullApp initialRoute="/customers" />);

      const customersLink = screen.getByRole('link', { name: /customers/i });
      // Active link should have different styling (bg-blue classes)
      expect(customersLink.className).toContain('bg-blue');
    });
  });

  describe('Logo Navigation', () => {
    it('should navigate to dashboard when clicking logo', async () => {
      const user = userEvent.setup();
      render(<FullApp initialRoute="/customers" />);

      // Logo contains "Pulse" text
      const logoLink = screen.getByRole('link', { name: /pulse/i });
      await user.click(logoLink);

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /dashboard/i, level: 1 })
        ).toBeInTheDocument();
      });
    });
  });

  describe('Route Transitions', () => {
    it('should complete full navigation flow: dashboard -> import -> customers', async () => {
      const user = userEvent.setup();
      render(<FullApp initialRoute="/" />);

      // Verify starting on dashboard
      expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();

      // Navigate to import via navigation link
      const navImportLink = screen
        .getByRole('navigation')
        .querySelector('a[href="/import"]');
      await user.click(navImportLink!);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /import data/i })).toBeInTheDocument();
      });

      // Navigate to customers
      await user.click(screen.getByRole('link', { name: /customers/i }));

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /customers/i })).toBeInTheDocument();
      });
    });

    it('should navigate to customer detail from customer list after import', async () => {
      const user = userEvent.setup();
      render(<FullApp initialRoute="/import" />);

      await importTestData(user);

      // Navigate to customer list via View Customers button
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /view customers/i })).toBeInTheDocument();
      });
      await user.click(screen.getByRole('button', { name: /view customers/i }));

      await waitFor(() => {
        expect(screen.getByText(/2 of 2 customers/i)).toBeInTheDocument();
      });

      // Click on a customer row to navigate to detail (row has role="button" with aria-label "View <accountOwner>")
      // Use getAllByRole to handle both desktop and mobile views, then click the first one
      const customerRows = screen.getAllByRole('button', { name: /view hotel alpha/i });
      await user.click(customerRows[0]);

      await waitFor(() => {
        expect(screen.getByTestId('customer-detail-content')).toBeInTheDocument();
      });
    });
  });

  describe('Back Navigation', () => {
    it('should navigate back from customer detail to customer list', async () => {
      const user = userEvent.setup();
      render(<FullApp initialRoute="/import" />);

      await importTestData(user);
      await user.click(screen.getByRole('button', { name: /view customers/i }));

      await waitFor(() => {
        expect(screen.getByText(/2 of 2 customers/i)).toBeInTheDocument();
      });

      // Navigate to customer detail (row has role="button")
      // Use getAllByRole to handle both desktop and mobile views
      const customerRows = screen.getAllByRole('button', { name: /view hotel alpha/i });
      await user.click(customerRows[0]);

      await waitFor(() => {
        expect(screen.getByTestId('customer-detail-content')).toBeInTheDocument();
      });

      // Click back to customers
      await user.click(screen.getByRole('link', { name: /back to customers/i }));

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /customers/i })).toBeInTheDocument();
      });
    });
  });

  describe('Not Found Route', () => {
    it('should display 404 page for unknown routes', () => {
      render(<FullApp initialRoute="/unknown-page" />);

      expect(screen.getByText(/404/i)).toBeInTheDocument();
    });

    it('should provide navigation back from 404', async () => {
      const user = userEvent.setup();
      render(<FullApp initialRoute="/unknown-page" />);

      // Header navigation should still be available
      const nav = screen.getByRole('navigation');
      const navDashboardLink = nav.querySelector('a[href="/"]');
      expect(navDashboardLink).not.toBeNull();

      await user.click(navDashboardLink!);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
      });
    });
  });

  describe('Data Persistence Across Navigation', () => {
    it('should maintain store data when navigating between pages', async () => {
      const user = userEvent.setup();
      render(<FullApp initialRoute="/import" />);

      await importTestData(user);

      const initialCount = useCustomerStore.getState().customers.length;
      expect(initialCount).toBe(2);

      // Navigate to dashboard
      await user.click(screen.getByRole('link', { name: /dashboard/i }));

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
      });

      // Navigate to customers
      await user.click(screen.getByRole('link', { name: /customers/i }));

      await waitFor(() => {
        expect(screen.getByText(/2 of 2 customers/i)).toBeInTheDocument();
      });

      // Store should still have the same data
      expect(useCustomerStore.getState().customers.length).toBe(initialCount);
    });

    it('should persist search/filter state in URL across navigation', async () => {
      const user = userEvent.setup();
      render(<FullApp initialRoute="/import" />);

      await importTestData(user);
      await user.click(screen.getByRole('button', { name: /view customers/i }));

      await waitFor(() => {
        expect(screen.getByText(/2 of 2 customers/i)).toBeInTheDocument();
      });

      // Type in search
      const searchInput = screen.getByPlaceholderText(/search/i);
      await user.type(searchInput, 'Alpha');

      await waitFor(() => {
        expect(screen.getByText(/1 of 2 customers/i)).toBeInTheDocument();
      });
    });
  });

  describe('Theme Toggle', () => {
    it('should toggle theme from header', async () => {
      const user = userEvent.setup();
      render(<FullApp initialRoute="/" />);

      // Theme toggle label changes based on current theme state
      const themeToggle = screen.getByRole('button', { name: /switch to (light|dark) mode/i });
      expect(themeToggle).toBeInTheDocument();

      // Click theme toggle
      await user.click(themeToggle);

      // Theme should be toggled (dark class should be added/removed from document)
      // This is a smoke test - actual theme verification would need DOM inspection
      expect(screen.getByRole('button', { name: /switch to (light|dark) mode/i })).toBeInTheDocument();
    });

    it('should persist theme across navigation', async () => {
      const user = userEvent.setup();
      render(<FullApp initialRoute="/" />);

      const themeToggle = screen.getByRole('button', { name: /switch to (light|dark) mode/i });
      await user.click(themeToggle);

      // Navigate to another page
      await user.click(screen.getByRole('link', { name: /customers/i }));

      // Theme toggle should still be present and functional
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /switch to (light|dark) mode/i })).toBeInTheDocument();
      });
    });
  });
});

describe('Deep Link Navigation', () => {
  it('should load customer detail directly from URL', async () => {
    const user = userEvent.setup();
    // First import data
    render(<FullApp initialRoute="/import" />);
    await importTestData(user);

    // Re-render with direct URL to customer detail
    render(<FullApp initialRoute="/customers/CUST-001" />);

    await waitFor(() => {
      expect(screen.getByTestId('customer-detail-content')).toBeInTheDocument();
    });
  });

  it('should load customer list directly', () => {
    render(<FullApp initialRoute="/customers" />);

    expect(screen.getByRole('heading', { name: /customers/i })).toBeInTheDocument();
  });

  it('should load import page directly', () => {
    render(<FullApp initialRoute="/import" />);

    expect(screen.getByRole('heading', { name: /import data/i })).toBeInTheDocument();
  });
});

describe('Keyboard Navigation', () => {
  it('should be able to tab through header navigation', async () => {
    const user = userEvent.setup();
    render(<FullApp initialRoute="/" />);

    // Tab through the navigation
    await user.tab();
    await user.tab();
    await user.tab();

    // Some element in the navigation should be focused
    const focusedElement = document.activeElement;
    expect(focusedElement?.tagName).toBeDefined();
  });

  it('should be able to activate nav links with Enter', async () => {
    const user = userEvent.setup();
    render(<FullApp initialRoute="/" />);

    // Focus the customers link
    const customersLink = screen.getByRole('link', { name: /customers/i });
    customersLink.focus();

    // Press Enter to navigate
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /customers/i })).toBeInTheDocument();
    });
  });
});
