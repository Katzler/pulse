import { describe, expect, it } from 'vitest';
import { SentimentInteraction } from './SentimentInteraction';

describe('SentimentInteraction', () => {
  const validProps = {
    caseNumber: 'CS-12345',
    customerId: 'CUST-001',
    sentimentScore: 0.5,
    interactionDate: new Date('2024-06-15'),
  };

  describe('create', () => {
    it('creates a valid interaction', () => {
      const result = SentimentInteraction.create(validProps);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.caseNumber).toBe('CS-12345');
        expect(result.value.customerId).toBe('CUST-001');
        expect(result.value.sentimentScore).toBe(0.5);
        expect(result.value.interactionDate).toEqual(new Date('2024-06-15'));
      }
    });

    it('trims whitespace from caseNumber and customerId', () => {
      const result = SentimentInteraction.create({
        ...validProps,
        caseNumber: '  CS-123  ',
        customerId: '  CUST-001  ',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.caseNumber).toBe('CS-123');
        expect(result.value.customerId).toBe('CUST-001');
      }
    });

    it('rejects empty caseNumber', () => {
      const result = SentimentInteraction.create({ ...validProps, caseNumber: '' });
      expect(result.success).toBe(false);
    });

    it('rejects whitespace-only caseNumber', () => {
      const result = SentimentInteraction.create({ ...validProps, caseNumber: '   ' });
      expect(result.success).toBe(false);
    });

    it('rejects empty customerId', () => {
      const result = SentimentInteraction.create({ ...validProps, customerId: '' });
      expect(result.success).toBe(false);
    });

    it('rejects whitespace-only customerId', () => {
      const result = SentimentInteraction.create({ ...validProps, customerId: '   ' });
      expect(result.success).toBe(false);
    });

    it('rejects sentimentScore below -1', () => {
      const result = SentimentInteraction.create({ ...validProps, sentimentScore: -1.1 });
      expect(result.success).toBe(false);
    });

    it('rejects sentimentScore above 1', () => {
      const result = SentimentInteraction.create({ ...validProps, sentimentScore: 1.1 });
      expect(result.success).toBe(false);
    });

    it('accepts sentimentScore at -1 boundary', () => {
      const result = SentimentInteraction.create({ ...validProps, sentimentScore: -1 });
      expect(result.success).toBe(true);
    });

    it('accepts sentimentScore at +1 boundary', () => {
      const result = SentimentInteraction.create({ ...validProps, sentimentScore: 1 });
      expect(result.success).toBe(true);
    });

    it('accepts sentimentScore of 0', () => {
      const result = SentimentInteraction.create({ ...validProps, sentimentScore: 0 });
      expect(result.success).toBe(true);
    });
  });

  describe('isNegative', () => {
    it('returns true for negative scores', () => {
      const result = SentimentInteraction.create({ ...validProps, sentimentScore: -0.5 });
      expect(result.success && result.value.isNegative()).toBe(true);
    });

    it('returns false for zero', () => {
      const result = SentimentInteraction.create({ ...validProps, sentimentScore: 0 });
      expect(result.success && result.value.isNegative()).toBe(false);
    });

    it('returns false for positive scores', () => {
      const result = SentimentInteraction.create({ ...validProps, sentimentScore: 0.3 });
      expect(result.success && result.value.isNegative()).toBe(false);
    });
  });

  describe('isPositive', () => {
    it('returns true for positive scores', () => {
      const result = SentimentInteraction.create({ ...validProps, sentimentScore: 0.5 });
      expect(result.success && result.value.isPositive()).toBe(true);
    });

    it('returns false for zero', () => {
      const result = SentimentInteraction.create({ ...validProps, sentimentScore: 0 });
      expect(result.success && result.value.isPositive()).toBe(false);
    });

    it('returns false for negative scores', () => {
      const result = SentimentInteraction.create({ ...validProps, sentimentScore: -0.3 });
      expect(result.success && result.value.isPositive()).toBe(false);
    });
  });

  describe('isNeutral', () => {
    it('returns true for zero', () => {
      const result = SentimentInteraction.create({ ...validProps, sentimentScore: 0 });
      expect(result.success && result.value.isNeutral()).toBe(true);
    });

    it('returns false for non-zero', () => {
      const result = SentimentInteraction.create({ ...validProps, sentimentScore: 0.1 });
      expect(result.success && result.value.isNeutral()).toBe(false);
    });
  });

  describe('getClassification', () => {
    it('returns "positive" for scores above 0.2', () => {
      const result = SentimentInteraction.create({ ...validProps, sentimentScore: 0.5 });
      expect(result.success && result.value.getClassification()).toBe('positive');
    });

    it('returns "negative" for scores below -0.2', () => {
      const result = SentimentInteraction.create({ ...validProps, sentimentScore: -0.5 });
      expect(result.success && result.value.getClassification()).toBe('negative');
    });

    it('returns "neutral" for scores in the -0.2 to 0.2 range', () => {
      const result = SentimentInteraction.create({ ...validProps, sentimentScore: 0.1 });
      expect(result.success && result.value.getClassification()).toBe('neutral');
    });

    it('returns "neutral" at exactly 0.2', () => {
      const result = SentimentInteraction.create({ ...validProps, sentimentScore: 0.2 });
      expect(result.success && result.value.getClassification()).toBe('neutral');
    });

    it('returns "neutral" at exactly -0.2', () => {
      const result = SentimentInteraction.create({ ...validProps, sentimentScore: -0.2 });
      expect(result.success && result.value.getClassification()).toBe('neutral');
    });
  });

  describe('equals', () => {
    it('returns true for same case number', () => {
      const r1 = SentimentInteraction.create(validProps);
      const r2 = SentimentInteraction.create({ ...validProps, sentimentScore: -0.3 });
      expect(r1.success && r2.success && r1.value.equals(r2.value)).toBe(true);
    });

    it('returns false for different case numbers', () => {
      const r1 = SentimentInteraction.create(validProps);
      const r2 = SentimentInteraction.create({ ...validProps, caseNumber: 'CS-99999' });
      expect(r1.success && r2.success && r1.value.equals(r2.value)).toBe(false);
    });
  });
});
