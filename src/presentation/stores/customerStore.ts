import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import type { SearchCriteria } from '@domain/repositories';
import type { CustomerDTO, CustomerSummaryDTO, DashboardMetricsDTO } from '@application/dtos';

/**
 * Customer state for managing customer data
 */
interface CustomerState {
  /** List of customer summaries for display */
  customers: CustomerSummaryDTO[];
  /** Currently selected customer details */
  selectedCustomer: CustomerDTO | null;
  /** Dashboard metrics (counts, averages, etc.) */
  dashboardMetrics: DashboardMetricsDTO | null;
  /** Current search criteria */
  searchCriteria: SearchCriteria | null;
  /** Last data refresh timestamp */
  lastUpdated: Date | null;
}

/**
 * Customer actions for updating state
 */
interface CustomerActions {
  /** Set the customer list */
  setCustomers: (customers: CustomerSummaryDTO[]) => void;
  /** Set the selected customer */
  setSelectedCustomer: (customer: CustomerDTO | null) => void;
  /** Set dashboard metrics */
  setDashboardMetrics: (metrics: DashboardMetricsDTO) => void;
  /** Set search criteria */
  setSearchCriteria: (criteria: SearchCriteria | null) => void;
  /** Clear all customer data */
  clearAll: () => void;
}

const initialState: CustomerState = {
  customers: [],
  selectedCustomer: null,
  dashboardMetrics: null,
  searchCriteria: null,
  lastUpdated: null,
};

/**
 * Zustand store for customer data.
 * Use selective subscriptions to avoid unnecessary re-renders:
 *
 * @example
 * // Good: Only re-renders when customers change
 * const customers = useCustomerStore((state) => state.customers);
 *
 * // Bad: Re-renders on any state change
 * const store = useCustomerStore();
 */
export const useCustomerStore = create<CustomerState & CustomerActions>()(
  devtools(
    (set) => ({
      ...initialState,

      setCustomers: (customers) =>
        set({ customers, lastUpdated: new Date() }, false, 'setCustomers'),

      setSelectedCustomer: (selectedCustomer) =>
        set({ selectedCustomer }, false, 'setSelectedCustomer'),

      setDashboardMetrics: (dashboardMetrics) =>
        set({ dashboardMetrics, lastUpdated: new Date() }, false, 'setDashboardMetrics'),

      setSearchCriteria: (searchCriteria) =>
        set({ searchCriteria }, false, 'setSearchCriteria'),

      clearAll: () => set(initialState, false, 'clearAll'),
    }),
    { name: 'CustomerStore' }
  )
);
