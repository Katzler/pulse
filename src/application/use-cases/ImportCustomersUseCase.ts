import { Customer, type CustomerProps } from '@domain/entities';
import { type CustomerWriteRepository, type ImportSummary } from '@domain/repositories';
import { type HealthScoreCalculator } from '@domain/services';
import { type HealthScore } from '@domain/value-objects';
import { AccountType, CustomerStatus, type Result } from '@shared/types';
import { parseDate } from '@application/utils/parseDate';

/**
 * Import error for a specific row
 */
export interface ImportRowError {
  row: number;
  field: string;
  message: string;
}

/**
 * Raw CSV record before conversion
 */
export interface RawCsvRecord {
  'Sirvoy Customer ID': string;
  'Account Owner': string;
  'Account Name': string;
  'Latest Login': string;
  'Created Date': string;
  'Last Customer Success Contact Date': string;
  'Billing Country': string;
  'Account Type': string;
  Languages: string;
  Status: string;
  'Account Status': string;
  'Property Type': string;
  MRR: string;
  Currency: string;
  Channels: string;
}

/**
 * Input for the import use case
 */
export interface ImportCustomersInput {
  records: RawCsvRecord[];
}

/**
 * Output from the import use case
 */
export interface ImportCustomersOutput {
  success: boolean;
  totalRows: number;
  importedCount: number;
  errorCount: number;
  errors: ImportRowError[];
  healthScores: Map<string, HealthScore>;
}

/**
 * Use case for importing customers from CSV data.
 * Orchestrates parsing, validation, and storage.
 */
export class ImportCustomersUseCase {
  private readonly customerRepository: CustomerWriteRepository;
  private readonly healthScoreCalculator: HealthScoreCalculator;

  constructor(customerRepository: CustomerWriteRepository, healthScoreCalculator: HealthScoreCalculator) {
    this.customerRepository = customerRepository;
    this.healthScoreCalculator = healthScoreCalculator;
  }

  /**
   * Execute the import use case
   */
  async execute(input: ImportCustomersInput): Promise<Result<ImportCustomersOutput, string>> {
    const { records } = input;
    const errors: ImportRowError[] = [];
    const customers: Customer[] = [];
    const healthScores = new Map<string, HealthScore>();

    // Process each record
    for (let i = 0; i < records.length; i++) {
      const rowNumber = i + 2; // +2 for 1-based index and header row
      const record = records[i];

      // Validate required fields
      const validationErrors = this.validateRecord(record, rowNumber);
      if (validationErrors.length > 0) {
        errors.push(...validationErrors);
        continue;
      }

      // Convert to domain entity
      const customerResult = this.convertToCustomer(record, rowNumber);
      if (!customerResult.success) {
        errors.push({
          row: rowNumber,
          field: 'conversion',
          message: customerResult.error,
        });
        continue;
      }

      const customer = customerResult.value;
      customers.push(customer);

      // Calculate health score
      const scoreResult = this.healthScoreCalculator.calculate(customer);
      if (scoreResult.success) {
        healthScores.set(customer.id, scoreResult.value);
      }
    }

    // Store in repository
    const storeResult = await this.customerRepository.addMany(customers);

    let importedCount = customers.length;
    if (!storeResult.success) {
      // If storage fails, still return what we processed
      importedCount = 0;
    } else {
      const summary: ImportSummary = storeResult.value;
      importedCount = summary.successCount;
    }

    return {
      success: true,
      value: {
        success: errors.length === 0 && importedCount > 0,
        totalRows: records.length,
        importedCount,
        errorCount: errors.length,
        errors,
        healthScores,
      },
    };
  }

  /**
   * Validate a raw record has required fields
   */
  private validateRecord(record: RawCsvRecord, row: number): ImportRowError[] {
    const errors: ImportRowError[] = [];

    if (!record['Sirvoy Customer ID']?.trim()) {
      errors.push({ row, field: 'Sirvoy Customer ID', message: 'Required field is missing' });
    }

    if (!record['Account Owner']?.trim()) {
      errors.push({ row, field: 'Account Owner', message: 'Required field is missing' });
    }

    if (!record.Status?.trim()) {
      errors.push({ row, field: 'Status', message: 'Required field is missing' });
    }

    if (!record['Account Type']?.trim()) {
      errors.push({ row, field: 'Account Type', message: 'Required field is missing' });
    }

    return errors;
  }

  /**
   * Convert a raw record to a Customer entity
   */
  private convertToCustomer(record: RawCsvRecord, row: number): Result<Customer, string> {
    try {
      // Parse dates (expected format: DD/MM/YYYY, HH:mm or DD/MM/YYYY)
      // Latest Login can be empty (customer never logged in)
      const latestLoginStr = record['Latest Login']?.trim();
      const latestLogin = latestLoginStr ? parseDate(latestLoginStr) : null;
      const createdDate = parseDate(record['Created Date']);

      // Parse last CS contact date (optional)
      const lastCsContactDateStr = record['Last Customer Success Contact Date']?.trim();
      const lastCsContactDate = lastCsContactDateStr ? parseDate(lastCsContactDateStr) : null;

      // If latestLogin string was provided but couldn't be parsed, it's an error
      if (latestLoginStr && latestLogin === null) {
        return { success: false, error: `Invalid Latest Login date format at row ${row}` };
      }

      if (!createdDate) {
        return { success: false, error: `Invalid Created Date format at row ${row}` };
      }

      // If lastCsContactDate string was provided but couldn't be parsed, it's an error
      if (lastCsContactDateStr && lastCsContactDate === null) {
        return { success: false, error: `Invalid Last Customer Success Contact Date format at row ${row}` };
      }

      // Parse MRR (default to 0 if invalid)
      const mrr = this.parseMrr(record.MRR);

      // Parse account type
      const accountType =
        record['Account Type']?.trim() === 'Pro' ? AccountType.Pro : AccountType.Starter;

      // Parse status
      const status = record.Status?.includes('Active')
        ? CustomerStatus.Active
        : CustomerStatus.Inactive;

      // Parse arrays (semicolon-separated)
      const languages = this.parseArray(record.Languages);
      const channels = this.parseArray(record.Channels);

      const props: CustomerProps = {
        id: record['Sirvoy Customer ID'].trim(),
        accountOwner: record['Account Owner'].trim(),
        accountName: record['Account Name']?.trim() ?? '',
        latestLogin,
        createdDate,
        lastCsContactDate,
        billingCountry: record['Billing Country']?.trim() ?? '',
        accountType,
        languages,
        status,
        accountStatus: record['Account Status']?.trim() ?? '',
        propertyType: record['Property Type']?.trim() ?? '',
        currency: record.Currency?.trim() ?? 'USD',
        mrr,
        channels,
      };

      const result = Customer.create(props);
      if (!result.success) {
        return { success: false, error: result.error.message };
      }

      return { success: true, value: result.value };
    } catch (error) {
      return {
        success: false,
        error: `Unexpected error converting row ${row}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Parse MRR value, defaulting to 0 if invalid
   */
  private parseMrr(mrrStr: string): number {
    if (!mrrStr?.trim()) {
      return 0;
    }

    // Remove currency symbols and spaces, parse as float
    const cleaned = mrrStr.replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(cleaned);

    return isNaN(parsed) ? 0 : Math.max(0, parsed);
  }

  /**
   * Parse semicolon-separated array
   */
  private parseArray(str: string): string[] {
    if (!str?.trim()) {
      return [];
    }

    return str
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }
}
