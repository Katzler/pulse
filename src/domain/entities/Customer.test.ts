import { describe, expect, it } from 'vitest';

import { AccountType, CustomerStatus } from '@shared/types';

import { Customer, type CustomerProps } from './Customer';

const createValidCustomerProps = (overrides?: Partial<CustomerProps>): CustomerProps => ({
  id: 'CUST-001',
  accountOwner: 'John Smith',
  latestLogin: new Date('2024-01-15T10:30:00'),
  createdDate: new Date('2023-01-01'),
  billingCountry: 'USA',
  accountType: AccountType.Pro,
  languages: ['English', 'Spanish'],
  status: CustomerStatus.Active,
  accountStatus: 'Loyal',
  propertyType: 'Hotels',
  currency: 'USD',
  mrr: 1500,
  channels: ['Booking.com', 'Expedia'],
  ...overrides,
});

describe('Customer Entity', () => {
  describe('creation', () => {
    it('creates a valid customer with all properties', () => {
      const props = createValidCustomerProps();
      const result = Customer.create(props);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.id).toBe('CUST-001');
        expect(result.value.accountOwner).toBe('John Smith');
        expect(result.value.accountType).toBe(AccountType.Pro);
        expect(result.value.status).toBe(CustomerStatus.Active);
        expect(result.value.mrr).toBe(1500);
        expect(result.value.languages).toEqual(['English', 'Spanish']);
        expect(result.value.channels).toEqual(['Booking.com', 'Expedia']);
      }
    });

    it('fails when customer ID is empty', () => {
      const props = createValidCustomerProps({ id: '' });
      const result = Customer.create(props);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Customer ID');
      }
    });

    it('fails when customer ID is only whitespace', () => {
      const props = createValidCustomerProps({ id: '   ' });
      const result = Customer.create(props);

      expect(result.success).toBe(false);
    });

    it('fails when MRR is negative', () => {
      const props = createValidCustomerProps({ mrr: -100 });
      const result = Customer.create(props);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('MRR');
      }
    });

    it('allows MRR of zero', () => {
      const props = createValidCustomerProps({ mrr: 0 });
      const result = Customer.create(props);

      expect(result.success).toBe(true);
    });

    it('fails when latest login is before created date', () => {
      const props = createValidCustomerProps({
        createdDate: new Date('2024-01-01'),
        latestLogin: new Date('2023-01-01'),
      });
      const result = Customer.create(props);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('login');
      }
    });

    it('allows latest login on same day as created date', () => {
      const props = createValidCustomerProps({
        createdDate: new Date('2024-01-01'),
        latestLogin: new Date('2024-01-01'),
      });
      const result = Customer.create(props);

      expect(result.success).toBe(true);
    });
  });

  describe('isActive()', () => {
    it('returns true for active customers', () => {
      const props = createValidCustomerProps({ status: CustomerStatus.Active });
      const result = Customer.create(props);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.isActive()).toBe(true);
      }
    });

    it('returns false for inactive customers', () => {
      const props = createValidCustomerProps({ status: CustomerStatus.Inactive });
      const result = Customer.create(props);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.isActive()).toBe(false);
      }
    });
  });

  describe('daysSinceLastLogin()', () => {
    it('calculates days since last login correctly', () => {
      const now = new Date('2024-01-20');
      const props = createValidCustomerProps({
        latestLogin: new Date('2024-01-15'),
      });
      const result = Customer.create(props);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.daysSinceLastLogin(now)).toBe(5);
      }
    });

    it('returns 0 when login was today', () => {
      const now = new Date('2024-01-15T18:00:00');
      const props = createValidCustomerProps({
        latestLogin: new Date('2024-01-15T10:00:00'),
      });
      const result = Customer.create(props);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.daysSinceLastLogin(now)).toBe(0);
      }
    });

    it('uses current date when no reference date provided', () => {
      const recentLogin = new Date();
      recentLogin.setDate(recentLogin.getDate() - 3);
      const props = createValidCustomerProps({
        latestLogin: recentLogin,
        createdDate: new Date('2020-01-01'),
      });
      const result = Customer.create(props);

      expect(result.success).toBe(true);
      if (result.success) {
        // Should be approximately 3 days
        const days = result.value.daysSinceLastLogin();
        expect(days).toBeGreaterThanOrEqual(2);
        expect(days).toBeLessThanOrEqual(4);
      }
    });
  });

  describe('channelCount', () => {
    it('returns correct channel count', () => {
      const props = createValidCustomerProps({
        channels: ['Booking.com', 'Expedia', 'Airbnb'],
      });
      const result = Customer.create(props);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.channelCount).toBe(3);
      }
    });

    it('returns 0 for empty channels', () => {
      const props = createValidCustomerProps({ channels: [] });
      const result = Customer.create(props);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.channelCount).toBe(0);
      }
    });
  });

  describe('hasChannel()', () => {
    it('returns true when customer has the channel', () => {
      const props = createValidCustomerProps({
        channels: ['Booking.com', 'Expedia'],
      });
      const result = Customer.create(props);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.hasChannel('Booking.com')).toBe(true);
      }
    });

    it('returns false when customer does not have the channel', () => {
      const props = createValidCustomerProps({
        channels: ['Booking.com', 'Expedia'],
      });
      const result = Customer.create(props);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.hasChannel('Airbnb')).toBe(false);
      }
    });

    it('is case-insensitive', () => {
      const props = createValidCustomerProps({
        channels: ['Booking.com'],
      });
      const result = Customer.create(props);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.hasChannel('booking.com')).toBe(true);
        expect(result.value.hasChannel('BOOKING.COM')).toBe(true);
      }
    });
  });

  describe('isPro()', () => {
    it('returns true for Pro accounts', () => {
      const props = createValidCustomerProps({ accountType: AccountType.Pro });
      const result = Customer.create(props);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.isPro()).toBe(true);
      }
    });

    it('returns false for Starter accounts', () => {
      const props = createValidCustomerProps({ accountType: AccountType.Starter });
      const result = Customer.create(props);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.isPro()).toBe(false);
      }
    });
  });

  describe('equality', () => {
    it('two customers with same ID are equal', () => {
      const props1 = createValidCustomerProps({ id: 'CUST-001', accountOwner: 'John' });
      const props2 = createValidCustomerProps({ id: 'CUST-001', accountOwner: 'Jane' });

      const result1 = Customer.create(props1);
      const result2 = Customer.create(props2);

      expect(result1.success && result2.success).toBe(true);
      if (result1.success && result2.success) {
        expect(result1.value.equals(result2.value)).toBe(true);
      }
    });

    it('two customers with different IDs are not equal', () => {
      const props1 = createValidCustomerProps({ id: 'CUST-001' });
      const props2 = createValidCustomerProps({ id: 'CUST-002' });

      const result1 = Customer.create(props1);
      const result2 = Customer.create(props2);

      expect(result1.success && result2.success).toBe(true);
      if (result1.success && result2.success) {
        expect(result1.value.equals(result2.value)).toBe(false);
      }
    });
  });
});
