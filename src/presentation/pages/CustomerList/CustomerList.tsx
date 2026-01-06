import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { CustomerSummaryDTO } from '@application/dtos';
import { Button } from '@presentation/components/common';
import { SearchInput } from '@presentation/components/search';
import { type CustomerSortKey, CustomerTable, type SortOrder } from '@presentation/components/table';
import { useCustomerStore } from '@presentation/stores';

/**
 * Number of customers per page
 */
const PAGE_SIZE = 20;

/**
 * Sort customers by the given key and order
 */
function sortCustomers(
  customers: CustomerSummaryDTO[],
  sortKey: CustomerSortKey,
  sortOrder: SortOrder
): CustomerSummaryDTO[] {
  return [...customers].sort((a, b) => {
    let comparison = 0;

    switch (sortKey) {
      case 'healthScore':
        comparison = a.healthScore - b.healthScore;
        break;
      case 'id':
        comparison = a.id.localeCompare(b.id);
        break;
      case 'accountOwner':
        comparison = a.accountOwner.localeCompare(b.accountOwner);
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      case 'accountType':
        comparison = a.accountType.localeCompare(b.accountType);
        break;
      case 'mrr':
        comparison = a.mrr - b.mrr;
        break;
      case 'channelCount':
        comparison = a.channelCount - b.channelCount;
        break;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });
}

/**
 * Filter customers by search query
 */
function filterCustomers(customers: CustomerSummaryDTO[], searchQuery: string): CustomerSummaryDTO[] {
  if (!searchQuery.trim()) {
    return customers;
  }

  const query = searchQuery.toLowerCase();
  return customers.filter(
    (customer) =>
      customer.id.toLowerCase().includes(query) ||
      customer.accountOwner.toLowerCase().includes(query) ||
      customer.billingCountry.toLowerCase().includes(query)
  );
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
  const customers = useCustomerStore((state) => state.customers);

  // Local state for search, sort, and pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<CustomerSortKey>('healthScore');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter customers by search query
  const filteredCustomers = useMemo(
    () => filterCustomers(customers, searchQuery),
    [customers, searchQuery]
  );

  // Sort filtered customers
  const sortedCustomers = useMemo(
    () => sortCustomers(filteredCustomers, sortKey, sortOrder),
    [filteredCustomers, sortKey, sortOrder]
  );

  // Paginate sorted customers
  const totalPages = Math.ceil(sortedCustomers.length / PAGE_SIZE);
  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return sortedCustomers.slice(startIndex, startIndex + PAGE_SIZE);
  }, [sortedCustomers, currentPage]);

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
            {filteredCustomers.length} of {customers.length} customers
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/import')}>
          Import More
        </Button>
      </div>

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
