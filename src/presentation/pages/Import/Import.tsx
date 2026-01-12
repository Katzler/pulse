import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { HealthScoreClassification } from '@domain/value-objects';
import type {
  CustomerSummaryDTO,
  DashboardMetricsDTO,
  DistributionItem,
  HealthDistributionDTO,
} from '@application/dtos';
import type { ImportCustomersOutput, ImportRowError, SentimentImportRowError } from '@application/use-cases';
import { CsvParser, SentimentCsvParser } from '@infrastructure/csv';
import { Button, FileUpload } from '@presentation/components/common';
import { useApp } from '@presentation/context';
import { useCustomerStore, useUIStore } from '@presentation/stores';
import type { RawCustomerRecord } from '@shared/types';

/**
 * Import type selection
 */
type ImportType = 'customers' | 'sentiment';

/**
 * Import result state for customer import
 */
interface CustomerImportResult {
  type: 'customers';
  success: boolean;
  totalRows: number;
  importedCount: number;
  errorCount: number;
  errors: ImportRowError[];
}

/**
 * Import result state for sentiment import
 */
interface SentimentImportResult {
  type: 'sentiment';
  success: boolean;
  totalRows: number;
  importedCount: number;
  errorCount: number;
  errors: SentimentImportRowError[];
  customersUpdated: string[];
  customersNotFound: string[];
}

type ImportResult = CustomerImportResult | SentimentImportResult;

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
 * Import type tab button
 */
interface ImportTabProps {
  type: ImportType;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
  hasData?: boolean;
}

function ImportTab({ type, selected, onClick, disabled, hasData }: ImportTabProps) {
  const labels = {
    customers: 'Customer Data',
    sentiment: 'Sentiment Data',
  };

  const descriptions = {
    customers: 'Import customer accounts and metrics',
    sentiment: 'Import chat sentiment scores',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        relative flex-1 p-4 text-left rounded-lg border-2 transition-all
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary-400 dark:hover:border-primary-500'}
        ${selected
          ? 'border-primary-500 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20'
          : 'border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-800'
        }
      `}
    >
      <div className="flex items-center justify-between">
        <span className={`font-medium ${selected ? 'text-primary-700 dark:text-primary-300' : 'text-gray-900 dark:text-white'}`}>
          {labels[type]}
        </span>
        {hasData && (
          <span className="px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
            Imported
          </span>
        )}
      </div>
      <p className={`mt-1 text-sm ${selected ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'}`}>
        {descriptions[type]}
      </p>
    </button>
  );
}

/**
 * Import page - CSV file upload and processing.
 * Allows users to upload CSV files containing customer data or sentiment data.
 */
export function Import() {
  const navigate = useNavigate();
  const addToast = useUIStore((state) => state.addToast);
  const setCustomers = useCustomerStore((state) => state.setCustomers);
  const setDashboardMetrics = useCustomerStore((state) => state.setDashboardMetrics);
  const customerCount = useCustomerStore((state) => state.customers.length);

  // Get shared instances from app context
  const { useCases, repository, sentimentRepository, healthScoreCalculator } = useApp();

  const [importType, setImportType] = useState<ImportType>('customers');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // CSV parser instances
  const csvParser = useMemo(() => new CsvParser(), []);
  const sentimentParser = useMemo(() => new SentimentCsvParser(), []);

  // Check if customer data has been imported
  const hasCustomerData = customerCount > 0;
  const hasSentimentData = sentimentRepository.count() > 0;

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
      // Get sentiment data for this customer
      const sentimentSummary = sentimentRepository.getSummaryByCustomerId(customer.id);

      // Calculate health score for this customer (with sentiment adjustment if available)
      const healthOptions = sentimentSummary.success
        ? { averageSentimentScore: sentimentSummary.value.averageSentimentScore }
        : undefined;
      const healthResult = healthScoreCalculator.calculate(customer, healthOptions);
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
  }, [repository, sentimentRepository, healthScoreCalculator, setCustomers, setDashboardMetrics]);

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setImportResult(null);
  }, []);

  const handleImportCustomers = useCallback(async () => {
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
          type: 'customers',
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
          type: 'customers',
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
        type: 'customers',
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
        type: 'customers',
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

  const handleImportSentiment = useCallback(async () => {
    if (!selectedFile) return;

    setIsProcessing(true);

    try {
      // Parse CSV file
      const parseResult = await sentimentParser.parseFile(selectedFile);

      if (!parseResult.success) {
        addToast({
          type: 'error',
          title: 'Parse Error',
          message: parseResult.error.message,
        });
        setImportResult({
          type: 'sentiment',
          success: false,
          totalRows: 0,
          importedCount: 0,
          errorCount: 1,
          errors: [
            {
              row: parseResult.error.row,
              field: 'file',
              message: parseResult.error.message,
            },
          ],
          customersUpdated: [],
          customersNotFound: [],
        });
        return;
      }

      // Import sentiment data using the use case
      const importResultData = useCases.importSentimentData.execute({
        records: parseResult.value.records,
      });

      if (!importResultData.success) {
        addToast({
          type: 'error',
          title: 'Import Failed',
          message: importResultData.error,
        });
        setImportResult({
          type: 'sentiment',
          success: false,
          totalRows: parseResult.value.totalRows,
          importedCount: 0,
          errorCount: 1,
          errors: [{ row: 0, field: 'import', message: importResultData.error }],
          customersUpdated: [],
          customersNotFound: [],
        });
        return;
      }

      const result = importResultData.value;

      setImportResult({
        type: 'sentiment',
        success: result.success,
        totalRows: result.totalRows,
        importedCount: result.importedCount,
        errorCount: result.errorCount,
        errors: result.errors,
        customersUpdated: result.customersUpdated,
        customersNotFound: result.customersNotFound,
      });

      if (result.importedCount > 0) {
        // Update the customer store to recalculate health scores with sentiment
        updateCustomerStore();

        addToast({
          type: result.errorCount > 0 ? 'warning' : 'success',
          title: result.errorCount > 0 ? 'Import Completed with Warnings' : 'Import Successful',
          message: `${result.importedCount} sentiment records imported for ${result.customersUpdated.length} customers.`,
        });
      } else if (result.customersNotFound.length > 0) {
        addToast({
          type: 'warning',
          title: 'No Matching Customers',
          message: `No sentiment data was imported. ${result.customersNotFound.length} customer IDs were not found. Import customer data first.`,
        });
      } else {
        addToast({
          type: 'error',
          title: 'Import Failed',
          message: 'No sentiment data was imported. Please check the errors below.',
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
        type: 'sentiment',
        success: false,
        totalRows: 0,
        importedCount: 0,
        errorCount: 1,
        errors: [{ row: 0, field: 'system', message }],
        customersUpdated: [],
        customersNotFound: [],
      });
    } finally {
      setIsProcessing(false);
    }
  }, [selectedFile, sentimentParser, useCases.importSentimentData, addToast, updateCustomerStore]);

  const handleImport = useCallback(() => {
    if (importType === 'customers') {
      handleImportCustomers();
    } else {
      handleImportSentiment();
    }
  }, [importType, handleImportCustomers, handleImportSentiment]);

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

  const handleSwitchImportType = useCallback((type: ImportType) => {
    if (type !== importType) {
      setImportType(type);
      setSelectedFile(null);
      setImportResult(null);
    }
  }, [importType]);

  // Customer CSV headers
  const customerHeaders = [
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
  ];

  // Sentiment CSV headers
  const sentimentHeaders = [
    'Customer Sentiment Score',
    'Interaction (Created Date)',
    'Case',
    'Account: Sirvoy Customer ID',
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Import Data</h1>
        <p className="text-gray-600 dark:text-gray-400">Upload CSV files to import customer and sentiment data</p>
      </div>

      {/* Import Type Selection */}
      <div className="flex gap-4" role="tablist" aria-label="Import data type">
        <ImportTab
          type="customers"
          selected={importType === 'customers'}
          onClick={() => handleSwitchImportType('customers')}
          disabled={isProcessing}
          hasData={hasCustomerData}
        />
        <ImportTab
          type="sentiment"
          selected={importType === 'sentiment'}
          onClick={() => handleSwitchImportType('sentiment')}
          disabled={isProcessing || !hasCustomerData}
          hasData={hasSentimentData}
        />
      </div>

      {/* Sentiment import requires customer data first */}
      {importType === 'sentiment' && !hasCustomerData && (
        <div className="rounded-lg border border-yellow-200 dark:border-yellow-900/50 bg-yellow-50 dark:bg-yellow-900/20 p-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            <strong>Note:</strong> Please import customer data first before importing sentiment data.
            Sentiment records are linked to customers by their Customer ID.
          </p>
        </div>
      )}

      {!importResult ? (
        <div className="space-y-6">
          <div className="rounded-lg border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-6">
            <FileUpload
              label={importType === 'customers' ? 'Upload customer CSV file' : 'Upload sentiment CSV file'}
              helperText={
                importType === 'customers'
                  ? 'CSV files up to 10MB with standard customer data format'
                  : 'CSV files up to 10MB with sentiment score data'
              }
              accept=".csv"
              maxSize={10 * 1024 * 1024}
              onFileSelect={handleFileSelect}
              disabled={isProcessing || (importType === 'sentiment' && !hasCustomerData)}
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
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Expected {importType === 'customers' ? 'Customer' : 'Sentiment'} CSV Format
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Your CSV file should contain the following columns:
            </p>
            <div className={`grid gap-2 text-sm ${importType === 'customers' ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-2'}`}>
              {(importType === 'customers' ? customerHeaders : sentimentHeaders).map((header) => (
                <code key={header} className="bg-white dark:bg-surface-700 px-2 py-1 rounded border dark:border-surface-600 text-gray-700 dark:text-gray-300">
                  {header}
                </code>
              ))}
            </div>
            {importType === 'sentiment' && (
              <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                <p><strong>Customer Sentiment Score:</strong> A value between -1 (very negative) and +1 (very positive)</p>
                <p><strong>Case:</strong> The Salesforce case number for easy reference</p>
              </div>
            )}
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
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              {importResult.type === 'customers' ? (
                <>
                  {importResult.importedCount} of {importResult.totalRows} customers imported
                  {importResult.errorCount > 0 && ` (${importResult.errorCount} errors)`}
                </>
              ) : (
                <>
                  {importResult.importedCount} of {importResult.totalRows} sentiment records imported
                  {importResult.errorCount > 0 && ` (${importResult.errorCount} errors)`}
                </>
              )}
            </p>

            {/* Sentiment-specific summary */}
            {importResult.type === 'sentiment' && importResult.customersUpdated.length > 0 && (
              <p className="text-sm text-green-600 dark:text-green-400 mb-4">
                Health scores updated for {importResult.customersUpdated.length} customers
              </p>
            )}
            {importResult.type === 'sentiment' && importResult.customersNotFound.length > 0 && (
              <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-4">
                {importResult.customersNotFound.length} customer IDs not found
              </p>
            )}

            <div className="flex justify-center gap-3 mt-6">
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
