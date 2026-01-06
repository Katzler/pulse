import type { JSX } from 'react';
import { useState } from 'react';

/**
 * Filter state for customer filtering
 */
export interface FilterState {
  status?: 'active' | 'inactive' | undefined;
  accountType?: 'pro' | 'starter' | undefined;
  healthClassification?: 'healthy' | 'at-risk' | 'critical' | undefined;
  country?: string | undefined;
  languages?: string[] | undefined;
  channels?: string[] | undefined;
}

/**
 * Available filter options derived from data
 */
export interface FilterOptions {
  countries: string[];
  languages: string[];
  channels: string[];
}

/**
 * Props for FilterPanel component
 */
export interface FilterPanelProps {
  /** Current filter state */
  filters: FilterState;
  /** Called when filters change */
  onChange: (filters: FilterState) => void;
  /** Available options for dropdown filters */
  availableOptions: FilterOptions;
  /** Whether panel is collapsed */
  isCollapsed?: boolean;
  /** Called when collapse toggle is clicked */
  onToggleCollapse?: (() => void) | undefined;
}

/**
 * Chevron icon for collapse/expand
 */
function ChevronIcon({ direction }: { direction: 'up' | 'down' }): JSX.Element {
  return (
    <svg
      className={`h-5 w-5 transition-transform ${direction === 'up' ? 'rotate-180' : ''}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

/**
 * Radio button group for mutually exclusive options
 */
function RadioGroup({
  name,
  label,
  options,
  value,
  onChange,
}: {
  name: string;
  label: string;
  options: Array<{ value: string; label: string }>;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
}): JSX.Element {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-gray-700">{label}</legend>
      <div className="space-y-1">
        {options.map((option) => (
          <label key={option.value} className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value || (option.value === '' && value === undefined)}
              onChange={(e) => onChange(e.target.value === '' ? undefined : e.target.value)}
              className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * Single select dropdown
 */
function SelectDropdown({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select...',
}: {
  label: string;
  options: string[];
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
}): JSX.Element {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value === '' ? undefined : e.target.value)}
        className="block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Multi-select dropdown with checkboxes
 */
function MultiSelectDropdown({
  label,
  options,
  selected,
  onChange,
  placeholder = 'Select...',
}: {
  label: string;
  options: string[];
  selected: string[] | undefined;
  onChange: (values: string[] | undefined) => void;
  placeholder?: string;
}): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const selectedValues = selected || [];

  const handleToggle = (value: string) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];
    onChange(newValues.length > 0 ? newValues : undefined);
  };

  const displayText =
    selectedValues.length > 0
      ? `${selectedValues.length} selected`
      : placeholder;

  return (
    <div className="space-y-2 relative">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full rounded-lg border border-gray-300 py-2 px-3 text-sm text-left focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className={selectedValues.length > 0 ? 'text-gray-900' : 'text-gray-500'}>
          {displayText}
        </span>
        <ChevronIcon direction={isOpen ? 'up' : 'down'} />
      </button>

      {isOpen && (
        <div
          className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto"
          role="listbox"
        >
          {options.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">No options available</div>
          ) : (
            <>
              {selectedValues.length > 0 && (
                <button
                  type="button"
                  onClick={() => onChange(undefined)}
                  className="w-full px-3 py-2 text-sm text-left text-blue-600 hover:bg-gray-50 border-b border-gray-100"
                >
                  Clear selection
                </button>
              )}
              {options.map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(option)}
                    onChange={() => handleToggle(option)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{option}</span>
                </label>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * FilterPanel allows users to narrow down customer results.
 * Supports radio buttons for exclusive options and dropdowns for large lists.
 *
 * @example
 * <FilterPanel
 *   filters={filters}
 *   onChange={setFilters}
 *   availableOptions={{ countries: ['USA', 'UK'], languages: ['English'], channels: ['Website'] }}
 * />
 */
export function FilterPanel({
  filters,
  onChange,
  availableOptions,
  isCollapsed = false,
  onToggleCollapse,
}: FilterPanelProps): JSX.Element {
  const hasActiveFilters =
    filters.status !== undefined ||
    filters.accountType !== undefined ||
    filters.healthClassification !== undefined ||
    filters.country !== undefined ||
    (filters.languages && filters.languages.length > 0) ||
    (filters.channels && filters.channels.length > 0);

  const activeFilterCount = [
    filters.status,
    filters.accountType,
    filters.healthClassification,
    filters.country,
    filters.languages && filters.languages.length > 0 ? 'languages' : undefined,
    filters.channels && filters.channels.length > 0 ? 'channels' : undefined,
  ].filter(Boolean).length;

  const handleClearAll = () => {
    onChange({});
  };

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div
      className="bg-white rounded-lg border border-gray-200"
      data-testid="filter-panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-900">Filters</h3>
          {hasActiveFilters && (
            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="text-sm text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded flex items-center gap-1"
            aria-expanded={!isCollapsed}
          >
            {isCollapsed ? 'Expand' : 'Collapse'}
            <ChevronIcon direction={isCollapsed ? 'down' : 'up'} />
          </button>
        )}
      </div>

      {/* Filter content */}
      {!isCollapsed && (
        <div className="p-4 space-y-6">
          {/* Radio button filters - horizontal on desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <RadioGroup
              name="status"
              label="Status"
              options={[
                { value: '', label: 'All' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
              value={filters.status}
              onChange={(v) => updateFilter('status', v as FilterState['status'])}
            />

            <RadioGroup
              name="accountType"
              label="Account Type"
              options={[
                { value: '', label: 'All' },
                { value: 'pro', label: 'Pro' },
                { value: 'starter', label: 'Starter' },
              ]}
              value={filters.accountType}
              onChange={(v) => updateFilter('accountType', v as FilterState['accountType'])}
            />

            <RadioGroup
              name="healthClassification"
              label="Health"
              options={[
                { value: '', label: 'All' },
                { value: 'healthy', label: 'Healthy' },
                { value: 'at-risk', label: 'At Risk' },
                { value: 'critical', label: 'Critical' },
              ]}
              value={filters.healthClassification}
              onChange={(v) => updateFilter('healthClassification', v as FilterState['healthClassification'])}
            />
          </div>

          {/* Dropdown filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <SelectDropdown
              label="Country"
              options={availableOptions.countries}
              value={filters.country}
              onChange={(v) => updateFilter('country', v)}
              placeholder="All countries"
            />

            <MultiSelectDropdown
              label="Languages"
              options={availableOptions.languages}
              selected={filters.languages}
              onChange={(v) => updateFilter('languages', v)}
              placeholder="All languages"
            />

            <MultiSelectDropdown
              label="Channels"
              options={availableOptions.channels}
              selected={filters.channels}
              onChange={(v) => updateFilter('channels', v)}
              placeholder="All channels"
            />
          </div>

          {/* Clear filters button */}
          {hasActiveFilters && (
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleClearAll}
                className="text-sm text-gray-500 hover:text-gray-700 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Accessible summary */}
      <div className="sr-only" role="status" aria-live="polite">
        {hasActiveFilters
          ? `${activeFilterCount} filter${activeFilterCount !== 1 ? 's' : ''} applied`
          : 'No filters applied'}
      </div>
    </div>
  );
}
