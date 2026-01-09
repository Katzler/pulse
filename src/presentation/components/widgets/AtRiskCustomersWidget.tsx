import type { JSX } from 'react';
import { Link } from 'react-router-dom';

import type { CustomerSummaryDTO } from '@application/dtos';

/**
 * Props for AtRiskCustomersWidget component
 */
export interface AtRiskCustomersWidgetProps {
  /** List of at-risk customers to display */
  customers: CustomerSummaryDTO[];
  /** Maximum number of customers to show */
  maxDisplay?: number;
  /** Click handler for customer row */
  onCustomerClick?: (customerId: string) => void;
}

/**
 * Get badge color for health classification
 */
function getHealthBadgeClasses(classification: string): string {
  switch (classification) {
    case 'critical':
      return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
    case 'at-risk':
      return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
  }
}

/**
 * Format MRR for display
 */
function formatMrr(mrr: number): string {
  if (mrr >= 1000) {
    return `$${(mrr / 1000).toFixed(1)}K`;
  }
  return `$${mrr.toLocaleString()}`;
}

/**
 * Format days since last login
 */
function formatLastLogin(latestLogin: string | null): string {
  if (!latestLogin) {
    return 'Never logged in';
  }

  const loginDate = new Date(latestLogin);
  const now = new Date();
  const diffTime = now.getTime() - loginDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 30) return `${diffDays} days ago`;
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return months === 1 ? '1 month ago' : `${months} months ago`;
  }
  const years = Math.floor(diffDays / 365);
  return years === 1 ? '1 year ago' : `${years} years ago`;
}

/**
 * Get health score color classes
 */
function getHealthScoreClasses(classification: string): string {
  switch (classification) {
    case 'critical':
      return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30';
    case 'at-risk':
      return 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/30';
    default:
      return 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-800';
  }
}

/**
 * Customer row component
 */
function CustomerRow({
  customer,
  onClick,
}: {
  customer: CustomerSummaryDTO;
  onClick?: ((customerId: string) => void) | undefined;
}): JSX.Element {
  const badgeClasses = getHealthBadgeClasses(customer.healthClassification);
  const scoreClasses = getHealthScoreClasses(customer.healthClassification);

  const content = (
    <div className="flex items-start gap-3 w-full">
      {/* Health Score Circle */}
      <div
        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${scoreClasses}`}
      >
        {customer.healthScore}
      </div>

      {/* Customer Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {customer.accountName || customer.accountOwner} - {customer.id}
          </p>
          <span
            className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border ${badgeClasses}`}
          >
            {customer.healthClassification === 'critical' ? 'Critical' : 'At Risk'}
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {customer.accountOwner} • {customer.status} • {customer.accountType}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Last login: {formatLastLogin(customer.latestLogin)} • {customer.billingCountry}
        </p>
      </div>

      {/* MRR */}
      <div className="flex-shrink-0 text-right">
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {formatMrr(customer.mrr)}/mo
        </span>
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={() => onClick(customer.id)}
        className="w-full px-4 py-3 hover:bg-gray-50 dark:hover:bg-surface-700 transition-colors text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
        aria-label={`View Customer ID ${customer.id}, ${customer.accountOwner}, health score ${customer.healthScore}, ${customer.billingCountry}`}
      >
        {content}
      </button>
    );
  }

  return <div className="px-4 py-3">{content}</div>;
}

/**
 * Empty state when no at-risk customers
 */
function EmptyState(): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4">
      <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3">
        <svg
          className="w-6 h-6 text-green-600 dark:text-green-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No at-risk customers</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
        All customers are in good health
      </p>
    </div>
  );
}

/**
 * At-Risk Customers Widget component.
 * Displays a list of customers that need attention (at-risk and critical).
 * Sorted by health score ascending to show most critical first.
 *
 * @example
 * <AtRiskCustomersWidget
 *   customers={atRiskCustomers}
 *   maxDisplay={5}
 *   onCustomerClick={(id) => navigate(`/customers/${id}`)}
 * />
 */
export function AtRiskCustomersWidget({
  customers,
  maxDisplay = 5,
  onCustomerClick,
}: AtRiskCustomersWidgetProps): JSX.Element {
  // Filter for at-risk and critical, sort by health score ascending
  const atRiskCustomers = customers
    .filter(
      (c) =>
        c.healthClassification === 'at-risk' ||
        c.healthClassification === 'critical'
    )
    .sort((a, b) => a.healthScore - b.healthScore)
    .slice(0, maxDisplay);

  const totalAtRisk = customers.filter(
    (c) =>
      c.healthClassification === 'at-risk' ||
      c.healthClassification === 'critical'
  ).length;

  if (atRiskCustomers.length === 0) {
    return (
      <div data-testid="at-risk-customers-widget">
        <EmptyState />
      </div>
    );
  }

  return (
    <div data-testid="at-risk-customers-widget">
      {/* Customer list */}
      <div className="divide-y divide-gray-100 dark:divide-surface-700 -mx-4">
        {atRiskCustomers.map((customer) => (
          <CustomerRow
            key={customer.id}
            customer={customer}
            onClick={onCustomerClick}
          />
        ))}
      </div>

      {/* Footer with link to see all */}
      {totalAtRisk > maxDisplay && (
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-surface-700 text-center">
          <Link
            to="/customers?filter=at-risk"
            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            View all {totalAtRisk} at-risk customers →
          </Link>
        </div>
      )}

      {/* Accessible summary for screen readers */}
      <div className="sr-only" role="status" aria-live="polite">
        {totalAtRisk} customers need attention.
        Showing top {atRiskCustomers.length} by lowest health score.
        {atRiskCustomers
          .map(
            (c) => `${c.accountOwner}, health score ${c.healthScore}`
          )
          .join('. ')}
      </div>
    </div>
  );
}
