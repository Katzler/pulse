import type { JSX } from 'react';

import type { HealthScoreBreakdownDTO } from '@application/dtos';

/**
 * Health factor configuration
 */
interface HealthFactor {
  key: keyof Omit<HealthScoreBreakdownDTO, 'totalScore'>;
  label: string;
  maxScore: number;
  color: string;
  bgColor: string;
  description: string;
}

/**
 * Health factor configurations with max scores and colors
 */
const healthFactors: HealthFactor[] = [
  {
    key: 'activityScore',
    label: 'Activity Status',
    maxScore: 30,
    color: 'bg-blue-500',
    bgColor: 'bg-blue-100',
    description: 'Based on customer active/inactive status',
  },
  {
    key: 'loginRecencyScore',
    label: 'Login Recency',
    maxScore: 25,
    color: 'bg-green-500',
    bgColor: 'bg-green-100',
    description: 'Based on days since last login',
  },
  {
    key: 'channelAdoptionScore',
    label: 'Channel Adoption',
    maxScore: 20,
    color: 'bg-purple-500',
    bgColor: 'bg-purple-100',
    description: 'Based on number of connected channels',
  },
  {
    key: 'accountTypeScore',
    label: 'Account Type',
    maxScore: 15,
    color: 'bg-orange-500',
    bgColor: 'bg-orange-100',
    description: 'Pro accounts score higher than Starter',
  },
  {
    key: 'mrrScore',
    label: 'MRR Value',
    maxScore: 10,
    color: 'bg-pink-500',
    bgColor: 'bg-pink-100',
    description: 'Based on monthly recurring revenue tier',
  },
];

/**
 * Get health classification based on score
 */
function getHealthClassification(score: number): {
  label: string;
  color: string;
  bgColor: string;
} {
  if (score >= 70) {
    return { label: 'Healthy', color: 'text-green-700', bgColor: 'bg-green-100' };
  }
  if (score >= 30) {
    return { label: 'At Risk', color: 'text-orange-700', bgColor: 'bg-orange-100' };
  }
  return { label: 'Critical', color: 'text-red-700', bgColor: 'bg-red-100' };
}

/**
 * Props for HealthScoreBreakdown component
 */
export interface HealthScoreBreakdownProps {
  /** Health score breakdown data */
  breakdown: HealthScoreBreakdownDTO;
  /** Show detailed descriptions */
  showDescriptions?: boolean;
  /** Show factor tooltips */
  showTooltips?: boolean;
  /** Additional CSS class */
  className?: string;
}

/**
 * Single factor bar component
 */
interface FactorBarProps {
  factor: HealthFactor;
  score: number;
  showDescription: boolean;
  animated: boolean;
}

function FactorBar({
  factor,
  score,
  showDescription,
  animated,
}: FactorBarProps): JSX.Element {
  const percentage = (score / factor.maxScore) * 100;
  const isMaxed = score === factor.maxScore;

  return (
    <div className="space-y-1.5" data-testid={`factor-${factor.key}`}>
      <div className="flex justify-between items-center text-sm">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${factor.color}`} />
          <span className="font-medium text-gray-700">{factor.label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={`font-semibold ${isMaxed ? 'text-green-600' : 'text-gray-900'}`}
            data-testid={`score-${factor.key}`}
          >
            {score}
          </span>
          <span className="text-gray-400">/</span>
          <span className="text-gray-500">{factor.maxScore}</span>
        </div>
      </div>
      <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${factor.color} rounded-full ${
            animated ? 'transition-all duration-500 ease-out' : ''
          }`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={factor.maxScore}
          aria-label={`${factor.label}: ${score} out of ${factor.maxScore}`}
        />
      </div>
      {showDescription && (
        <p className="text-xs text-gray-500 pl-4">{factor.description}</p>
      )}
    </div>
  );
}

/**
 * Total score summary component
 */
interface TotalScoreSummaryProps {
  totalScore: number;
}

function TotalScoreSummary({ totalScore }: TotalScoreSummaryProps): JSX.Element {
  const classification = getHealthClassification(totalScore);

  return (
    <div className="pt-4 border-t border-gray-200" data-testid="total-score-summary">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-base font-semibold text-gray-900">
            Total Health Score
          </span>
          <span
            className={`px-2 py-0.5 text-xs font-medium rounded-full ${classification.bgColor} ${classification.color}`}
          >
            {classification.label}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="text-2xl font-bold text-gray-900"
            data-testid="total-health-score"
          >
            {totalScore}
          </span>
          <span className="text-gray-400 text-lg">/</span>
          <span className="text-gray-500 text-lg">100</span>
        </div>
      </div>
      <div className="mt-3 h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${
            totalScore >= 70
              ? 'bg-green-500'
              : totalScore >= 30
                ? 'bg-orange-500'
                : 'bg-red-500'
          }`}
          style={{ width: `${totalScore}%` }}
          role="progressbar"
          aria-valuenow={totalScore}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Total health score: ${totalScore} out of 100`}
        />
      </div>
    </div>
  );
}

/**
 * Legend showing factor weights
 */
function FactorLegend(): JSX.Element {
  return (
    <div
      className="flex flex-wrap gap-3 pt-3 border-t border-gray-100"
      data-testid="factor-legend"
    >
      {healthFactors.map((factor) => (
        <div key={factor.key} className="flex items-center gap-1.5 text-xs">
          <span className={`w-2 h-2 rounded-full ${factor.color}`} />
          <span className="text-gray-600">
            {factor.label} ({factor.maxScore}pts)
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * HealthScoreBreakdown component displays a detailed breakdown of health score factors.
 * Shows individual factor scores with progress bars and overall total.
 *
 * @example
 * <HealthScoreBreakdown
 *   breakdown={{
 *     totalScore: 75,
 *     activityScore: 30,
 *     loginRecencyScore: 20,
 *     channelAdoptionScore: 15,
 *     accountTypeScore: 5,
 *     mrrScore: 5,
 *   }}
 * />
 */
export function HealthScoreBreakdown({
  breakdown,
  showDescriptions = false,
  className = '',
}: HealthScoreBreakdownProps): JSX.Element {
  return (
    <div
      className={`space-y-4 ${className}`}
      data-testid="health-score-breakdown"
      role="region"
      aria-label="Health score breakdown"
    >
      {/* Factor bars */}
      <div className="space-y-3">
        {healthFactors.map((factor) => (
          <FactorBar
            key={factor.key}
            factor={factor}
            score={breakdown[factor.key]}
            showDescription={showDescriptions}
            animated={true}
          />
        ))}
      </div>

      {/* Total score summary */}
      <TotalScoreSummary totalScore={breakdown.totalScore} />

      {/* Legend */}
      <FactorLegend />

      {/* Screen reader summary */}
      <div className="sr-only" role="status">
        Health score breakdown: Total score {breakdown.totalScore} out of 100.
        Activity status {breakdown.activityScore} out of 30.
        Login recency {breakdown.loginRecencyScore} out of 25.
        Channel adoption {breakdown.channelAdoptionScore} out of 20.
        Account type {breakdown.accountTypeScore} out of 15.
        MRR value {breakdown.mrrScore} out of 10.
      </div>
    </div>
  );
}
