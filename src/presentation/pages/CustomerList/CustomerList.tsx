import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import type { SearchCustomersInput } from '@application/use-cases';
import { Badge, Button } from '@presentation/components/common';
import { SearchInput } from '@presentation/components/search';
import { type CustomerSortKey, CustomerTable, type SortOrder } from '@presentation/components/table';
import { useUseCases } from '@presentation/context';
import { useCustomerStore } from '@presentation/stores';

/**
 * URL filter parameters
 */
interface UrlFilters {
  health: 'healthy' | 'atRisk' | 'critical' | null;
  country: string | null;
  channel: string | null;
}

/**
 * Number of customers per page
 */
const PAGE_SIZE = 20;

/**
 * Map URL health parameter to filter criteria health classification
 */
const HEALTH_URL_TO_FILTER: Record<string, 'healthy' | 'at-risk' | 'critical'> = {
  healthy: 'healthy',
  atRisk: 'at-risk',
  critical: 'critical',
};

/**
 * Get display label for health filter
 */
function getHealthFilterLabel(health: string): string {
  switch (health) {
    case 'healthy':
      return 'Healthy';
    case 'atRisk':
      return 'At Risk';
    case 'critical':
      return 'Critical';
    default:
      return health;
  }
}

/**
 * Empty state when no customers have been imported
 */
function NoDataState() {
  const navigate = useNavigate();

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
      <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
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
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
          />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-gray-900 mb-2">No customer data</h2>
      <p className="text-gray-500 mb-6">Import a CSV file to get started with customer data.</p>
      <Button variant="primary" onClick={() => navigate('/import')}>
        Import Customers
      </Button>
    </div>
  );
}

/**
 * Customer list page - search and browse customers.
 * Displays imported customers with search, sort, and pagination.
 */
export function CustomerList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const customers = useCustomerStore((state) => state.customers);
  const { searchCustomers } = useUseCases();

  // Parse URL filters
  const urlFilters: UrlFilters = useMemo(() => {
    const health = searchParams.get('health') as UrlFilters['health'];
    const country = searchParams.get('country');
    const channel = searchParams.get('channel');
    return {
      health: health && ['healthy', 'atRisk', 'critical'].includes(health) ? health : null,
      country,
      channel,
    };
  }, [searchParams]);

  // Check if any filters are active
  const hasActiveFilters = urlFilters.health || urlFilters.country || urlFilters.channel;

  // Local state for search, sort, and pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<CustomerSortKey>('healthScore');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 when URL filters change (e.g., navigating from Dashboard)
  useEffect(() => {
    setCurrentPage(1);
  }, [urlFilters.health, urlFilters.country, urlFilters.channel]);

  // Map table sort key to use case sort field
  const mapSortKey = (key: CustomerSortKey): 'healthScore' | 'mrr' | 'name' | 'lastLogin' => {
    switch (key) {
      case 'healthScore':
        return 'healthScore';
      case 'mrr':
        return 'mrr';
      case 'accountOwner':
        return 'name';
      default:
        return 'healthScore';
    }
  };

  // Query customers using the SearchCustomersUseCase (with full domain filtering including channels)
  const queryResult = useMemo(() => {
    // Build input object, only including defined properties
    const input: SearchCustomersInput = {
      sortBy: mapSortKey(sortKey),
      sortOrder: sortOrder,
      page: currentPage,
      pageSize: PAGE_SIZE,
    };

    // Add optional filters only if they have values
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery) {
      input.query = trimmedQuery;
    }
    if (urlFilters.health) {
      input.healthStatus = HEALTH_URL_TO_FILTER[urlFilters.health];
    }
    if (urlFilters.country) {
      input.country = urlFilters.country;
    }
    if (urlFilters.channel) {
      input.channels = [urlFilters.channel];
    }

    const result = searchCustomers.execute(input);
    if (result.success) {
      return result.value;
    }
    // Return empty result on error
    return {
      customers: [],
      totalCount: 0,
      page: 1,
      pageSize: PAGE_SIZE,
      totalPages: 0,
      appliedFilters: [],
    };
  }, [searchQuery, urlFilters, sortKey, sortOrder, currentPage, searchCustomers]);

  // Extract results from query
  const { customers: paginatedCustomers, totalCount: filteredCount, totalPages } = queryResult;

  // Reset to page 1 when search changes
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  }, []);

  const handleSearch = useCallback(() => {
    // Search happens automatically via filtering
    setCurrentPage(1);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setCurrentPage(1);
  }, []);

  // Clear a specific URL filter
  const clearFilter = useCallback(
    (filterKey: 'health' | 'country' | 'channel') => {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete(filterKey);
      setSearchParams(newParams);
      setCurrentPage(1);
    },
    [searchParams, setSearchParams]
  );

  // Clear all URL filters
  const clearAllFilters = useCallback(() => {
    setSearchParams(new URLSearchParams());
    setCurrentPage(1);
  }, [setSearchParams]);

  const handleSort = useCallback((key: CustomerSortKey) => {
    setSortKey((prevKey) => {
      if (prevKey === key) {
        // Toggle sort order if same column
        setSortOrder((prevOrder) => (prevOrder === 'asc' ? 'desc' : 'asc'));
        return key;
      }
      // New column, default to ascending
      setSortOrder('asc');
      return key;
    });
    setCurrentPage(1);
  }, []);

  const handleRowClick = useCallback(
    (customerId: string) => {
      navigate(`/customers/${customerId}`);
    },
    [navigate]
  );

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Build filter description for subtitle
  const filterDescription = useMemo(() => {
    const parts: string[] = [];
    if (urlFilters.health) {
      parts.push(`${getHealthFilterLabel(urlFilters.health)} health`);
    }
    if (urlFilters.country) {
      parts.push(`in ${urlFilters.country}`);
    }
    if (urlFilters.channel) {
      parts.push(`using ${urlFilters.channel}`);
    }
    if (searchQuery) {
      parts.push(`matching "${searchQuery}"`);
    }
    return parts.length > 0 ? parts.join(', ') : null;
  }, [urlFilters, searchQuery]);

  // Show empty state if no customers imported
  if (customers.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600">Search and manage customer accounts</p>
        </div>
        <NoDataState />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600">
            {filteredCount} of {customers.length} customers
            {filterDescription && ` — ${filterDescription}`}
          </p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/import')}>
          Import More
        </Button>
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-600">Filters:</span>
          {urlFilters.health && (
            <Badge variant="info" className="flex items-center gap-1">
              Health: {getHealthFilterLabel(urlFilters.health)}
              <button
                onClick={() => clearFilter('health')}
                className="ml-1 hover:text-blue-800"
                aria-label="Remove health filter"
              >
                ×
              </button>
            </Badge>
          )}
          {urlFilters.country && (
            <Badge variant="info" className="flex items-center gap-1">
              Country: {urlFilters.country}
              <button
                onClick={() => clearFilter('country')}
                className="ml-1 hover:text-blue-800"
                aria-label="Remove country filter"
              >
                ×
              </button>
            </Badge>
          )}
          {urlFilters.channel && (
            <Badge variant="info" className="flex items-center gap-1">
              Channel: {urlFilters.channel}
              <button
                onClick={() => clearFilter('channel')}
                className="ml-1 hover:text-blue-800"
                aria-label="Remove channel filter"
              >
                ×
              </button>
            </Badge>
          )}
          <button
            onClick={clearAllFilters}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Search */}
      <div className="max-w-md">
        <SearchInput
          value={searchQuery}
          onChange={handleSearchChange}
          onSearch={handleSearch}
          onClear={handleClearSearch}
          placeholder="Search by ID, name, or country..."
        />
      </div>

      {/* Customer Table */}
      <CustomerTable
        customers={paginatedCustomers}
        sortKey={sortKey}
        sortOrder={sortOrder}
        onSort={handleSort}
        onRowClick={handleRowClick}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        {...(searchQuery ? { onClearSearch: handleClearSearch } : {})}
      />
    </div>
  );
}
