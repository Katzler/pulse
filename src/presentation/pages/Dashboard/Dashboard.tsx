import { useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import type { CustomerSummaryDTO, DashboardMetricsDTO, DistributionItem } from '@application/dtos';
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
  HealthScoreFormulaTooltip,
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
 * Compute dashboard metrics from customer summaries.
 * Used as a fallback when dashboardMetrics is not set in the store.
 */
function computeMetricsFromCustomers(customers: CustomerSummaryDTO[]): DashboardMetricsDTO {
  let activeCount = 0;
  let totalMrr = 0;
  let totalHealthScore = 0;
  const healthDistribution = { healthy: 0, atRisk: 0, critical: 0 };
  const countryMap = new Map<string, { count: number; mrr: number }>();

  for (const customer of customers) {
    // Count active customers
    if (customer.status === 'Active Customer') {
      activeCount++;
    }

    // Sum MRR and health scores
    totalMrr += customer.mrr;
    totalHealthScore += customer.healthScore;

    // Health distribution
    if (customer.healthClassification === 'healthy') {
      healthDistribution.healthy++;
    } else if (customer.healthClassification === 'at-risk') {
      healthDistribution.atRisk++;
    } else {
      healthDistribution.critical++;
    }

    // Country distribution
    const countryData = countryMap.get(customer.billingCountry) || { count: 0, mrr: 0 };
    countryData.count++;
    countryData.mrr += customer.mrr;
    countryMap.set(customer.billingCountry, countryData);
  }

  // Build country distribution array
  const countryDistribution: DistributionItem[] = Array.from(countryMap.entries())
    .map(([name, data]) => ({ name, count: data.count, mrr: data.mrr }))
    .sort((a, b) => (b.mrr || 0) - (a.mrr || 0));

  return {
    totalCustomers: customers.length,
    activeCustomers: activeCount,
    inactiveCustomers: customers.length - activeCount,
    averageHealthScore: customers.length > 0 ? totalHealthScore / customers.length : 0,
    totalMrr,
    healthDistribution,
    countryDistribution,
    // These are empty when computed from summaries (summaries don't have channel/property data)
    channelDistribution: [],
    propertyTypeDistribution: [],
  };
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
  const navigate = useNavigate();
  const storedMetrics = useCustomerStore((state) => state.dashboardMetrics);
  const customers = useCustomerStore((state) => state.customers);
  const lastUpdated = useCustomerStore((state) => state.lastUpdated);

  // Compute metrics from customers as fallback if dashboardMetrics is not set
  const dashboardMetrics = useMemo(() => {
    if (storedMetrics) {
      return storedMetrics;
    }
    // Fallback: compute from customers array if available
    if (customers.length > 0) {
      return computeMetricsFromCustomers(customers);
    }
    return null;
  }, [storedMetrics, customers]);

  // Navigation handlers for chart clicks
  const handleHealthSegmentClick = useCallback(
    (category: 'healthy' | 'atRisk' | 'critical') => {
      navigate(`/customers?health=${category}`);
    },
    [navigate]
  );

  const handleCountryClick = useCallback(
    (country: string) => {
      navigate(`/customers?country=${encodeURIComponent(country)}`);
    },
    [navigate]
  );

  const handleChannelClick = useCallback(
    (channel: string) => {
      navigate(`/customers?channel=${encodeURIComponent(channel)}`);
    },
    [navigate]
  );

  const handleCustomerClick = useCallback(
    (customerId: string) => {
      navigate(`/customers/${customerId}`);
    },
    [navigate]
  );

  const handleViewAtRisk = useCallback(() => {
    navigate('/customers?health=atRisk');
  }, [navigate]);

  // Show empty state if no data available
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
            className="mb-4 text-lg font-semibold text-gray-900 flex items-center gap-2"
          >
            Portfolio Health Overview
            <HealthScoreFormulaTooltip variant="full" position="right" />
          </h2>
          <PortfolioHealthTrend
            currentHealth={dashboardMetrics.healthDistribution}
            averageHealthScore={dashboardMetrics.averageHealthScore}
            totalCustomers={dashboardMetrics.totalCustomers}
            onViewAtRisk={handleViewAtRisk}
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
            <h3 className="mb-4 text-lg font-semibold text-gray-900 flex items-center gap-2">
              Health Score Distribution
              <HealthScoreFormulaTooltip variant="classifications" position="right" />
            </h3>
            <ChartErrorBoundary>
              <HealthDistributionChart
                data={dashboardMetrics.healthDistribution}
                height={280}
                onSegmentClick={handleHealthSegmentClick}
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
                onCountryClick={handleCountryClick}
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
                onChannelClick={handleChannelClick}
              />
            </ChartErrorBoundary>
          </Card>

          {/* At-Risk Customers Widget */}
          <Card data-testid="at-risk-customers-section">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              At-Risk Customers
            </h3>
            <AtRiskCustomersWidget
              customers={customers}
              maxDisplay={5}
              onCustomerClick={handleCustomerClick}
            />
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
