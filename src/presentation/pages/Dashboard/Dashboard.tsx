import { Link } from 'react-router-dom';

import {
  ChannelAdoptionChart,
  HealthDistributionChart,
  MrrByCountryChart,
  PortfolioHealthTrend,
} from '@presentation/components/charts';
import {
  AlertTriangleIcon,
  Button,
  Card,
  ChartErrorBoundary,
  CheckCircleIcon,
  DollarIcon,
  EmptyDataIcon,
  EmptyState,
  HeartPulseIcon,
  LoadingSkeleton,
  MetricCard,
  PageErrorBoundary,
  UsersIcon,
} from '@presentation/components/common';
import { AtRiskCustomersWidget } from '@presentation/components/widgets';
import { useCustomerStore } from '@presentation/stores';

/**
 * Get color theme based on health score
 */
function getHealthScoreColor(score: number): 'green' | 'orange' | 'red' {
  if (score >= 70) return 'green';
  if (score >= 30) return 'orange';
  return 'red';
}

/**
 * Format date for display in "Last updated" timestamp
 */
function formatLastUpdated(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Skeleton loader for metric cards
 */
function MetricCardSkeleton() {
  return (
    <Card className="p-4">
      <LoadingSkeleton width={100} height={16} className="mb-2" />
      <LoadingSkeleton width={80} height={32} className="mb-1" />
      <LoadingSkeleton width={60} height={14} />
    </Card>
  );
}

/**
 * Skeleton loader for chart sections
 */
function ChartSkeleton() {
  return (
    <Card className="p-4">
      <LoadingSkeleton width={150} height={20} className="mb-4" />
      <LoadingSkeleton height={200} variant="rectangular" />
    </Card>
  );
}

/**
 * Loading state for the dashboard
 */
function DashboardLoading() {
  return (
    <div className="space-y-6" data-testid="dashboard-loading">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <LoadingSkeleton width={200} height={28} className="mb-2" />
          <LoadingSkeleton width={300} height={16} />
        </div>
        <LoadingSkeleton width={150} height={16} />
      </div>

      {/* Metric cards skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton />
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    </div>
  );
}

/**
 * Empty state when no customer data is imported
 */
function DashboardEmptyState() {
  return (
    <div className="space-y-6" data-testid="dashboard-empty">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Customer success metrics overview</p>
      </div>

      {/* Empty state card */}
      <Card className="py-16">
        <EmptyState
          icon={<EmptyDataIcon />}
          title="No customer data available"
          description="Import a CSV file to see your customer success metrics and insights."
          action={
            <Link to="/import">
              <Button variant="primary">Import Customer Data</Button>
            </Link>
          }
        />
      </Card>
    </div>
  );
}

/**
 * Dashboard header with title and last updated timestamp
 */
function DashboardHeader({ lastUpdated }: { lastUpdated: Date | null }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Customer success metrics overview</p>
      </div>
      {lastUpdated && (
        <p className="text-sm text-gray-500" data-testid="last-updated">
          Last updated: {formatLastUpdated(lastUpdated)}
        </p>
      )}
    </div>
  );
}

/**
 * Main dashboard content with metrics and charts
 */
function DashboardContent() {
  const dashboardMetrics = useCustomerStore((state) => state.dashboardMetrics);
  const customers = useCustomerStore((state) => state.customers);
  const lastUpdated = useCustomerStore((state) => state.lastUpdated);

  // Show empty state if no metrics loaded
  if (!dashboardMetrics) {
    return <DashboardEmptyState />;
  }

  return (
    <div className="space-y-6" data-testid="dashboard-content">
      {/* Header with timestamp */}
      <DashboardHeader lastUpdated={lastUpdated} />

      {/* Summary Metrics Cards */}
      <section aria-labelledby="metrics-heading">
        <h2 id="metrics-heading" className="sr-only">
          Key Metrics
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          <MetricCard
            title="Total Customers"
            value={dashboardMetrics.totalCustomers}
            icon={<UsersIcon />}
            color="blue"
            data-testid="metric-total-customers"
          />
          <MetricCard
            title="Active Customers"
            value={dashboardMetrics.activeCustomers}
            icon={<CheckCircleIcon />}
            color="green"
            data-testid="metric-active-customers"
          />
          <MetricCard
            title="At-Risk Customers"
            value={dashboardMetrics.healthDistribution.atRisk}
            icon={<AlertTriangleIcon />}
            color="orange"
            data-testid="metric-at-risk"
          />
          <MetricCard
            title="Total MRR"
            value={`$${dashboardMetrics.totalMrr.toLocaleString()}`}
            icon={<DollarIcon />}
            color="purple"
            data-testid="metric-total-mrr"
          />
          <MetricCard
            title="Avg Health Score"
            value={Math.round(dashboardMetrics.averageHealthScore)}
            icon={<HeartPulseIcon />}
            color={getHealthScoreColor(dashboardMetrics.averageHealthScore)}
            data-testid="metric-avg-health"
          />
        </div>
      </section>

      {/* Portfolio Health Overview */}
      <section aria-labelledby="portfolio-health-heading">
        <Card data-testid="portfolio-health-section">
          <h2
            id="portfolio-health-heading"
            className="mb-4 text-lg font-semibold text-gray-900"
          >
            Portfolio Health Overview
          </h2>
          <PortfolioHealthTrend
            currentHealth={dashboardMetrics.healthDistribution}
            averageHealthScore={dashboardMetrics.averageHealthScore}
            totalCustomers={dashboardMetrics.totalCustomers}
          />
        </Card>
      </section>

      {/* Charts Grid */}
      <section aria-labelledby="charts-heading">
        <h2 id="charts-heading" className="sr-only">
          Analytics Charts
        </h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Health Distribution Chart */}
          <Card data-testid="health-distribution-section">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Health Score Distribution
            </h3>
            <ChartErrorBoundary>
              <HealthDistributionChart
                data={dashboardMetrics.healthDistribution}
                height={280}
              />
            </ChartErrorBoundary>
          </Card>

          {/* MRR by Country Chart */}
          <Card data-testid="mrr-by-country-section">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              MRR by Country
            </h3>
            <ChartErrorBoundary>
              <MrrByCountryChart
                data={dashboardMetrics.countryDistribution}
                height={280}
              />
            </ChartErrorBoundary>
          </Card>

          {/* Channel Adoption Chart */}
          <Card data-testid="channel-adoption-section">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Channel Adoption
            </h3>
            <ChartErrorBoundary>
              <ChannelAdoptionChart
                data={dashboardMetrics.channelDistribution}
                height={280}
              />
            </ChartErrorBoundary>
          </Card>

          {/* At-Risk Customers Widget */}
          <Card data-testid="at-risk-customers-section">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              At-Risk Customers
            </h3>
            <AtRiskCustomersWidget customers={customers} maxDisplay={5} />
          </Card>
        </div>
      </section>
    </div>
  );
}

/**
 * Dashboard page - main overview with metrics and charts.
 * Displays customer success metrics, health distribution, and key insights.
 *
 * Layout:
 * - Desktop: 4-5 column grid for metrics, 2-column grid for charts
 * - Tablet: 2 columns for metrics and charts
 * - Mobile: Single column layout
 */
export function Dashboard() {
  // Loading state will be connected in later tasks
  const isLoading = false;

  if (isLoading) {
    return <DashboardLoading />;
  }

  return (
    <PageErrorBoundary pageName="Dashboard">
      <DashboardContent />
    </PageErrorBoundary>
  );
}
