import { type Customer } from '@domain/entities';
import { type HealthScoreCalculator } from '@domain/services';
import { type HealthScore } from '@domain/value-objects';

/**
 * Calculate health scores for all customers.
 * Returns a map from customer ID to their HealthScore.
 */
export function calculateAllHealthScores(
  customers: Customer[],
  healthScoreCalculator: HealthScoreCalculator
): Map<string, HealthScore> {
  const scores = new Map<string, HealthScore>();

  for (const customer of customers) {
    const result = healthScoreCalculator.calculate(customer);
    if (result.success) {
      scores.set(customer.id, result.value);
    }
  }

  return scores;
}
