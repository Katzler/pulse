import { describe, expect, it } from 'vitest';

import { Customer, type CustomerProps } from '@domain/entities';
import { HealthScore, HealthScoreClassification } from '@domain/value-objects';
import { CustomerMapper } from '@application/mappers/CustomerMapper';
import { AccountType, CustomerStatus } from '@shared/types';

function createTestCustomer(overrides: Partial<CustomerProps> = {}): Customer {
  const now = new Date('2024-01-15T10:00:00Z');
  const defaults: CustomerProps = {
    id: 'CUST-001',
    accountOwner: 'John Smith',
    accountName: 'Acme Hotels',
    latestLogin: now,
    createdDate: new Date('2023-01-01T00:00:00Z'),
    lastCsContactDate: new Date('2024-01-10T00:00:00Z'),
    billingCountry: 'Sweden',
    accountType: AccountType.Pro,
    languages: ['English', 'Swedish'],
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

function createTestHealthScore(value: number): HealthScore {
  const result = HealthScore.create(value);
  if (!result.success) {
    throw new Error(`Failed to create health score: ${result.error}`);
  }
  return result.value;
}

describe('CustomerMapper', () => {
  describe('toDTO', () => {
    it('maps all customer fields correctly', () => {
      const customer = createTestCustomer();
      const healthScore = createTestHealthScore(85);

      const dto = CustomerMapper.toDTO(customer, healthScore);

      expect(dto.id).toBe('CUST-001');
      expect(dto.accountOwner).toBe('John Smith');
      expect(dto.billingCountry).toBe('Sweden');
      expect(dto.accountType).toBe('Pro');
      expect(dto.languages).toEqual(['English', 'Swedish']);
      expect(dto.status).toBe('Active Customer');
      expect(dto.accountStatus).toBe('Loyal');
      expect(dto.propertyType).toBe('Hotels');
      expect(dto.mrr).toBe(1500);
      expect(dto.currency).toBe('SEK');
      expect(dto.channels).toEqual(['Booking.com', 'Expedia']);
    });

    it('converts dates to ISO strings', () => {
      const customer = createTestCustomer();
      const healthScore = createTestHealthScore(85);

      const dto = CustomerMapper.toDTO(customer, healthScore);

      expect(dto.latestLogin).toBe('2024-01-15T10:00:00.000Z');
      expect(dto.createdDate).toBe('2023-01-01T00:00:00.000Z');
    });

    it('includes health score value and classification', () => {
      const customer = createTestCustomer();
      const healthScore = createTestHealthScore(85);

      const dto = CustomerMapper.toDTO(customer, healthScore);

      expect(dto.healthScore).toBe(85);
      expect(dto.healthClassification).toBe(HealthScoreClassification.Healthy);
    });

    it('maps at-risk classification correctly', () => {
      const customer = createTestCustomer();
      const healthScore = createTestHealthScore(50);

      const dto = CustomerMapper.toDTO(customer, healthScore);

      expect(dto.healthClassification).toBe(HealthScoreClassification.AtRisk);
    });

    it('maps critical classification correctly', () => {
      const customer = createTestCustomer();
      const healthScore = createTestHealthScore(20);

      const dto = CustomerMapper.toDTO(customer, healthScore);

      expect(dto.healthClassification).toBe(HealthScoreClassification.Critical);
    });

    it('creates independent array copies', () => {
      const customer = createTestCustomer();
      const healthScore = createTestHealthScore(85);

      const dto = CustomerMapper.toDTO(customer, healthScore);

      // Modifying DTO arrays should not affect originals
      dto.languages.push('German');
      dto.channels.push('Airbnb');

      expect(customer.languages).toHaveLength(2);
      expect(customer.channels).toHaveLength(2);
    });

    it('maps null latestLogin correctly', () => {
      const customer = createTestCustomer({ latestLogin: null });
      const healthScore = createTestHealthScore(50);

      const dto = CustomerMapper.toDTO(customer, healthScore);

      expect(dto.latestLogin).toBeNull();
    });
  });

  describe('toSummaryDTO', () => {
    it('maps summary fields correctly', () => {
      const customer = createTestCustomer();
      const healthScore = createTestHealthScore(75);

      const dto = CustomerMapper.toSummaryDTO(customer, healthScore);

      expect(dto.id).toBe('CUST-001');
      expect(dto.accountOwner).toBe('John Smith');
      expect(dto.status).toBe('Active Customer');
      expect(dto.accountType).toBe('Pro');
      expect(dto.healthScore).toBe(75);
      expect(dto.healthClassification).toBe(HealthScoreClassification.Healthy);
      expect(dto.mrr).toBe(1500);
      expect(dto.channelCount).toBe(2);
    });

    it('maps null latestLogin in summary correctly', () => {
      const customer = createTestCustomer({ latestLogin: null });
      const healthScore = createTestHealthScore(50);

      const dto = CustomerMapper.toSummaryDTO(customer, healthScore);

      expect(dto.latestLogin).toBeNull();
    });
  });

  describe('toDTOList', () => {
    it('maps multiple customers', () => {
      const customer1 = createTestCustomer({ id: 'CUST-001' });
      const customer2 = createTestCustomer({ id: 'CUST-002', accountOwner: 'Jane Doe' });

      const healthScores = new Map<string, HealthScore>();
      healthScores.set('CUST-001', createTestHealthScore(80));
      healthScores.set('CUST-002', createTestHealthScore(60));

      const dtos = CustomerMapper.toDTOList([customer1, customer2], healthScores);

      expect(dtos).toHaveLength(2);
      expect(dtos[0].id).toBe('CUST-001');
      expect(dtos[1].id).toBe('CUST-002');
    });

    it('skips customers without health scores', () => {
      const customer1 = createTestCustomer({ id: 'CUST-001' });
      const customer2 = createTestCustomer({ id: 'CUST-002' });

      const healthScores = new Map<string, HealthScore>();
      healthScores.set('CUST-001', createTestHealthScore(80));
      // CUST-002 has no health score

      const dtos = CustomerMapper.toDTOList([customer1, customer2], healthScores);

      expect(dtos).toHaveLength(1);
      expect(dtos[0].id).toBe('CUST-001');
    });

    it('returns empty array for empty input', () => {
      const dtos = CustomerMapper.toDTOList([], new Map());
      expect(dtos).toEqual([]);
    });
  });

  describe('toSummaryDTOList', () => {
    it('maps multiple customers to summaries', () => {
      const customer1 = createTestCustomer({ id: 'CUST-001' });
      const customer2 = createTestCustomer({ id: 'CUST-002' });

      const healthScores = new Map<string, HealthScore>();
      healthScores.set('CUST-001', createTestHealthScore(80));
      healthScores.set('CUST-002', createTestHealthScore(40));

      const dtos = CustomerMapper.toSummaryDTOList([customer1, customer2], healthScores);

      expect(dtos).toHaveLength(2);
      expect(dtos[0].healthClassification).toBe(HealthScoreClassification.Healthy);
      expect(dtos[1].healthClassification).toBe(HealthScoreClassification.AtRisk);
    });
  });
});
