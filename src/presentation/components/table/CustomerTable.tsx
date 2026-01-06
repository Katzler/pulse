import type { JSX } from 'react';

import type { CustomerSummaryDTO } from '@application/dtos';

/**
 * Sort order type
 */
export type SortOrder = 'asc' | 'desc';

/**
 * Sortable column keys
 */
export type CustomerSortKey =
  | 'healthScore'
  | 'id'
  | 'accountOwner'
  | 'status'
  | 'accountType'
  | 'mrr'
  | 'channelCount';

/**
 * Props for CustomerTable component
 */
export interface CustomerTableProps {
  /** List of customers to display */
  customers: CustomerSummaryDTO[];
  /** Whether data is loading */
  isLoading?: boolean;
  /** Current sort column */
  sortKey?: CustomerSortKey;
  /** Current sort order */
  sortOrder?: SortOrder;
  /** Called when column header is clicked for sorting */
  onSort?: (key: CustomerSortKey) => void;
  /** Called when row is clicked */
  onRowClick?: (customerId: string) => void;
  /** Current page number (1-indexed) */
  currentPage?: number;
  /** Total number of pages */
  totalPages?: number;
  /** Called when page changes */
  onPageChange?: (page: number) => void;
  /** Called when clear search is clicked in empty state */
  onClearSearch?: () => void;
}

/**
 * Get health score indicator color and icon based on score
 */
function getHealthIndicator(score: number): { color: string; bgColor: string; label: string } {
  if (score >= 70) {
    return { color: 'text-green-600', bgColor: 'bg-green-100', label: 'Healthy' };
  }
  if (score >= 30) {
    return { color: 'text-orange-500', bgColor: 'bg-orange-100', label: 'At Risk' };
  }
  return { color: 'text-red-600', bgColor: 'bg-red-100', label: 'Critical' };
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
 * Sort indicator arrow component
 */
function SortArrow({ direction }: { direction?: SortOrder | undefined }): JSX.Element | null {
  if (!direction) return null;

  return (
    <span className="ml-1 inline-block" aria-hidden="true">
      {direction === 'asc' ? '↑' : '↓'}
    </span>
  );
}

/**
 * Sortable column header
 */
function SortableHeader({
  children,
  sortKey,
  currentSortKey,
  sortOrder,
  onSort,
  className = '',
}: {
  children: React.ReactNode;
  sortKey: CustomerSortKey;
  currentSortKey?: CustomerSortKey | undefined;
  sortOrder?: SortOrder | undefined;
  onSort?: ((key: CustomerSortKey) => void) | undefined;
  className?: string;
}): JSX.Element {
  const isActive = currentSortKey === sortKey;

  return (
    <th
      className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${className}`}
    >
      <button
        type="button"
        onClick={() => onSort?.(sortKey)}
        className={`
          inline-flex items-center gap-1 hover:text-gray-700 focus:outline-none focus:text-gray-700
          ${isActive ? 'text-gray-900 font-semibold' : ''}
        `}
        aria-label={`Sort by ${children}, ${isActive ? (sortOrder === 'asc' ? 'descending' : 'ascending') : 'ascending'}`}
      >
        {children}
        <SortArrow direction={isActive ? sortOrder : undefined} />
      </button>
    </th>
  );
}

/**
 * Health score cell with visual indicator
 */
function HealthScoreCell({ score }: { score: number }): JSX.Element {
  const { color, bgColor, label } = getHealthIndicator(score);

  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${color} ${bgColor}`}
        aria-label={`Health score ${score}, ${label}`}
      >
        {score}
      </span>
    </div>
  );
}

/**
 * Status badge component
 */
function StatusBadge({ status }: { status: string }): JSX.Element {
  const isActive = status.toLowerCase().includes('active') && !status.toLowerCase().includes('inactive');

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
        isActive
          ? 'bg-green-100 text-green-800'
          : 'bg-gray-100 text-gray-800'
      }`}
    >
      {status.replace(' Customer', '')}
    </span>
  );
}

/**
 * Skeleton row for loading state
 */
function SkeletonRow(): JSX.Element {
  return (
    <tr className="animate-pulse">
      <td className="px-4 py-4">
        <div className="w-8 h-8 bg-gray-200 rounded-full" />
      </td>
      <td className="px-4 py-4">
        <div className="w-16 h-4 bg-gray-200 rounded" />
      </td>
      <td className="px-4 py-4">
        <div className="w-24 h-4 bg-gray-200 rounded" />
      </td>
      <td className="px-4 py-4">
        <div className="w-16 h-4 bg-gray-200 rounded" />
      </td>
      <td className="px-4 py-4">
        <div className="w-16 h-4 bg-gray-200 rounded" />
      </td>
      <td className="px-4 py-4">
        <div className="w-16 h-4 bg-gray-200 rounded" />
      </td>
      <td className="px-4 py-4">
        <div className="w-8 h-4 bg-gray-200 rounded" />
      </td>
      <td className="px-4 py-4">
        <div className="w-12 h-6 bg-gray-200 rounded" />
      </td>
    </tr>
  );
}

/**
 * Empty state when no customers found
 */
function EmptyState({ onClearSearch }: { onClearSearch?: (() => void) | undefined }): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4" data-testid="empty-state">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <p className="text-lg font-medium text-gray-900 mb-1">No customers found</p>
      <p className="text-sm text-gray-500 mb-4">Try adjusting your search or filters</p>
      {onClearSearch && (
        <button
          type="button"
          onClick={onClearSearch}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
        >
          Clear Search
        </button>
      )}
    </div>
  );
}

/**
 * Pagination controls
 */
function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}): JSX.Element {
  return (
    <div
      className="flex items-center justify-between px-4 py-3 border-t border-gray-200"
      role="navigation"
      aria-label="Pagination"
    >
      <p className="text-sm text-gray-500">
        Page <span className="font-medium">{currentPage}</span> of{' '}
        <span className="font-medium">{totalPages}</span>
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className={`
            px-3 py-1.5 text-sm font-medium rounded-lg border
            ${
              currentPage <= 1
                ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500'
            }
          `}
          aria-label="Previous page"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={`
            px-3 py-1.5 text-sm font-medium rounded-lg border
            ${
              currentPage >= totalPages
                ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500'
            }
          `}
          aria-label="Next page"
        >
          Next
        </button>
      </div>
    </div>
  );
}

/**
 * Mobile card view for a customer
 */
function CustomerCard({
  customer,
  onClick,
}: {
  customer: CustomerSummaryDTO;
  onClick?: ((id: string) => void) | undefined;
}): JSX.Element {
  const { color, bgColor } = getHealthIndicator(customer.healthScore);

  const content = (
    <div className="p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold ${color} ${bgColor}`}
            aria-label={`Health score ${customer.healthScore}`}
          >
            {customer.healthScore}
          </span>
          <div>
            <p className="text-sm font-medium text-gray-900">{customer.accountOwner}</p>
            <p className="text-xs text-gray-500">ID: {customer.id}</p>
          </div>
        </div>
        <span className="text-sm font-medium text-gray-900">{formatMrr(customer.mrr)}</span>
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <StatusBadge status={customer.status} />
        <span>•</span>
        <span>{customer.accountType}</span>
        <span>•</span>
        <span>{customer.channelCount} channels</span>
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={() => onClick(customer.id)}
        className="w-full text-left border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
        aria-label={`View ${customer.accountOwner}, ID ${customer.id}, health score ${customer.healthScore}`}
      >
        {content}
      </button>
    );
  }

  return <div className="border-b border-gray-200 last:border-b-0">{content}</div>;
}

/**
 * CustomerTable displays customer search results in a sortable table.
 * Supports sorting, pagination, and responsive mobile card layout.
 *
 * @example
 * <CustomerTable
 *   customers={customers}
 *   sortKey="healthScore"
 *   sortOrder="asc"
 *   onSort={handleSort}
 *   onRowClick={(id) => navigate(`/customers/${id}`)}
 *   currentPage={1}
 *   totalPages={10}
 *   onPageChange={setPage}
 * />
 */
export function CustomerTable({
  customers,
  isLoading = false,
  sortKey,
  sortOrder,
  onSort,
  onRowClick,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  onClearSearch,
}: CustomerTableProps): JSX.Element {
  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden" data-testid="customer-table">
        {/* Desktop skeleton */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Health</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">MRR</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Channels</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile skeleton */}
        <div className="md:hidden divide-y divide-gray-200">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 animate-pulse">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="w-32 h-4 bg-gray-200 rounded" />
                  <div className="w-20 h-3 bg-gray-200 rounded" />
                  <div className="w-48 h-3 bg-gray-200 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="sr-only" role="status" aria-live="polite">
          Loading customers...
        </div>
      </div>
    );
  }

  // Empty state
  if (customers.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200" data-testid="customer-table">
        <EmptyState onClearSearch={onClearSearch} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden" data-testid="customer-table">
      {/* Desktop table view */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <SortableHeader
                sortKey="healthScore"
                currentSortKey={sortKey}
                sortOrder={sortOrder}
                onSort={onSort}
              >
                Health
              </SortableHeader>
              <SortableHeader
                sortKey="id"
                currentSortKey={sortKey}
                sortOrder={sortOrder}
                onSort={onSort}
              >
                ID
              </SortableHeader>
              <SortableHeader
                sortKey="accountOwner"
                currentSortKey={sortKey}
                sortOrder={sortOrder}
                onSort={onSort}
              >
                Owner
              </SortableHeader>
              <SortableHeader
                sortKey="status"
                currentSortKey={sortKey}
                sortOrder={sortOrder}
                onSort={onSort}
              >
                Status
              </SortableHeader>
              <SortableHeader
                sortKey="accountType"
                currentSortKey={sortKey}
                sortOrder={sortOrder}
                onSort={onSort}
              >
                Type
              </SortableHeader>
              <SortableHeader
                sortKey="mrr"
                currentSortKey={sortKey}
                sortOrder={sortOrder}
                onSort={onSort}
              >
                MRR
              </SortableHeader>
              <SortableHeader
                sortKey="channelCount"
                currentSortKey={sortKey}
                sortOrder={sortOrder}
                onSort={onSort}
              >
                Channels
              </SortableHeader>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {customers.map((customer) => (
              <tr
                key={customer.id}
                className={onRowClick ? 'hover:bg-gray-50 cursor-pointer' : ''}
                onClick={() => onRowClick?.(customer.id)}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={(e) => {
                  if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onRowClick(customer.id);
                  }
                }}
                role={onRowClick ? 'button' : undefined}
                aria-label={onRowClick ? `View ${customer.accountOwner}` : undefined}
              >
                <td className="px-4 py-4 whitespace-nowrap">
                  <HealthScoreCell score={customer.healthScore} />
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {customer.id}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {customer.accountOwner}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <StatusBadge status={customer.status} />
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {customer.accountType}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {formatMrr(customer.mrr)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {customer.channelCount}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  {onRowClick ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRowClick(customer.id);
                      }}
                      className="text-blue-600 hover:text-blue-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                    >
                      View
                    </button>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card view */}
      <div className="md:hidden">
        {customers.map((customer) => (
          <CustomerCard key={customer.id} customer={customer} onClick={onRowClick} />
        ))}
      </div>

      {/* Pagination */}
      {onPageChange && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}

      {/* Accessible summary */}
      <div className="sr-only" role="status" aria-live="polite">
        Showing {customers.length} customers
        {totalPages > 1 && `, page ${currentPage} of ${totalPages}`}
      </div>
    </div>
  );
}
