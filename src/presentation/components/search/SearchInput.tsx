import type { ChangeEvent,JSX, KeyboardEvent } from 'react';

/**
 * Props for SearchInput component
 */
export interface SearchInputProps {
  /** Current search value */
  value: string;
  /** Called when input value changes */
  onChange: (value: string) => void;
  /** Called when search is triggered (Enter or button click) */
  onSearch: () => void;
  /** Called when clear button is clicked */
  onClear: () => void;
  /** Placeholder text */
  placeholder?: string;
  /** Whether search is in progress */
  isLoading?: boolean;
  /** Input ID for accessibility */
  id?: string;
}

/**
 * Search icon SVG component
 */
function SearchIcon(): JSX.Element {
  return (
    <svg
      className="h-5 w-5 text-gray-400"
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
  );
}

/**
 * Clear button icon (X)
 */
function ClearIcon(): JSX.Element {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

/**
 * Small spinner for loading state
 */
function SmallSpinner(): JSX.Element {
  return (
    <svg
      className="h-4 w-4 animate-spin text-blue-600"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

/**
 * SearchInput component with icon, clear button, and loading state.
 * Triggers search on Enter key press.
 *
 * @example
 * <SearchInput
 *   value={searchTerm}
 *   onChange={setSearchTerm}
 *   onSearch={handleSearch}
 *   onClear={() => setSearchTerm('')}
 *   placeholder="Search by ID or name..."
 * />
 */
export function SearchInput({
  value,
  onChange,
  onSearch,
  onClear,
  placeholder = 'Search...',
  isLoading = false,
  id = 'search-input',
}: SearchInputProps): JSX.Element {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading) {
      onSearch();
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleClear = () => {
    onClear();
  };

  return (
    <div className="flex gap-2" data-testid="search-input">
      <div className="relative flex-1">
        {/* Search icon */}
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <SearchIcon />
        </div>

        {/* Input field */}
        <input
          id={id}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          className={`
            block w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-10
            text-sm text-gray-900 placeholder-gray-500
            focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20
            disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500
          `}
          aria-label="Search customers"
        />

        {/* Clear button or loading spinner */}
        {(value || isLoading) && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {isLoading ? (
              <SmallSpinner />
            ) : (
              <button
                type="button"
                onClick={handleClear}
                className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
                aria-label="Clear search"
              >
                <ClearIcon />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Search button */}
      <button
        type="button"
        onClick={onSearch}
        disabled={isLoading}
        className={`
          inline-flex items-center justify-center rounded-lg px-4 py-2.5
          text-sm font-medium text-white
          bg-blue-600 hover:bg-blue-700
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          disabled:cursor-not-allowed disabled:bg-blue-400
          transition-colors
        `}
      >
        {isLoading ? (
          <>
            <SmallSpinner />
            <span className="sr-only">Searching...</span>
          </>
        ) : (
          'Search'
        )}
      </button>
    </div>
  );
}
