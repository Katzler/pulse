import { act } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import type { SearchCriteria } from '@domain/repositories';
import type { CustomerDTO, CustomerSummaryDTO, DashboardMetricsDTO } from '@application/dtos';

import { useCustomerStore } from '../customerStore';

describe('customerStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    act(() => {
      useCustomerStore.getState().clearAll();
    });
  });

  describe('initial state', () => {
    it('has empty customers array', () => {
      expect(useCustomerStore.getState().customers).toEqual([]);
    });

    it('has null selectedCustomer', () => {
      expect(useCustomerStore.getState().selectedCustomer).toBeNull();
    });

    it('has null dashboardMetrics', () => {
      expect(useCustomerStore.getState().dashboardMetrics).toBeNull();
    });

    it('has null searchCriteria', () => {
      expect(useCustomerStore.getState().searchCriteria).toBeNull();
    });

    it('has null lastUpdated', () => {
      expect(useCustomerStore.getState().lastUpdated).toBeNull();
    });
  });

  describe('setCustomers', () => {
    it('sets customers and updates lastUpdated', () => {
      const customers: CustomerSummaryDTO[] = [
        {
          id: 'cust-001',
          accountOwner: 'John Doe',
          accountName: 'Acme Hotels',
          status: 'Active Customer',
          accountType: 'Pro',
          healthScore: 85,
          healthClassification: 'healthy',
          mrr: 1000,
          channelCount: 3,
          latestLogin: '2024-01-15T10:30:00Z',
          lastCsContactDate: '2024-01-10T00:00:00Z',
          billingCountry: 'United States',
        },
      ];

      act(() => {
        useCustomerStore.getState().setCustomers(customers);
      });

      expect(useCustomerStore.getState().customers).toEqual(customers);
      expect(useCustomerStore.getState().lastUpdated).toBeInstanceOf(Date);
    });
  });

  describe('setSelectedCustomer', () => {
    it('sets selected customer', () => {
      const customer: CustomerDTO = {
        id: 'cust-001',
        accountOwner: 'John Doe',
        accountName: 'Acme Hotels',
        latestLogin: '2024-01-15T10:30:00Z',
        createdDate: '2023-06-01T00:00:00Z',
        lastCsContactDate: '2024-01-10T00:00:00Z',
        billingCountry: 'United States',
        accountType: 'Pro',
        languages: ['English', 'Spanish'],
        status: 'Active Customer',
        accountStatus: 'Loyal',
        propertyType: 'Hotel',
        mrr: 1000,
        currency: 'USD',
        channels: ['Booking.com', 'Expedia'],
        healthScore: 85,
        healthClassification: 'healthy',
      };

      act(() => {
        useCustomerStore.getState().setSelectedCustomer(customer);
      });

      expect(useCustomerStore.getState().selectedCustomer).toEqual(customer);
    });

    it('clears selected customer when set to null', () => {
      const customer: CustomerDTO = {
        id: 'cust-001',
        accountOwner: 'Jane Smith',
        accountName: 'Smith Rentals',
        latestLogin: '2024-01-10T14:00:00Z',
        createdDate: '2023-03-15T00:00:00Z',
        lastCsContactDate: null,
        billingCountry: 'Germany',
        accountType: 'Starter',
        languages: ['German'],
        status: 'Active Customer',
        accountStatus: 'New',
        propertyType: 'Vacation Rental',
        mrr: 500,
        currency: 'EUR',
        channels: ['Airbnb'],
        healthScore: 72,
        healthClassification: 'healthy',
      };

      act(() => {
        useCustomerStore.getState().setSelectedCustomer(customer);
        useCustomerStore.getState().setSelectedCustomer(null);
      });

      expect(useCustomerStore.getState().selectedCustomer).toBeNull();
    });
  });

  describe('setDashboardMetrics', () => {
    it('sets dashboard metrics and updates lastUpdated', () => {
      const metrics: DashboardMetricsDTO = {
        totalCustomers: 100,
        activeCustomers: 85,
        inactiveCustomers: 15,
        averageHealthScore: 75,
        totalMrr: 100000,
        healthDistribution: {
          healthy: 70,
          atRisk: 20,
          critical: 10,
        },
        countryDistribution: [
          { name: 'United States', count: 40 },
          { name: 'Germany', count: 25 },
        ],
        channelDistribution: [
          { name: 'Booking.com', count: 60 },
          { name: 'Expedia', count: 45 },
        ],
        propertyTypeDistribution: [
          { name: 'Hotel', count: 50 },
          { name: 'Vacation Rental', count: 30 },
        ],
      };

      act(() => {
        useCustomerStore.getState().setDashboardMetrics(metrics);
      });

      expect(useCustomerStore.getState().dashboardMetrics).toEqual(metrics);
      expect(useCustomerStore.getState().lastUpdated).toBeInstanceOf(Date);
    });
  });

  describe('setSearchCriteria', () => {
    it('sets search criteria', () => {
      const criteria: SearchCriteria = {
        query: 'hotel',
        languages: ['English'],
        channels: ['Booking.com'],
        status: 'Active Customer',
        country: 'United States',
        accountType: 'Pro',
        healthStatus: 'healthy',
        limit: 20,
        offset: 0,
      };

      act(() => {
        useCustomerStore.getState().setSearchCriteria(criteria);
      });

      expect(useCustomerStore.getState().searchCriteria).toEqual(criteria);
    });

    it('clears search criteria when set to null', () => {
      const criteria: SearchCriteria = {
        query: 'test',
        limit: 10,
      };

      act(() => {
        useCustomerStore.getState().setSearchCriteria(criteria);
        useCustomerStore.getState().setSearchCriteria(null);
      });

      expect(useCustomerStore.getState().searchCriteria).toBeNull();
    });
  });

  describe('clearAll', () => {
    it('resets all state to initial values', () => {
      // Set some state
      act(() => {
        useCustomerStore.getState().setCustomers([
          {
            id: 'cust-001',
            accountOwner: 'Test User',
            accountName: 'Test Account',
            status: 'Active Customer',
            accountType: 'Pro',
            healthScore: 85,
            healthClassification: 'healthy',
            mrr: 1000,
            channelCount: 2,
            latestLogin: '2024-01-10T14:00:00Z',
            lastCsContactDate: '2024-01-05T00:00:00Z',
            billingCountry: 'Germany',
          },
        ]);
        useCustomerStore.getState().setSearchCriteria({ query: 'test', limit: 10 });
      });

      // Clear all
      act(() => {
        useCustomerStore.getState().clearAll();
      });

      expect(useCustomerStore.getState().customers).toEqual([]);
      expect(useCustomerStore.getState().selectedCustomer).toBeNull();
      expect(useCustomerStore.getState().dashboardMetrics).toBeNull();
      expect(useCustomerStore.getState().searchCriteria).toBeNull();
      expect(useCustomerStore.getState().lastUpdated).toBeNull();
    });
  });
});
