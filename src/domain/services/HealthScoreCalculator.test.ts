import { describe, expect, it } from 'vitest';

import { Customer, type CustomerProps } from '@domain/entities';
import { HealthScoreClassification } from '@domain/value-objects';
import { AccountType, CustomerStatus } from '@shared/types';

import { HealthScoreCalculator } from './HealthScoreCalculator';

/**
 * Helper to create a customer with overridable defaults
 */
function createCustomer(overrides: Partial<CustomerProps> = {}): Customer {
  const now = new Date();
  const defaults: CustomerProps = {
    id: 'TEST-001',
    accountOwner: 'Test Owner',
    latestLogin: now,
    createdDate: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
    billingCountry: 'SE',
    accountType: AccountType.Pro,
    languages: ['English'],
    status: CustomerStatus.Active,
    accountStatus: 'Loyal',
    propertyType: 'Hotels',
    currency: 'SEK',
    mrr: 1500,
    channels: ['Booking.com', 'Expedia', 'Airbnb'],
  };

  const props = { ...defaults, ...overrides };
  const result = Customer.create(props);
  if (!result.success) {
    throw new Error(`Failed to create test customer: ${result.error.message}`);
  }
  return result.value;
}

/**
 * Helper to create a date N days ago
 */
function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

describe('HealthScoreCalculator', () => {
  const calculator = new HealthScoreCalculator();

  describe('calculate() - Activity Status Factor (30 points)', () => {
    it('gives 30 points for Active status', () => {
      const customer = createCustomer({ status: CustomerStatus.Active });
      const breakdown = calculator.getFactorBreakdown(customer);
      expect(breakdown.activityStatus).toBe(30);
    });

    it('gives 0 points for Inactive status', () => {
      const customer = createCustomer({ status: CustomerStatus.Inactive });
      const breakdown = calculator.getFactorBreakdown(customer);
      expect(breakdown.activityStatus).toBe(0);
    });
  });

  describe('calculate() - Login Recency Factor (25 points)', () => {
    it('gives 25 points for login within 7 days', () => {
      const customer = createCustomer({ latestLogin: daysAgo(5) });
      const breakdown = calculator.getFactorBreakdown(customer);
      expect(breakdown.loginRecency).toBe(25);
    });

    it('gives 25 points for login exactly 7 days ago (boundary)', () => {
      const customer = createCustomer({ latestLogin: daysAgo(7) });
      const breakdown = calculator.getFactorBreakdown(customer);
      expect(breakdown.loginRecency).toBe(25);
    });

    it('gives 20 points for login 8 days ago', () => {
      const customer = createCustomer({ latestLogin: daysAgo(8) });
      const breakdown = calculator.getFactorBreakdown(customer);
      expect(breakdown.loginRecency).toBe(20);
    });

    it('gives 20 points for login exactly 14 days ago (boundary)', () => {
      const customer = createCustomer({ latestLogin: daysAgo(14) });
      const breakdown = calculator.getFactorBreakdown(customer);
      expect(breakdown.loginRecency).toBe(20);
    });

    it('gives 15 points for login 15 days ago', () => {
      const customer = createCustomer({ latestLogin: daysAgo(15) });
      const breakdown = calculator.getFactorBreakdown(customer);
      expect(breakdown.loginRecency).toBe(15);
    });

    it('gives 15 points for login exactly 30 days ago (boundary)', () => {
      const customer = createCustomer({ latestLogin: daysAgo(30) });
      const breakdown = calculator.getFactorBreakdown(customer);
      expect(breakdown.loginRecency).toBe(15);
    });

    it('gives 10 points for login 31 days ago', () => {
      const customer = createCustomer({ latestLogin: daysAgo(31) });
      const breakdown = calculator.getFactorBreakdown(customer);
      expect(breakdown.loginRecency).toBe(10);
    });

    it('gives 10 points for login exactly 60 days ago (boundary)', () => {
      const customer = createCustomer({ latestLogin: daysAgo(60) });
      const breakdown = calculator.getFactorBreakdown(customer);
      expect(breakdown.loginRecency).toBe(10);
    });

    it('gives 5 points for login 61 days ago', () => {
      const customer = createCustomer({ latestLogin: daysAgo(61) });
      const breakdown = calculator.getFactorBreakdown(customer);
      expect(breakdown.loginRecency).toBe(5);
    });

    it('gives 5 points for login exactly 90 days ago (boundary)', () => {
      const customer = createCustomer({ latestLogin: daysAgo(90) });
      const breakdown = calculator.getFactorBreakdown(customer);
      expect(breakdown.loginRecency).toBe(5);
    });

    it('gives 0 points for login 91 days ago', () => {
      const customer = createCustomer({ latestLogin: daysAgo(91) });
      const breakdown = calculator.getFactorBreakdown(customer);
      expect(breakdown.loginRecency).toBe(0);
    });

    it('gives 0 points for login over 90 days ago', () => {
      const customer = createCustomer({ latestLogin: daysAgo(180) });
      const breakdown = calculator.getFactorBreakdown(customer);
      expect(breakdown.loginRecency).toBe(0);
    });
  });

  describe('calculate() - Channel Adoption Factor (20 points)', () => {
    it('gives 20 points for 5+ channels', () => {
      const customer = createCustomer({
        channels: ['Ch1', 'Ch2', 'Ch3', 'Ch4', 'Ch5', 'Ch6'],
      });
      const breakdown = calculator.getFactorBreakdown(customer);
      expect(breakdown.channelAdoption).toBe(20);
    });

    it('gives 20 points for exactly 5 channels (boundary)', () => {
      const customer = createCustomer({
        channels: ['Ch1', 'Ch2', 'Ch3', 'Ch4', 'Ch5'],
      });
      const breakdown = calculator.getFactorBreakdown(customer);
      expect(breakdown.channelAdoption).toBe(20);
    });

    it('gives 16 points for 4 channels', () => {
      const customer = createCustomer({
        channels: ['Ch1', 'Ch2', 'Ch3', 'Ch4'],
      });
      const breakdown = calculator.getFactorBreakdown(customer);
      expect(breakdown.channelAdoption).toBe(16);
    });

    it('gives 12 points for 3 channels', () => {
      const customer = createCustomer({
        channels: ['Ch1', 'Ch2', 'Ch3'],
      });
      const breakdown = calculator.getFactorBreakdown(customer);
      expect(breakdown.channelAdoption).toBe(12);
    });

    it('gives 8 points for 2 channels', () => {
      const customer = createCustomer({
        channels: ['Ch1', 'Ch2'],
      });
      const breakdown = calculator.getFactorBreakdown(customer);
      expect(breakdown.channelAdoption).toBe(8);
    });

    it('gives 4 points for 1 channel', () => {
      const customer = createCustomer({
        channels: ['Ch1'],
      });
      const breakdown = calculator.getFactorBreakdown(customer);
      expect(breakdown.channelAdoption).toBe(4);
    });

    it('gives 0 points for 0 channels', () => {
      const customer = createCustomer({
        channels: [],
      });
      const breakdown = calculator.getFactorBreakdown(customer);
      expect(breakdown.channelAdoption).toBe(0);
    });
  });

  describe('calculate() - Account Type Factor (15 points)', () => {
    it('gives 15 points for Pro account', () => {
      const customer = createCustomer({ accountType: AccountType.Pro });
      const breakdown = calculator.getFactorBreakdown(customer);
      expect(breakdown.accountType).toBe(15);
    });

    it('gives 5 points for Starter account', () => {
      const customer = createCustomer({ accountType: AccountType.Starter });
      const breakdown = calculator.getFactorBreakdown(customer);
      expect(breakdown.accountType).toBe(5);
    });
  });

  describe('calculate() - MRR Value Factor (10 points)', () => {
    it('gives 10 points for MRR >= 2000', () => {
      const customer = createCustomer({ mrr: 2500 });
      const breakdown = calculator.getFactorBreakdown(customer);
      expect(breakdown.mrrValue).toBe(10);
    });

    it('gives 10 points for MRR exactly 2000 (boundary)', () => {
      const customer = createCustomer({ mrr: 2000 });
      const breakdown = calculator.getFactorBreakdown(customer);
      expect(breakdown.mrrValue).toBe(10);
    });

    it('gives 8 points for MRR 1999', () => {
      const customer = createCustomer({ mrr: 1999 });
      const breakdown = calculator.getFactorBreakdown(customer);
      expect(breakdown.mrrValue).toBe(8);
    });

    it('gives 8 points for MRR exactly 1500 (boundary)', () => {
      const customer = createCustomer({ mrr: 1500 });
      const breakdown = calculator.getFactorBreakdown(customer);
      expect(breakdown.mrrValue).toBe(8);
    });

    it('gives 6 points for MRR 1499', () => {
      const customer = createCustomer({ mrr: 1499 });
      const breakdown = calculator.getFactorBreakdown(customer);
      expect(breakdown.mrrValue).toBe(6);
    });

    it('gives 6 points for MRR exactly 1000 (boundary)', () => {
      const customer = createCustomer({ mrr: 1000 });
      const breakdown = calculator.getFactorBreakdown(customer);
      expect(breakdown.mrrValue).toBe(6);
    });

    it('gives 4 points for MRR 999', () => {
      const customer = createCustomer({ mrr: 999 });
      const breakdown = calculator.getFactorBreakdown(customer);
      expect(breakdown.mrrValue).toBe(4);
    });

    it('gives 4 points for MRR exactly 500 (boundary)', () => {
      const customer = createCustomer({ mrr: 500 });
      const breakdown = calculator.getFactorBreakdown(customer);
      expect(breakdown.mrrValue).toBe(4);
    });

    it('gives 2 points for MRR 499', () => {
      const customer = createCustomer({ mrr: 499 });
      const breakdown = calculator.getFactorBreakdown(customer);
      expect(breakdown.mrrValue).toBe(2);
    });

    it('gives 2 points for MRR exactly 200 (boundary)', () => {
      const customer = createCustomer({ mrr: 200 });
      const breakdown = calculator.getFactorBreakdown(customer);
      expect(breakdown.mrrValue).toBe(2);
    });

    it('gives 0 points for MRR 199', () => {
      const customer = createCustomer({ mrr: 199 });
      const breakdown = calculator.getFactorBreakdown(customer);
      expect(breakdown.mrrValue).toBe(0);
    });

    it('gives 0 points for MRR 0', () => {
      const customer = createCustomer({ mrr: 0 });
      const breakdown = calculator.getFactorBreakdown(customer);
      expect(breakdown.mrrValue).toBe(0);
    });
  });

  describe('calculate() - Total Score', () => {
    it('returns a valid HealthScore value object', () => {
      const customer = createCustomer();
      const result = calculator.calculate(customer);
      expect(result.success).toBe(true);
    });

    it('calculates correct total for maximum score (100 points)', () => {
      // Active (30) + recent login (25) + 5+ channels (20) + Pro (15) + MRR >= 2000 (10) = 100
      const customer = createCustomer({
        status: CustomerStatus.Active,
        latestLogin: daysAgo(1),
        channels: ['Ch1', 'Ch2', 'Ch3', 'Ch4', 'Ch5'],
        accountType: AccountType.Pro,
        mrr: 2500,
      });

      const result = calculator.calculate(customer);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.value).toBe(100);
        expect(result.value.isHealthy()).toBe(true);
      }
    });

    it('calculates correct total for minimum score (0 points)', () => {
      // Inactive (0) + old login (0) + 0 channels (0) + Starter (5) + MRR < 200 (0) = 5
      // Wait, Starter still gives 5. Let's verify the actual minimum is 5, not 0
      const customer = createCustomer({
        status: CustomerStatus.Inactive,
        latestLogin: daysAgo(100),
        channels: [],
        accountType: AccountType.Starter,
        mrr: 0,
      });

      const result = calculator.calculate(customer);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.value).toBe(5); // Starter account gives 5 points minimum
        expect(result.value.isCritical()).toBe(true);
      }
    });

    it('calculates correct mixed score', () => {
      // Active (30) + login 20 days ago (15) + 2 channels (8) + Starter (5) + MRR 800 (4) = 62
      const customer = createCustomer({
        status: CustomerStatus.Active,
        latestLogin: daysAgo(20),
        channels: ['Ch1', 'Ch2'],
        accountType: AccountType.Starter,
        mrr: 800,
      });

      const result = calculator.calculate(customer);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.value).toBe(62);
        expect(result.value.isAtRisk()).toBe(true);
      }
    });

    it('is deterministic - same input produces same output', () => {
      const customer = createCustomer({
        status: CustomerStatus.Active,
        latestLogin: daysAgo(10),
        channels: ['Ch1', 'Ch2', 'Ch3'],
        accountType: AccountType.Pro,
        mrr: 1200,
      });

      const result1 = calculator.calculate(customer);
      const result2 = calculator.calculate(customer);

      expect(result1.success && result2.success).toBe(true);
      if (result1.success && result2.success) {
        expect(result1.value.value).toBe(result2.value.value);
      }
    });
  });

  describe('getFactorBreakdown()', () => {
    it('returns all factor scores', () => {
      const customer = createCustomer();
      const breakdown = calculator.getFactorBreakdown(customer);

      expect(breakdown).toHaveProperty('activityStatus');
      expect(breakdown).toHaveProperty('loginRecency');
      expect(breakdown).toHaveProperty('channelAdoption');
      expect(breakdown).toHaveProperty('accountType');
      expect(breakdown).toHaveProperty('mrrValue');
      expect(breakdown).toHaveProperty('total');
    });

    it('total equals sum of all factors', () => {
      const customer = createCustomer();
      const breakdown = calculator.getFactorBreakdown(customer);

      const sum =
        breakdown.activityStatus +
        breakdown.loginRecency +
        breakdown.channelAdoption +
        breakdown.accountType +
        breakdown.mrrValue;

      expect(breakdown.total).toBe(sum);
    });
  });

  describe('classification integration', () => {
    it('healthy customer has healthy classification', () => {
      const customer = createCustomer({
        status: CustomerStatus.Active,
        latestLogin: daysAgo(3),
        channels: ['Ch1', 'Ch2', 'Ch3', 'Ch4'],
        accountType: AccountType.Pro,
        mrr: 1500,
      });

      const result = calculator.calculate(customer);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.getClassification()).toBe(HealthScoreClassification.Healthy);
      }
    });

    it('at-risk customer has at-risk classification', () => {
      const customer = createCustomer({
        status: CustomerStatus.Active,
        latestLogin: daysAgo(45),
        channels: ['Ch1'],
        accountType: AccountType.Starter,
        mrr: 300,
      });

      const result = calculator.calculate(customer);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.getClassification()).toBe(HealthScoreClassification.AtRisk);
      }
    });

    it('critical customer has critical classification', () => {
      const customer = createCustomer({
        status: CustomerStatus.Inactive,
        latestLogin: daysAgo(100),
        channels: [],
        accountType: AccountType.Starter,
        mrr: 100,
      });

      const result = calculator.calculate(customer);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.getClassification()).toBe(HealthScoreClassification.Critical);
      }
    });
  });
});
