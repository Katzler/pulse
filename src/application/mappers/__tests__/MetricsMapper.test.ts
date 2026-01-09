import { describe, expect, it } from 'vitest';

import { Customer, type CustomerProps } from '@domain/entities';
import { type CustomerStatistics, type HealthDistribution } from '@domain/repositories';
import { MetricsMapper } from '@application/mappers/MetricsMapper';
import { AccountType, CustomerStatus } from '@shared/types';

function createTestCustomer(overrides: Partial<CustomerProps> = {}): Customer {
  const now = new Date('2024-01-15T10:00:00Z');
  const defaults: CustomerProps = {
    id: 'CUST-001',
    accountOwner: 'John Smith',
    accountName: 'Smith Hotels',
    latestLogin: now,
    createdDate: new Date('2023-01-01T00:00:00Z'),
    lastCsContactDate: new Date('2024-01-10'),
    billingCountry: 'Sweden',
    accountType: AccountType.Pro,
    languages: ['English'],
    status: CustomerStatus.Active,
    accountStatus: 'Loyal',
    propertyType: 'Hotels',
    currency: 'SEK',
    mrr: 1500,
    channels: ['Booking.com', 'Expedia'],
  };

  const result = Customer.create({ ...defaults, ...overrides });
  if (!result.success) {
    throw new Error(`Failed to create test customer: ${result.error.message}`);
  }
  return result.value;
}

describe('MetricsMapper', () => {
  describe('toDashboardMetricsDTO', () => {
    it('maps statistics correctly', () => {
      const statistics: CustomerStatistics = {
        totalCount: 100,
        activeCount: 75,
        inactiveCount: 25,
        averageHealthScore: 72.5,
        totalMrr: 150000,
        atRiskCount: 20,
      };

      const healthDistribution: HealthDistribution = {
        healthy: 60,
        atRisk: 30,
        critical: 10,
      };

      const customers = [
        createTestCustomer({ billingCountry: 'Sweden', propertyType: 'Hotels' }),
        createTestCustomer({
          id: 'CUST-002',
          billingCountry: 'Norway',
          propertyType: 'Hostel',
        }),
      ];

      const dto = MetricsMapper.toDashboardMetricsDTO(statistics, healthDistribution, customers);

      expect(dto.totalCustomers).toBe(100);
      expect(dto.activeCustomers).toBe(75);
      expect(dto.inactiveCustomers).toBe(25);
      expect(dto.averageHealthScore).toBe(72.5);
      expect(dto.totalMrr).toBe(150000);
    });

    it('maps health distribution correctly', () => {
      const statistics: CustomerStatistics = {
        totalCount: 100,
        activeCount: 75,
        inactiveCount: 25,
        averageHealthScore: 72.5,
        totalMrr: 150000,
        atRiskCount: 20,
      };

      const healthDistribution: HealthDistribution = {
        healthy: 60,
        atRisk: 30,
        critical: 10,
      };

      const dto = MetricsMapper.toDashboardMetricsDTO(statistics, healthDistribution, []);

      expect(dto.healthDistribution.healthy).toBe(60);
      expect(dto.healthDistribution.atRisk).toBe(30);
      expect(dto.healthDistribution.critical).toBe(10);
    });
  });

  describe('calculateCountryDistribution', () => {
    it('calculates distribution from customers', () => {
      const customers = [
        createTestCustomer({ id: 'C1', billingCountry: 'Sweden', mrr: 1000 }),
        createTestCustomer({ id: 'C2', billingCountry: 'Sweden', mrr: 2000 }),
        createTestCustomer({ id: 'C3', billingCountry: 'Norway', mrr: 1500 }),
      ];

      const distribution = MetricsMapper.calculateCountryDistribution(customers);

      expect(distribution).toHaveLength(2);

      const sweden = distribution.find((d) => d.name === 'Sweden');
      expect(sweden?.count).toBe(2);
      expect(sweden?.mrr).toBe(3000);

      const norway = distribution.find((d) => d.name === 'Norway');
      expect(norway?.count).toBe(1);
      expect(norway?.mrr).toBe(1500);
    });

    it('sorts by count descending', () => {
      const customers = [
        createTestCustomer({ id: 'C1', billingCountry: 'Sweden' }),
        createTestCustomer({ id: 'C2', billingCountry: 'Sweden' }),
        createTestCustomer({ id: 'C3', billingCountry: 'Sweden' }),
        createTestCustomer({ id: 'C4', billingCountry: 'Norway' }),
      ];

      const distribution = MetricsMapper.calculateCountryDistribution(customers);

      expect(distribution[0].name).toBe('Sweden');
      expect(distribution[0].count).toBe(3);
      expect(distribution[1].name).toBe('Norway');
      expect(distribution[1].count).toBe(1);
    });

    it('returns empty array for empty input', () => {
      const distribution = MetricsMapper.calculateCountryDistribution([]);
      expect(distribution).toEqual([]);
    });
  });

  describe('calculateChannelDistribution', () => {
    it('calculates distribution from customer channels', () => {
      const customers = [
        createTestCustomer({ id: 'C1', channels: ['Booking.com', 'Expedia'] }),
        createTestCustomer({ id: 'C2', channels: ['Booking.com', 'Airbnb'] }),
        createTestCustomer({ id: 'C3', channels: ['Expedia'] }),
      ];

      const distribution = MetricsMapper.calculateChannelDistribution(customers);

      expect(distribution).toHaveLength(3);

      const booking = distribution.find((d) => d.name === 'Booking.com');
      expect(booking?.count).toBe(2);

      const expedia = distribution.find((d) => d.name === 'Expedia');
      expect(expedia?.count).toBe(2);

      const airbnb = distribution.find((d) => d.name === 'Airbnb');
      expect(airbnb?.count).toBe(1);
    });

    it('handles customers with no channels', () => {
      const customers = [createTestCustomer({ id: 'C1', channels: [] })];

      const distribution = MetricsMapper.calculateChannelDistribution(customers);

      expect(distribution).toEqual([]);
    });
  });

  describe('calculatePropertyTypeDistribution', () => {
    it('calculates distribution from property types', () => {
      const customers = [
        createTestCustomer({ id: 'C1', propertyType: 'Hotels' }),
        createTestCustomer({ id: 'C2', propertyType: 'Hotels' }),
        createTestCustomer({ id: 'C3', propertyType: 'Hostel' }),
        createTestCustomer({ id: 'C4', propertyType: 'Apartment' }),
      ];

      const distribution = MetricsMapper.calculatePropertyTypeDistribution(customers);

      expect(distribution).toHaveLength(3);
      expect(distribution[0].name).toBe('Hotels');
      expect(distribution[0].count).toBe(2);
    });
  });

  describe('toHealthDistributionDTO', () => {
    it('maps health distribution correctly', () => {
      const distribution: HealthDistribution = {
        healthy: 50,
        atRisk: 30,
        critical: 20,
      };

      const dto = MetricsMapper.toHealthDistributionDTO(distribution);

      expect(dto.healthy).toBe(50);
      expect(dto.atRisk).toBe(30);
      expect(dto.critical).toBe(20);
    });
  });
});
