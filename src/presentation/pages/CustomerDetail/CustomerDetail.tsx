import { type JSX, useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import type {
  ComparativeMetricsDTO,
  CustomerDTO,
  CustomerTimelineDTO,
  HealthScoreBreakdownDTO,
} from '@application/dtos';
import type { GetCustomerDetailsOutput } from '@application/use-cases';
import { HealthScoreGauge } from '@presentation/components/charts';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  HealthScoreFormulaTooltip,
  LoadingSkeleton,
  PageErrorBoundary,
} from '@presentation/components/common';
import { useUseCases } from '@presentation/context';

/**
 * Format currency for display
 */
function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date for display
 */
function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format relative time (e.g., "5 days ago")
 */
function formatRelativeTime(days: number): string {
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  if (days < 365) {
    const months = Math.floor(days / 30);
    return months === 1 ? '1 month ago' : `${months} months ago`;
  }
  const years = Math.floor(days / 365);
  return years === 1 ? '1 year ago' : `${years} years ago`;
}

/**
 * Get status badge variant based on status text
 */
function getStatusBadgeVariant(status: string): 'success' | 'default' {
  return status.toLowerCase().includes('active') ? 'success' : 'default';
}

/**
 * Get account type badge variant
 */
function getAccountTypeBadgeVariant(accountType: string): 'info' | 'default' {
  return accountType.toLowerCase() === 'pro' ? 'info' : 'default';
}

/**
 * Get trend indicator for comparative metrics
 */
function getTrendIndicator(value: number): {
  icon: string;
  color: string;
  text: string;
} {
  if (value > 0) {
    return { icon: '↑', color: 'text-green-600', text: 'above average' };
  }
  if (value < 0) {
    return { icon: '↓', color: 'text-red-600', text: 'below average' };
  }
  return { icon: '→', color: 'text-gray-600', text: 'at average' };
}

/**
 * Props for the detail info row
 */
interface DetailRowProps {
  label: string;
  value: React.ReactNode;
  testId?: string | undefined;
}

/**
 * Single row in a detail section
 */
function DetailRow({ label, value, testId }: DetailRowProps): JSX.Element {
  return (
    <div className="flex justify-between py-2 border-b border-gray-100 dark:border-surface-700 last:border-0">
      <span className="text-gray-600 dark:text-gray-400">{label}</span>
      <span className="font-medium text-gray-900 dark:text-white" data-testid={testId}>
        {value}
      </span>
    </div>
  );
}

/**
 * Props for section header
 */
interface SectionHeaderProps {
  title: string;
  icon?: React.ReactNode | undefined;
}

/**
 * Section header with optional icon
 */
function SectionHeader({ title, icon }: SectionHeaderProps): JSX.Element {
  return (
    <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white mb-4">
      {icon}
      {title}
    </h2>
  );
}

/**
 * Back navigation component
 */
function BackNavigation(): JSX.Element {
  return (
    <Link
      to="/customers"
      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors mb-4"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      <span>Back to Customers</span>
    </Link>
  );
}

/**
 * Customer header with name and health score
 */
interface CustomerHeaderProps {
  customer: CustomerDTO;
}

function CustomerHeader({ customer }: CustomerHeaderProps): JSX.Element {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1
          className="text-2xl font-bold text-gray-900 dark:text-white"
          data-testid="customer-name"
        >
          {customer.accountName || `Customer ${customer.id}`}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          ID: {customer.id}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant={getStatusBadgeVariant(customer.status)}>
            {customer.status}
          </Badge>
          <Badge variant={getAccountTypeBadgeVariant(customer.accountType)}>
            {customer.accountType}
          </Badge>
          <span className="text-gray-500 dark:text-gray-400 text-sm">
            {customer.accountOwner}
          </span>
        </div>
      </div>
      <div className="flex-shrink-0">
        <HealthScoreGauge
          score={customer.healthScore}
          size="large"
          animated={false}
        />
      </div>
    </div>
  );
}

/**
 * Customer information section
 */
interface CustomerInfoSectionProps {
  customer: CustomerDTO;
}

function CustomerInfoSection({ customer }: CustomerInfoSectionProps): JSX.Element {
  return (
    <Card data-testid="customer-info-section">
      <SectionHeader
        title="Customer Information"
        icon={
          <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        }
      />
      <div className="space-y-1">
        <DetailRow label="Account Name" value={customer.accountName || '-'} testId="customer-account-name" />
        <DetailRow label="Account Owner" value={customer.accountOwner} />
        <DetailRow label="Country" value={customer.billingCountry} testId="customer-country" />
        <DetailRow
          label="Languages"
          value={customer.languages.join(', ') || 'None'}
          testId="customer-languages"
        />
        <DetailRow label="Property Type" value={customer.propertyType} />
        <DetailRow label="Account Status" value={customer.accountStatus} />
      </div>
    </Card>
  );
}

/**
 * Financial information section
 */
interface FinancialSectionProps {
  customer: CustomerDTO;
}

function FinancialSection({ customer }: FinancialSectionProps): JSX.Element {
  return (
    <Card data-testid="financial-section">
      <SectionHeader
        title="Financial"
        icon={
          <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />
      <div className="space-y-1">
        <DetailRow
          label="Monthly Recurring Revenue"
          value={formatCurrency(customer.mrr, customer.currency)}
          testId="customer-mrr"
        />
        <DetailRow label="Currency" value={customer.currency} />
      </div>
    </Card>
  );
}

/**
 * Channel adoption section
 */
interface ChannelsSectionProps {
  customer: CustomerDTO;
}

function ChannelsSection({ customer }: ChannelsSectionProps): JSX.Element {
  return (
    <Card data-testid="channels-section">
      <SectionHeader
        title="Connected Channels"
        icon={
          <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        }
      />
      {customer.channels.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {customer.channels.map((channel) => (
            <Badge key={channel} variant="info">
              {channel}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400">No channels connected</p>
      )}
      <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        <span className="font-medium">{customer.channels.length}</span> channel
        {customer.channels.length !== 1 ? 's' : ''} connected
      </p>
    </Card>
  );
}

/**
 * Health score breakdown section
 */
interface HealthBreakdownSectionProps {
  breakdown: HealthScoreBreakdownDTO | null;
}

function HealthBreakdownSection({ breakdown }: HealthBreakdownSectionProps): JSX.Element {
  if (!breakdown) {
    return (
      <Card data-testid="health-breakdown-section">
        <SectionHeader
          title="Health Score Breakdown"
          icon={
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          }
        />
        <LoadingSkeleton height={200} />
      </Card>
    );
  }

  const factors = [
    { label: 'Activity Status', score: breakdown.activityScore, max: 30, color: 'bg-blue-500' },
    { label: 'Login Recency', score: breakdown.loginRecencyScore, max: 25, color: 'bg-green-500' },
    { label: 'Channel Adoption', score: breakdown.channelAdoptionScore, max: 20, color: 'bg-purple-500' },
    { label: 'Account Type', score: breakdown.accountTypeScore, max: 15, color: 'bg-orange-500' },
    { label: 'MRR Value', score: breakdown.mrrScore, max: 10, color: 'bg-pink-500' },
  ];

  return (
    <Card data-testid="health-breakdown-section">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Health Score Breakdown</h2>
        <HealthScoreFormulaTooltip variant="factors" position="right" />
      </div>
      <div className="space-y-4">
        {factors.map((factor) => {
          const percentage = (factor.score / factor.max) * 100;
          return (
            <div key={factor.label} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700 dark:text-gray-300">{factor.label}</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {factor.score} / {factor.max}
                </span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-surface-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${factor.color} rounded-full transition-all duration-300`}
                  style={{ width: `${percentage}%` }}
                  role="progressbar"
                  aria-valuenow={factor.score}
                  aria-valuemin={0}
                  aria-valuemax={factor.max}
                  aria-label={`${factor.label}: ${factor.score} out of ${factor.max}`}
                />
              </div>
            </div>
          );
        })}

        <div className="pt-4 border-t border-gray-200 dark:border-surface-700">
          <div className="flex justify-between text-base font-semibold">
            <span className="text-gray-900 dark:text-white">Total Health Score</span>
            <span className="text-gray-900 dark:text-white" data-testid="total-health-score">
              {breakdown.totalScore} / 100
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

/**
 * Comparative metrics section
 */
interface ComparativeMetricsSectionProps {
  metrics: ComparativeMetricsDTO | null;
}

function ComparativeMetricsSection({ metrics }: ComparativeMetricsSectionProps): JSX.Element {
  if (!metrics) {
    return (
      <Card data-testid="comparative-section">
        <SectionHeader
          title="Comparison to Portfolio"
          icon={
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
        <LoadingSkeleton height={120} />
      </Card>
    );
  }

  const healthTrend = getTrendIndicator(metrics.healthScoreVsAverage);
  const mrrTrend = getTrendIndicator(metrics.mrrVsAverage);
  const channelTrend = getTrendIndicator(metrics.channelCountVsAverage);

  return (
    <Card data-testid="comparative-section">
      <SectionHeader
        title="Comparison to Portfolio"
        icon={
          <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        }
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-3 bg-gray-50 dark:bg-surface-700 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">Health Score</p>
          <p className={`text-lg font-semibold ${healthTrend.color}`}>
            {healthTrend.icon} {metrics.healthScoreVsAverage > 0 ? '+' : ''}
            {metrics.healthScoreVsAverage.toFixed(1)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{healthTrend.text}</p>
        </div>
        <div className="text-center p-3 bg-gray-50 dark:bg-surface-700 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">MRR</p>
          <p className={`text-lg font-semibold ${mrrTrend.color}`}>
            {mrrTrend.icon} {metrics.mrrVsAverage > 0 ? '+' : ''}
            ${Math.abs(metrics.mrrVsAverage).toFixed(0)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{mrrTrend.text}</p>
        </div>
        <div className="text-center p-3 bg-gray-50 dark:bg-surface-700 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">Channels</p>
          <p className={`text-lg font-semibold ${channelTrend.color}`}>
            {channelTrend.icon} {metrics.channelCountVsAverage > 0 ? '+' : ''}
            {metrics.channelCountVsAverage.toFixed(1)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{channelTrend.text}</p>
        </div>
        <div className="text-center p-3 bg-gray-50 dark:bg-surface-700 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">Percentile</p>
          <p className="text-lg font-semibold text-blue-600 dark:text-blue-400" data-testid="percentile-rank">
            Top {100 - metrics.percentileRank}%
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">of customers</p>
        </div>
      </div>
    </Card>
  );
}

/**
 * Timeline section
 */
interface TimelineSectionProps {
  timeline: CustomerTimelineDTO | null;
  lastCsContactDate: string | null;
}

function TimelineSection({ timeline, lastCsContactDate }: TimelineSectionProps): JSX.Element {
  if (!timeline) {
    return (
      <Card data-testid="timeline-section">
        <SectionHeader
          title="Timeline"
          icon={
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <LoadingSkeleton height={100} />
      </Card>
    );
  }

  const categoryBadge: Record<string, { variant: 'success' | 'info' | 'default'; label: string }> = {
    new: { variant: 'success', label: 'New Customer' },
    established: { variant: 'info', label: 'Established' },
    veteran: { variant: 'default', label: 'Veteran' },
  };

  const badge = categoryBadge[timeline.accountAgeCategory];

  // Calculate days since last CS contact
  const daysSinceLastCsContact = lastCsContactDate
    ? Math.floor((Date.now() - new Date(lastCsContactDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <Card data-testid="timeline-section">
      <SectionHeader
        title="Timeline"
        icon={
          <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant={badge.variant}>{badge.label}</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-gray-50 dark:bg-surface-700 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Account Created</p>
            <p className="font-medium text-gray-900 dark:text-white" data-testid="created-date">
              {formatDate(timeline.createdDate)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {timeline.daysSinceCreation} days ago
            </p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-surface-700 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Last Login</p>
            <p className="font-medium text-gray-900 dark:text-white" data-testid="last-login">
              {timeline.lastLoginDate ? formatDate(timeline.lastLoginDate) : 'Never logged in'}
            </p>
            {timeline.daysSinceLastLogin !== null && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatRelativeTime(timeline.daysSinceLastLogin)}
              </p>
            )}
          </div>
          <div className="p-3 bg-gray-50 dark:bg-surface-700 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Last CS Contact</p>
            <p className="font-medium text-gray-900 dark:text-white" data-testid="last-cs-contact">
              {lastCsContactDate ? formatDate(lastCsContactDate) : 'No contact recorded'}
            </p>
            {daysSinceLastCsContact !== null && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatRelativeTime(daysSinceLastCsContact)}
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

/**
 * Loading state for customer detail
 */
function CustomerDetailLoading(): JSX.Element {
  return (
    <div className="space-y-6" data-testid="customer-detail-loading">
      <LoadingSkeleton width={150} height={20} />
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <LoadingSkeleton width={300} height={32} className="mb-2" />
          <LoadingSkeleton width={200} height={24} />
        </div>
        <LoadingSkeleton width={240} height={150} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <LoadingSkeleton height={200} />
        </Card>
        <Card>
          <LoadingSkeleton height={200} />
        </Card>
      </div>
    </div>
  );
}

/**
 * Empty/not found state
 */
interface CustomerNotFoundProps {
  customerId: string | undefined;
}

function CustomerNotFound({ customerId }: CustomerNotFoundProps): JSX.Element {
  return (
    <div className="space-y-6" data-testid="customer-not-found">
      <BackNavigation />
      <Card className="py-16">
        <EmptyState
          title="Customer not found"
          description={`No customer found with ID: ${customerId || 'unknown'}`}
          action={
            <Link to="/customers">
              <Button variant="primary">View All Customers</Button>
            </Link>
          }
        />
      </Card>
    </div>
  );
}

/**
 * Main customer detail content
 */
interface CustomerDetailContentProps {
  customer: CustomerDTO;
  healthBreakdown: HealthScoreBreakdownDTO | null;
  comparativeMetrics: ComparativeMetricsDTO | null;
  timeline: CustomerTimelineDTO | null;
}

function CustomerDetailContent({
  customer,
  healthBreakdown,
  comparativeMetrics,
  timeline,
}: CustomerDetailContentProps): JSX.Element {
  return (
    <div className="space-y-6" data-testid="customer-detail-content">
      <BackNavigation />
      <CustomerHeader customer={customer} />

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CustomerInfoSection customer={customer} />
        <FinancialSection customer={customer} />
        <ChannelsSection customer={customer} />
        <TimelineSection timeline={timeline} lastCsContactDate={customer.lastCsContactDate} />
      </div>

      {/* Health breakdown - full width */}
      <HealthBreakdownSection breakdown={healthBreakdown} />

      {/* Comparative metrics - full width */}
      <ComparativeMetricsSection metrics={comparativeMetrics} />
    </div>
  );
}

/**
 * Customer detail page - shows full customer information.
 *
 * Features:
 * - Customer header with health score gauge
 * - Contact and business information
 * - Health score breakdown with factor analysis
 * - Comparative metrics vs portfolio average
 * - Account timeline
 */
export function CustomerDetail(): JSX.Element {
  const { customerId } = useParams<{ customerId: string }>();
  const [customerDetails, setCustomerDetails] = useState<GetCustomerDetailsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get use cases from context
  const useCases = useUseCases();

  // Fetch customer details using the use case
  const fetchCustomerDetails = useCallback(async () => {
    if (!customerId) {
      setError('No customer ID provided');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await useCases.getCustomerDetails.execute({ customerId });

      if (result.success) {
        setCustomerDetails(result.value);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customer details');
    } finally {
      setIsLoading(false);
    }
  }, [customerId, useCases]);

  // Fetch customer details on mount and when customerId changes
  useEffect(() => {
    fetchCustomerDetails();
  }, [fetchCustomerDetails]);

  if (isLoading) {
    return (
      <PageErrorBoundary pageName="Customer Detail">
        <CustomerDetailLoading />
      </PageErrorBoundary>
    );
  }

  // Check if we have customer data or if there was an error
  if (error || !customerDetails) {
    return (
      <PageErrorBoundary pageName="Customer Detail">
        <CustomerNotFound customerId={customerId} />
      </PageErrorBoundary>
    );
  }

  return (
    <PageErrorBoundary pageName="Customer Detail">
      <CustomerDetailContent
        customer={customerDetails.customer}
        healthBreakdown={customerDetails.healthScore}
        comparativeMetrics={customerDetails.comparativeMetrics}
        timeline={customerDetails.timeline}
      />
    </PageErrorBoundary>
  );
}
