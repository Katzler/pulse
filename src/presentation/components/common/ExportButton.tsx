import type { JSX } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Export format options
 */
export type ExportFormat = 'csv' | 'json' | 'xlsx';

/**
 * Export option configuration
 */
interface ExportOption {
  format: ExportFormat;
  label: string;
  description: string;
  icon: JSX.Element;
}

/**
 * Available export options
 */
const exportOptions: ExportOption[] = [
  {
    format: 'csv',
    label: 'CSV',
    description: 'Comma-separated values, compatible with Excel',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
  },
  {
    format: 'json',
    label: 'JSON',
    description: 'JavaScript Object Notation, for developers',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
        />
      </svg>
    ),
  },
  {
    format: 'xlsx',
    label: 'Excel',
    description: 'Microsoft Excel spreadsheet format',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
        />
      </svg>
    ),
  },
];

/**
 * Props for ExportButton component
 */
export interface ExportButtonProps {
  /** Callback when export format is selected */
  onExport: (format: ExportFormat) => void;
  /** Whether export is in progress */
  isExporting?: boolean;
  /** Number of records to export */
  recordCount?: number | undefined;
  /** Disabled state */
  disabled?: boolean;
  /** Button variant */
  variant?: 'primary' | 'secondary';
  /** Additional CSS class */
  className?: string;
}

/**
 * Download icon component
 */
function DownloadIcon(): JSX.Element {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
      />
    </svg>
  );
}

/**
 * Chevron down icon
 */
function ChevronDownIcon(): JSX.Element {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  );
}

/**
 * Loading spinner
 */
function LoadingSpinner(): JSX.Element {
  return (
    <svg
      className="w-4 h-4 animate-spin"
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
 * ExportButton component with dropdown menu for selecting export format.
 * Provides CSV, JSON, and Excel export options.
 *
 * @example
 * <ExportButton
 *   onExport={(format) => handleExport(format)}
 *   recordCount={100}
 * />
 */
export function ExportButton({
  onExport,
  isExporting = false,
  recordCount,
  disabled = false,
  variant = 'secondary',
  className = '',
}: ExportButtonProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleExport = useCallback(
    (format: ExportFormat) => {
      onExport(format);
      setIsOpen(false);
    },
    [onExport]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent, format: ExportFormat) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleExport(format);
      }
    },
    [handleExport]
  );

  const toggleDropdown = useCallback(() => {
    if (!disabled && !isExporting) {
      setIsOpen((prev) => !prev);
    }
  }, [disabled, isExporting]);

  const buttonBaseStyles =
    'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

  const buttonVariantStyles = {
    primary:
      'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:bg-blue-300',
    secondary:
      'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400',
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Main button */}
      <button
        ref={buttonRef}
        type="button"
        className={`${buttonBaseStyles} ${buttonVariantStyles[variant]}`}
        onClick={toggleDropdown}
        disabled={disabled || isExporting}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        data-testid="export-button"
      >
        {isExporting ? (
          <>
            <LoadingSpinner />
            <span>Exporting...</span>
          </>
        ) : (
          <>
            <DownloadIcon />
            <span>Export</span>
            {recordCount !== undefined && recordCount > 0 && (
              <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">
                {recordCount}
              </span>
            )}
            <ChevronDownIcon />
          </>
        )}
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          className="absolute right-0 z-10 mt-2 w-64 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="export-menu"
          data-testid="export-dropdown"
        >
          <div className="p-1">
            <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
              Export Format
            </div>
            {exportOptions.map((option) => (
              <button
                key={option.format}
                type="button"
                className="w-full flex items-start gap-3 px-3 py-2 text-left rounded-md hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors"
                role="menuitem"
                onClick={() => handleExport(option.format)}
                onKeyDown={(e) => handleKeyDown(e, option.format)}
                data-testid={`export-option-${option.format}`}
              >
                <span className="text-gray-500 mt-0.5">{option.icon}</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {option.label}
                  </p>
                  <p className="text-xs text-gray-500">{option.description}</p>
                </div>
              </button>
            ))}
          </div>
          {recordCount !== undefined && (
            <div className="border-t border-gray-100 px-3 py-2 text-xs text-gray-500">
              {recordCount} record{recordCount !== 1 ? 's' : ''} will be exported
            </div>
          )}
        </div>
      )}

      {/* Screen reader status */}
      <div className="sr-only" role="status" aria-live="polite">
        {isExporting ? 'Exporting data...' : ''}
      </div>
    </div>
  );
}
