import { useCallback, useState } from 'react';

import type { CustomerDTO } from '@application/dtos';
import { useUIStore } from '@presentation/stores';

import type { ExportFormat } from '../components/common/ExportButton';

/**
 * Options for useExport hook
 */
export interface UseExportOptions {
  /** Filename prefix (without extension) */
  filenamePrefix?: string;
  /** Include date in filename */
  includeDateInFilename?: boolean;
}

/**
 * Return type for useExport hook
 */
export interface UseExportResult {
  /** Whether export is in progress */
  isExporting: boolean;
  /** Trigger export with specified format */
  handleExport: (format: ExportFormat, customers: CustomerDTO[]) => Promise<void>;
}

/**
 * Format date for filename (YYYY-MM-DD)
 */
function formatDateForFilename(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Generate filename with optional date
 */
function generateFilename(
  prefix: string,
  format: ExportFormat,
  includeDate: boolean
): string {
  const extension = format === 'xlsx' ? 'xlsx' : format;
  const datePart = includeDate ? `-${formatDateForFilename()}` : '';
  return `${prefix}${datePart}.${extension}`;
}

/**
 * CSV headers for CustomerDTO export
 */
const CSV_HEADERS = [
  'Sirvoy Customer ID',
  'Account Owner',
  'Status',
  'Account Type',
  'Latest Login',
  'Created Date',
  'Billing Country',
  'Languages',
  'Channels',
  'Property Type',
  'MRR',
  'Currency',
  'Account Status',
  'Health Score',
  'Health Classification',
];

/**
 * Convert CustomerDTO to CSV row
 */
function customerToCsvRow(customer: CustomerDTO): string {
  const fields = [
    customer.id,
    customer.accountOwner,
    customer.status,
    customer.accountType,
    customer.latestLogin,
    customer.createdDate,
    customer.billingCountry,
    customer.languages.join('; '),
    customer.channels.join('; '),
    customer.propertyType,
    customer.mrr.toFixed(2),
    customer.currency,
    customer.accountStatus,
    customer.healthScore.toString(),
    customer.healthClassification,
  ];

  return fields.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(',');
}

/**
 * Convert customers to JSON and trigger download
 */
function downloadJson(customers: CustomerDTO[], filename: string): void {
  const jsonContent = JSON.stringify(customers, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  triggerDownload(blob, filename);
}

/**
 * Convert customers to CSV and trigger download
 */
function downloadCsv(customers: CustomerDTO[], filename: string): void {
  const headerRow = CSV_HEADERS.map((h) => `"${h}"`).join(',');
  const dataRows = customers.map(customerToCsvRow);
  const csvContent = [headerRow, ...dataRows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, filename);
}

/**
 * Trigger browser download
 */
function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Hook for handling data export with toast notifications.
 * Supports CSV, JSON, and Excel formats (Excel shows info toast).
 *
 * @example
 * const { isExporting, handleExport } = useExport({
 *   filenamePrefix: 'customers',
 *   includeDateInFilename: true,
 * });
 *
 * <ExportButton
 *   onExport={(format) => handleExport(format, customers)}
 *   isExporting={isExporting}
 *   recordCount={customers.length}
 * />
 */
export function useExport(options: UseExportOptions = {}): UseExportResult {
  const { filenamePrefix = 'export', includeDateInFilename = true } = options;

  const [isExporting, setIsExporting] = useState(false);
  const addToast = useUIStore((state) => state.addToast);

  const handleExport = useCallback(
    async (format: ExportFormat, customers: CustomerDTO[]) => {
      if (customers.length === 0) {
        addToast({
          type: 'warning',
          title: 'No data to export',
          message: 'There are no customers to export.',
        });
        return;
      }

      setIsExporting(true);

      try {
        const filename = generateFilename(filenamePrefix, format, includeDateInFilename);

        // Small delay to show loading state
        await new Promise((resolve) => setTimeout(resolve, 100));

        switch (format) {
          case 'csv':
            downloadCsv(customers, filename);
            addToast({
              type: 'success',
              title: 'Export complete',
              message: `${customers.length} customer${customers.length !== 1 ? 's' : ''} exported to CSV.`,
            });
            break;

          case 'json':
            downloadJson(customers, filename);
            addToast({
              type: 'success',
              title: 'Export complete',
              message: `${customers.length} customer${customers.length !== 1 ? 's' : ''} exported to JSON.`,
            });
            break;

          case 'xlsx':
            // Excel export requires a library like xlsx or exceljs
            // For now, fall back to CSV with a note
            downloadCsv(customers, filename.replace('.xlsx', '.csv'));
            addToast({
              type: 'info',
              title: 'Exported as CSV',
              message:
                'Excel format is not yet available. Data has been exported as CSV which can be opened in Excel.',
            });
            break;

          default:
            throw new Error(`Unsupported export format: ${format}`);
        }
      } catch (error) {
        console.error('Export failed:', error);
        addToast({
          type: 'error',
          title: 'Export failed',
          message: 'An error occurred while exporting data. Please try again.',
        });
      } finally {
        setIsExporting(false);
      }
    },
    [filenamePrefix, includeDateInFilename, addToast]
  );

  return {
    isExporting,
    handleExport,
  };
}
