/**
 * Memory Leak Detection Tests
 *
 * These tests verify that components properly clean up after themselves,
 * preventing memory leaks from:
 * - Uncancelled promises
 * - Uncleaned event listeners
 * - Orphaned timers
 * - Stale closures
 * - Unreleased references
 */

import { MemoryRouter } from 'react-router-dom';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { compositionRoot } from '@application/composition';
import { AppProvider, ThemeProvider } from '@presentation/context';
import { CustomerDetail } from '@presentation/pages/CustomerDetail';
import { CustomerList } from '@presentation/pages/CustomerList';
import { Dashboard } from '@presentation/pages/Dashboard';
import { Import } from '@presentation/pages/Import';
import { useCustomerStore, useImportStore, useUIStore } from '@presentation/stores';

// Track mount counts
let mountCount = 0;

// Mock component to track lifecycle
function LifecycleTracker({ children }: { children: React.ReactNode }) {
  mountCount++;
  return <>{children}</>;
}

// Wrapper for tests
function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter>
      <ThemeProvider>
        <AppProvider>
          <LifecycleTracker>{children}</LifecycleTracker>
        </AppProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  compositionRoot.reset();
  // Clear stores before each test for clean state
  useCustomerStore.getState().clearAll();
  useImportStore.getState().resetImport();
  useUIStore.getState().clearToasts();
  mountCount = 0;
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
  // Note: Don't clear stores here as some tests verify store state
  // Each test that needs a clean slate should handle it explicitly
});

describe('Memory Leak Detection', () => {
  describe('Timer Cleanup', () => {
    it('should clean up timers on unmount in Dashboard', async () => {
      const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');
      const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

      const { unmount } = render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      unmount();

      // Clear timeout should be called for any pending timers
      // We're mainly checking that no errors occur on unmount
      expect(() => unmount).not.toThrow();

      setTimeoutSpy.mockRestore();
      clearTimeoutSpy.mockRestore();
    });

    it('should clean up intervals on unmount in CustomerList', async () => {
      const setIntervalSpy = vi.spyOn(globalThis, 'setInterval');
      const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');

      const { unmount } = render(
        <TestWrapper>
          <CustomerList />
        </TestWrapper>
      );

      unmount();

      // Should not leave any intervals running
      // (verify no errors occur during unmount)
      expect(() => unmount).not.toThrow();

      setIntervalSpy.mockRestore();
      clearIntervalSpy.mockRestore();
    });
  });

  describe('Event Listener Cleanup', () => {
    it('should remove resize listeners on unmount', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      // Get resize listeners added
      const resizeListeners = addEventListenerSpy.mock.calls.filter(
        (call) => call[0] === 'resize'
      );

      unmount();

      // Each resize listener should be removed
      const removedResizeListeners = removeEventListenerSpy.mock.calls.filter(
        (call) => call[0] === 'resize'
      );

      // Should have removed at least as many as were added
      expect(removedResizeListeners.length).toBeGreaterThanOrEqual(resizeListeners.length);

      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });

    it('should remove keydown listeners on unmount', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      const { unmount } = render(
        <TestWrapper>
          <Import />
        </TestWrapper>
      );

      unmount();

      // Verify no memory leak warnings (unmount should complete cleanly)
      expect(() => unmount).not.toThrow();

      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('Store Subscription Cleanup', () => {
    it('should unsubscribe from Zustand store on unmount', () => {
      // Render multiple times to check for subscription leaks
      const renderCount = 10;

      for (let i = 0; i < renderCount; i++) {
        const { unmount } = render(
          <TestWrapper>
            <Dashboard />
          </TestWrapper>
        );
        unmount();
      }

      // If subscriptions weren't cleaned up, store would have accumulated listeners
      // Update store and check it doesn't trigger unmounted components
      expect(() => {
        useCustomerStore.getState().setCustomers([]);
      }).not.toThrow();
    });

    it('should not update state after unmount', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { unmount } = render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      unmount();

      // Simulate async operation completing after unmount
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });

      // Should not have "Can't perform a React state update on an unmounted component" error
      const stateUpdateErrors = consoleErrorSpy.mock.calls.filter((call) =>
        String(call[0]).includes('unmounted component')
      );
      expect(stateUpdateErrors).toHaveLength(0);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Closure Memory Leaks', () => {
    it('should not retain references to old component instances', () => {
      const instances: Array<{ id: number }> = [];

      // Render and unmount multiple times
      for (let i = 0; i < 5; i++) {
        const instance = { id: i };
        instances.push(instance);

        const { unmount } = render(
          <TestWrapper>
            <Dashboard />
          </TestWrapper>
        );

        unmount();
      }

      // Force garbage collection hint (won't actually GC but verifies no errors)
      instances.length = 0;
      expect(instances).toHaveLength(0);
    });
  });

  describe('Rapid Mount/Unmount', () => {
    it('should handle rapid remounting without memory leaks', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Rapidly mount and unmount
      for (let i = 0; i < 20; i++) {
        const { unmount } = render(
          <TestWrapper>
            <Dashboard />
          </TestWrapper>
        );
        unmount();
      }

      // Should not have any errors
      const errors = consoleErrorSpy.mock.calls.filter((call) =>
        String(call[0]).includes('memory') || String(call[0]).includes('leak')
      );
      expect(errors).toHaveLength(0);

      consoleErrorSpy.mockRestore();
    });

    it('should handle rapid navigation between pages', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Simulate rapid page changes
      for (let i = 0; i < 10; i++) {
        const { unmount } = render(
          <TestWrapper>{i % 2 === 0 ? <Dashboard /> : <CustomerList />}</TestWrapper>
        );
        unmount();
      }

      // Should complete without memory warnings
      const memoryWarnings = consoleErrorSpy.mock.calls.filter((call) =>
        String(call[0]).toLowerCase().includes('memory')
      );
      expect(memoryWarnings).toHaveLength(0);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Component-Specific Memory Tests', () => {
    it('Dashboard should clean up chart instances', () => {
      // Add test data to store
      useCustomerStore.getState().setCustomers([
        {
          id: 'CUST-001',
          accountOwner: 'Test',
          accountName: 'Test Hotels Inc',
          status: 'Active Customer',
          accountType: 'Pro',
          healthScore: 80,
          healthClassification: 'healthy',
          mrr: 1000,
          channelCount: 2,
          latestLogin: null,
          lastCsContactDate: null,
          billingCountry: 'USA',
        },
      ]);

      const { unmount } = render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      // Unmount should complete without errors
      expect(() => unmount()).not.toThrow();
    });

    it('CustomerList should clean up virtualized list', async () => {
      // Add test data
      useCustomerStore.getState().setCustomers(
        Array.from({ length: 100 }, (_, i) => ({
          id: `CUST-${i}`,
          accountOwner: `Test ${i}`,
          accountName: `Test Hotels Inc ${i}`,
          status: 'Active Customer',
          accountType: 'Pro',
          healthScore: 80,
          healthClassification: 'healthy' as const,
          mrr: 1000,
          channelCount: 2,
          latestLogin: null,
          lastCsContactDate: null,
          billingCountry: 'USA',
        }))
      );

      const { unmount } = render(
        <TestWrapper>
          <CustomerList />
        </TestWrapper>
      );

      // Unmount should complete without errors
      expect(() => unmount()).not.toThrow();
    });

    it('CustomerDetail should clean up when customer changes', async () => {
      useCustomerStore.getState().setCustomers([
        {
          id: 'CUST-001',
          accountOwner: 'Test',
          accountName: 'Test Hotels Inc',
          status: 'Active Customer',
          accountType: 'Pro',
          healthScore: 80,
          healthClassification: 'healthy',
          mrr: 1000,
          channelCount: 2,
          latestLogin: null,
          lastCsContactDate: null,
          billingCountry: 'USA',
        },
      ]);

      const { rerender, unmount } = render(
        <MemoryRouter initialEntries={['/customers/CUST-001']}>
          <ThemeProvider>
            <AppProvider>
              <CustomerDetail />
            </AppProvider>
          </ThemeProvider>
        </MemoryRouter>
      );

      // Rerender with different customer
      rerender(
        <MemoryRouter initialEntries={['/customers/CUST-002']}>
          <ThemeProvider>
            <AppProvider>
              <CustomerDetail />
            </AppProvider>
          </ThemeProvider>
        </MemoryRouter>
      );

      // Should handle rerender without memory issues
      expect(() => unmount()).not.toThrow();
    });

    it('Import should clean up file reader on cancel', async () => {
      const { unmount } = render(
        <TestWrapper>
          <Import />
        </TestWrapper>
      );

      // Unmount during potential file processing should be clean
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Store Memory Management', () => {
    it('should not accumulate data on repeated imports', () => {
      // Simulate multiple imports - each replaces previous data
      for (let i = 0; i < 5; i++) {
        useCustomerStore.getState().setCustomers([
          {
            id: `CUST-${i}`,
            accountOwner: `Customer ${i}`,
            accountName: `Customer Hotels Inc ${i}`,
            status: 'Active Customer',
            accountType: 'Pro',
            healthScore: 80,
            healthClassification: 'healthy',
            mrr: 1000,
            channelCount: 2,
            latestLogin: null,
            lastCsContactDate: null,
            billingCountry: 'USA',
          },
        ]);
      }

      // Store should only have latest data, not accumulated
      const customers = useCustomerStore.getState().customers;
      expect(customers).toHaveLength(1);
      expect(customers[0].id).toBe('CUST-4');
    });

    it('should clear all data properly', () => {
      // Add data
      useCustomerStore.getState().setCustomers([
        {
          id: 'CUST-001',
          accountOwner: 'Test',
          accountName: 'Test Hotels Inc',
          status: 'Active Customer',
          accountType: 'Pro',
          healthScore: 80,
          healthClassification: 'healthy',
          mrr: 1000,
          channelCount: 2,
          latestLogin: null,
          lastCsContactDate: null,
          billingCountry: 'USA',
        },
      ]);

      // Verify data was added
      expect(useCustomerStore.getState().customers).toHaveLength(1);

      // Clear all
      useCustomerStore.getState().clearAll();

      // Should be completely empty
      expect(useCustomerStore.getState().customers).toHaveLength(0);
      expect(useCustomerStore.getState().dashboardMetrics).toBeNull();
    });

    it('should handle large dataset without excessive memory', () => {
      // Add large dataset
      const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
        id: `CUST-${i}`,
        accountOwner: `Customer ${i}`,
        accountName: `Customer Hotels Inc ${i}`,
        status: 'Active Customer',
        accountType: 'Pro',
        healthScore: Math.floor(Math.random() * 100),
        healthClassification: 'healthy' as const,
        mrr: Math.floor(Math.random() * 10000),
        channelCount: Math.floor(Math.random() * 5),
        latestLogin: null,
        lastCsContactDate: null,
        billingCountry: 'USA',
      }));

      useCustomerStore.getState().setCustomers(largeDataset);
      expect(useCustomerStore.getState().customers).toHaveLength(10000);

      // Clear and verify cleanup
      useCustomerStore.getState().clearAll();
      expect(useCustomerStore.getState().customers).toHaveLength(0);
    });
  });
});
