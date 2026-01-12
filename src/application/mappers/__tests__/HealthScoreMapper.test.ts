import { describe, expect, it } from 'vitest';

import { type FactorBreakdown } from '@domain/services';
import { HealthScoreMapper } from '@application/mappers/HealthScoreMapper';

describe('HealthScoreMapper', () => {
  describe('toBreakdownDTO', () => {
    it('maps all factor scores correctly', () => {
      const breakdown: FactorBreakdown = {
        activityStatus: 30,
        loginRecency: 25,
        channelAdoption: 20,
        accountType: 15,
        mrrValue: 10,
        sentimentAdjustment: 0,
        total: 100,
      };

      const dto = HealthScoreMapper.toBreakdownDTO(breakdown);

      expect(dto.totalScore).toBe(100);
      expect(dto.activityScore).toBe(30);
      expect(dto.loginRecencyScore).toBe(25);
      expect(dto.channelAdoptionScore).toBe(20);
      expect(dto.accountTypeScore).toBe(15);
      expect(dto.mrrScore).toBe(10);
      expect(dto.sentimentAdjustment).toBe(0);
    });

    it('handles partial scores', () => {
      const breakdown: FactorBreakdown = {
        activityStatus: 0,
        loginRecency: 15,
        channelAdoption: 8,
        accountType: 5,
        mrrValue: 2,
        sentimentAdjustment: 0,
        total: 30,
      };

      const dto = HealthScoreMapper.toBreakdownDTO(breakdown);

      expect(dto.totalScore).toBe(30);
      expect(dto.activityScore).toBe(0);
      expect(dto.loginRecencyScore).toBe(15);
      expect(dto.channelAdoptionScore).toBe(8);
      expect(dto.accountTypeScore).toBe(5);
      expect(dto.mrrScore).toBe(2);
      expect(dto.sentimentAdjustment).toBe(0);
    });

    it('handles zero scores', () => {
      const breakdown: FactorBreakdown = {
        activityStatus: 0,
        loginRecency: 0,
        channelAdoption: 0,
        accountType: 5,
        mrrValue: 0,
        sentimentAdjustment: 0,
        total: 5,
      };

      const dto = HealthScoreMapper.toBreakdownDTO(breakdown);

      expect(dto.totalScore).toBe(5);
      expect(dto.activityScore).toBe(0);
      expect(dto.loginRecencyScore).toBe(0);
      expect(dto.channelAdoptionScore).toBe(0);
      expect(dto.accountTypeScore).toBe(5);
      expect(dto.mrrScore).toBe(0);
      expect(dto.sentimentAdjustment).toBe(0);
    });

    it('handles sentiment adjustment', () => {
      const breakdown: FactorBreakdown = {
        activityStatus: 30,
        loginRecency: 25,
        channelAdoption: 20,
        accountType: 15,
        mrrValue: 10,
        sentimentAdjustment: -10,
        total: 90,
      };

      const dto = HealthScoreMapper.toBreakdownDTO(breakdown);

      expect(dto.totalScore).toBe(90);
      expect(dto.sentimentAdjustment).toBe(-10);
    });
  });
});
