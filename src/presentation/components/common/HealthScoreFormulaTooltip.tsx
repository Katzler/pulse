import { useMemo } from 'react';

import { HealthScoreCalculator } from '@domain/services';

import { InfoTooltip } from './Tooltip';

/**
 * Props for HealthScoreFormulaTooltip
 */
export interface HealthScoreFormulaTooltipProps {
  /** Position of the tooltip */
  position?: 'top' | 'right' | 'bottom' | 'left';
  /** Size of the info icon */
  iconSize?: 'small' | 'medium';
  /** What to show - 'factors' for factor weights, 'classifications' for thresholds */
  variant?: 'factors' | 'classifications' | 'full';
}

/**
 * Renders the factor weights section
 */
function FactorsContent() {
  const formula = useMemo(() => HealthScoreCalculator.explainFormula(), []);

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Weighted factors (100 points total):</p>
      <ul className="space-y-1.5">
        {formula.factors.map((factor) => (
          <li key={factor.name} className="flex justify-between text-xs">
            <span className="text-gray-700 dark:text-gray-300">{factor.name}</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">{factor.weight}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Renders the classification thresholds section
 */
function ClassificationsContent() {
  const formula = useMemo(() => HealthScoreCalculator.explainFormula(), []);

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Score classifications:</p>
      <ul className="space-y-1.5">
        {formula.classifications.map((classification) => (
          <li key={classification.name} className="flex justify-between text-xs">
            <span
              className={`font-medium ${
                classification.name === 'Healthy'
                  ? 'text-green-600 dark:text-green-400'
                  : classification.name === 'At Risk'
                    ? 'text-orange-600 dark:text-orange-400'
                    : 'text-red-600 dark:text-red-400'
              }`}
            >
              {classification.name}
            </span>
            <span className="text-gray-600 dark:text-gray-400">{classification.range}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Renders full formula explanation
 */
function FullContent() {
  const formula = useMemo(() => HealthScoreCalculator.explainFormula(), []);

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500 dark:text-gray-400">{formula.summary}</p>

      <div>
        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Factors:</p>
        <ul className="space-y-1">
          {formula.factors.map((factor) => (
            <li key={factor.name} className="flex justify-between text-xs">
              <span className="text-gray-600 dark:text-gray-400">{factor.name}</span>
              <span className="text-gray-900 dark:text-gray-100">{factor.maxPoints}pts</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Classifications:</p>
        <ul className="space-y-1">
          {formula.classifications.map((c) => (
            <li key={c.name} className="flex justify-between text-xs">
              <span
                className={
                  c.name === 'Healthy'
                    ? 'text-green-600 dark:text-green-400'
                    : c.name === 'At Risk'
                      ? 'text-orange-600 dark:text-orange-400'
                      : 'text-red-600 dark:text-red-400'
                }
              >
                {c.name}
              </span>
              <span className="text-gray-600 dark:text-gray-400">{c.range}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/**
 * HealthScoreFormulaTooltip displays an info icon that shows health score formula details.
 *
 * @example
 * <HealthScoreFormulaTooltip variant="factors" />
 * <HealthScoreFormulaTooltip variant="classifications" />
 * <HealthScoreFormulaTooltip variant="full" />
 */
export function HealthScoreFormulaTooltip({
  position = 'bottom',
  iconSize = 'small',
  variant = 'full',
}: HealthScoreFormulaTooltipProps) {
  const content = useMemo(() => {
    switch (variant) {
      case 'factors':
        return <FactorsContent />;
      case 'classifications':
        return <ClassificationsContent />;
      case 'full':
      default:
        return <FullContent />;
    }
  }, [variant]);

  const title = variant === 'classifications' ? 'Health Classifications' : 'Health Score Formula';

  return <InfoTooltip title={title} content={content} position={position} iconSize={iconSize} />;
}
