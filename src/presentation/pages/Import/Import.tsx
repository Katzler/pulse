import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { HealthScoreClassification } from '@domain/value-objects';
import type {
  CustomerSummaryDTO,
  DashboardMetricsDTO,
  DistributionItem,
  HealthDistributionDTO,
} from '@application/dtos';
import type { ImportCustomersOutput, ImportRowError } from '@application/use-cases';
import { CsvParser } from '@infrastructure/csv';
import { Button, FileUpload } from '@presentation/components/common';
import { useApp } from '@presentation/context';
import { useCustomerStore, useUIStore } from '@presentation/stores';
import type { RawCustomerRecord } from '@shared/types';

/**
 * Import result state
 */
interface ImportResult {
  success: boolean;
  totalRows: number;
  importedCount: number;
  errorCount: number;
  errors: ImportRowError[];
}

/**
 * Check icon for success state
 */
function CheckIcon() {
  return (
    <svg
      className="h-12 w-12 text-green-500"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

/**
 * Warning icon for partial success
 */
function WarningIcon() {
  return (
    <svg
      className="h-12 w-12 text-yellow-500"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );
}

/**
 * Error icon for failure state
 */
function ErrorIcon() {
  return (
    <svg
      className="h-12 w-12 text-red-500"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

/**
 * Map RawCustomerRecord (from CsvParser) to the format ImportCustomersUseCase expects
 */
function mapToImportRecord(record: RawCustomerRecord) {
  return {
    'Sirvoy Customer ID': record['Sirvoy Customer ID'],
    'Account Owner': record['Account Owner'],
    'Account Name': record['Account Name'],
    'Latest Login': record['Latest Login'],
    'Created Date': record['Created Date'],
    'Last Customer Success Contact Date': record['Last Customer Success Contact Date'],
    'Billing Country': record['Billing Country'],
    'Account Type': record['Account Type'],
    Languages: record['Language'],
    Status: record['Status'],
    'Account Status': record['Sirvoy Account Status'],
    'Property Type': record['Property Type'],
    MRR: record['MRR (converted)'],
    Currency: record['MRR (converted) Currency'],
    Channels: record['Channels'],
  };
}

/**
 * Import page - CSV file upload and processing.
 * Allows users to upload CSV files containing customer data.
 */
export function Import() {
  const navigate = useNavigate();
  const addToast = useUIStore((state) => state.addToast);
  const setCustomers = useCustomerStore((state) => state.setCustomers);
  const setDashboardMetrics = useCustomerStore((state) => state.setDashboardMetrics);

  // Get shared instances from app context
  const { useCases, repository, healthScoreCalculator } = useApp();

  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // CSV parser instance
  const csvParser = useMemo(() => new CsvParser(), []);

  /**
   * Convert repository customers to CustomerSummaryDTO for the store
   * and compute dashboard metrics
   */
  const updateCustomerStore = useCallback(() => {
    const customers = repository.getAll();

    // Track metrics while building summaries
    let activeCount = 0;
    let totalMrr = 0;
    let totalHealthScore = 0;
    const healthDistribution: HealthDistributionDTO = { healthy: 0, atRisk: 0, critical: 0 };
    const countryMap = new Map<string, { count: number; mrr: number }>();
    const channelMap = new Map<string, number>();
    const propertyTypeMap = new Map<string, number>();

    const summaries: CustomerSummaryDTO[] = customers.map((customer) => {
      // Calculate health score for this customer
      const healthResult = healthScoreCalculator.calculate(customer);
      const healthScore = healthResult.success ? healthResult.value.value : 0;
      const classification = healthResult.success
        ? healthResult.value.getClassification()
        : HealthScoreClassification.Critical;

      const classificationString =
        classification === HealthScoreClassification.Healthy
          ? 'healthy'
          : classification === HealthScoreClassification.AtRisk
            ? 'at-risk'
            : 'critical';

      // Update metrics
      if (customer.isActive()) activeCount++;
      totalMrr += customer.mrr;
      totalHealthScore += healthScore;

      // Health distribution
      if (classification === HealthScoreClassification.Healthy) {
        healthDistribution.healthy++;
      } else if (classification === HealthScoreClassification.AtRisk) {
        healthDistribution.atRisk++;
      } else {
        healthDistribution.critical++;
      }

      // Country distribution
      const countryData = countryMap.get(customer.billingCountry) || { count: 0, mrr: 0 };
      countryData.count++;
      countryData.mrr += customer.mrr;
      countryMap.set(customer.billingCountry, countryData);

      // Channel distribution (count each channel)
      for (const channel of customer.channels) {
        channelMap.set(channel, (channelMap.get(channel) || 0) + 1);
      }

      // Property type distribution
      propertyTypeMap.set(customer.propertyType, (propertyTypeMap.get(customer.propertyType) || 0) + 1);

      return {
        id: customer.id,
        accountOwner: customer.accountOwner,
        accountName: customer.accountName,
        status: customer.isActive() ? 'Active Customer' : 'Inactive Customer',
        accountType: customer.accountType,
        healthScore,
        healthClassification: classificationString,
        mrr: customer.mrr,
        channelCount: customer.channels.length,
        latestLogin: customer.latestLogin?.toISOString() ?? null,
        lastCsContactDate: customer.lastCsContactDate?.toISOString() ?? null,
        billingCountry: customer.billingCountry,
      };
    });

    // Build distribution arrays
    const countryDistribution: DistributionItem[] = Array.from(countryMap.entries())
      .map(([name, data]) => ({ name, count: data.count, mrr: data.mrr }))
      .sort((a, b) => (b.mrr || 0) - (a.mrr || 0));

    const channelDistribution: DistributionItem[] = Array.from(channelMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const propertyTypeDistribution: DistributionItem[] = Array.from(propertyTypeMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Build dashboard metrics
    const dashboardMetrics: DashboardMetricsDTO = {
      totalCustomers: customers.length,
      activeCustomers: activeCount,
      inactiveCustomers: customers.length - activeCount,
      averageHealthScore: customers.length > 0 ? totalHealthScore / customers.length : 0,
      totalMrr,
      healthDistribution,
      countryDistribution,
      channelDistribution,
      propertyTypeDistribution,
    };

    setCustomers(summaries);
    setDashboardMetrics(dashboardMetrics);
  }, [repository, healthScoreCalculator, setCustomers, setDashboardMetrics]);

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setImportResult(null);
  }, []);

  const handleImport = useCallback(async () => {
    if (!selectedFile) return;

    setIsProcessing(true);

    try {
      // Parse CSV file
      const parseResult = await csvParser.parseFile(selectedFile);

      if (!parseResult.success) {
        addToast({
          type: 'error',
          title: 'Parse Error',
          message: parseResult.error.message,
        });
        setImportResult({
          success: false,
          totalRows: 0,
          importedCount: 0,
          errorCount: 1,
          errors: [
            {
              row: parseResult.error.row,
              field: parseResult.error.column ?? 'file',
              message: parseResult.error.message,
            },
          ],
        });
        return;
      }

      // Map records to the format expected by ImportCustomersUseCase
      const mappedRecords = parseResult.value.records.map(mapToImportRecord);

      // Import customers using the shared use case
      const importResultData = useCases.importCustomers.execute({ records: mappedRecords });

      if (!importResultData.success) {
        addToast({
          type: 'error',
          title: 'Import Failed',
          message: importResultData.error,
        });
        setImportResult({
          success: false,
          totalRows: parseResult.value.totalRows,
          importedCount: 0,
          errorCount: 1,
          errors: [{ row: 0, field: 'import', message: importResultData.error }],
        });
        return;
      }

      const result: ImportCustomersOutput = importResultData.value;

      setImportResult({
        success: result.success,
        totalRows: result.totalRows,
        importedCount: result.importedCount,
        errorCount: result.errorCount,
        errors: result.errors,
      });

      if (result.importedCount > 0) {
        // Update the customer store with imported data
        updateCustomerStore();

        addToast({
          type: result.errorCount > 0 ? 'warning' : 'success',
          title: result.errorCount > 0 ? 'Import Completed with Warnings' : 'Import Successful',
          message: `${result.importedCount} of ${result.totalRows} customers imported.`,
        });
      } else {
        addToast({
          type: 'error',
          title: 'Import Failed',
          message: 'No customers were imported. Please check the errors below.',
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      addToast({
        type: 'error',
        title: 'Import Error',
        message,
      });
      setImportResult({
        success: false,
        totalRows: 0,
        importedCount: 0,
        errorCount: 1,
        errors: [{ row: 0, field: 'system', message }],
      });
    } finally {
      setIsProcessing(false);
    }
  }, [selectedFile, csvParser, useCases.importCustomers, addToast, updateCustomerStore]);

  const handleReset = useCallback(() => {
    setSelectedFile(null);
    setImportResult(null);
  }, []);

  const handleViewDashboard = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleViewCustomers = useCallback(() => {
    navigate('/customers');
  }, [navigate]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Import Data</h1>
        <p className="text-gray-600 dark:text-gray-400">Upload CSV files to import customer data</p>
      </div>

      {!importResult ? (
        <div className="space-y-6">
          <div className="rounded-lg border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-6">
            <FileUpload
              label="Upload customer CSV file"
              helperText="CSV files up to 10MB with standard customer data format"
              accept=".csv"
              maxSize={10 * 1024 * 1024}
              onFileSelect={handleFileSelect}
              disabled={isProcessing}
            />
          </div>

          {selectedFile && (
            <div className="flex items-center justify-end gap-3">
              <Button variant="secondary" onClick={handleReset} disabled={isProcessing}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleImport} disabled={isProcessing}>
                {isProcessing ? 'Importing...' : 'Import Data'}
              </Button>
            </div>
          )}

          <div className="rounded-lg border border-gray-200 dark:border-surface-700 bg-gray-50 dark:bg-surface-800 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Expected CSV Format</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Your CSV file should contain the following columns:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              {[
                'Account Owner',
                'Account Name',
                'Latest Login',
                'Created Date',
                'Last Customer Success Contact Date',
                'Billing Country',
                'Account Type',
                'Language',
                'Status',
                'Sirvoy Account Status',
                'Sirvoy Customer ID',
                'Property Type',
                'MRR (converted) Currency',
                'MRR (converted)',
                'Channels',
              ].map((header) => (
                <code key={header} className="bg-white dark:bg-surface-700 px-2 py-1 rounded border dark:border-surface-600 text-gray-700 dark:text-gray-300">
                  {header}
                </code>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Result Summary */}
          <div className="rounded-lg border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-8 text-center">
            <div className="flex justify-center mb-4">
              {importResult.importedCount === importResult.totalRows && importResult.totalRows > 0 ? (
                <CheckIcon />
              ) : importResult.importedCount > 0 ? (
                <WarningIcon />
              ) : (
                <ErrorIcon />
              )}
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {importResult.importedCount === importResult.totalRows && importResult.totalRows > 0
                ? 'Import Successful'
                : importResult.importedCount > 0
                  ? 'Import Completed with Errors'
                  : 'Import Failed'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {importResult.importedCount} of {importResult.totalRows} customers imported
              {importResult.errorCount > 0 && ` (${importResult.errorCount} errors)`}
            </p>

            <div className="flex justify-center gap-3">
              <Button variant="secondary" onClick={handleReset}>
                Import Another File
              </Button>
              {importResult.importedCount > 0 && (
                <>
                  <Button variant="primary" onClick={handleViewDashboard}>
                    View Dashboard
                  </Button>
                  <Button variant="secondary" onClick={handleViewCustomers}>
                    View Customers
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Error Details */}
          {importResult.errors.length > 0 && (
            <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 p-6">
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-300 mb-3">
                Import Errors ({importResult.errors.length})
              </h3>
              <div className="max-h-64 overflow-y-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-red-700 dark:text-red-400">
                      <th className="pb-2 pr-4">Row</th>
                      <th className="pb-2 pr-4">Field</th>
                      <th className="pb-2">Error</th>
                    </tr>
                  </thead>
                  <tbody className="text-red-800 dark:text-red-300">
                    {importResult.errors.slice(0, 50).map((error, index) => (
                      <tr key={index} className="border-t border-red-200 dark:border-red-800/50">
                        <td className="py-2 pr-4">{error.row}</td>
                        <td className="py-2 pr-4">{error.field}</td>
                        <td className="py-2">{error.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {importResult.errors.length > 50 && (
                  <p className="mt-3 text-red-700 dark:text-red-400">
                    ...and {importResult.errors.length - 50} more errors
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
