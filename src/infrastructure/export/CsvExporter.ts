import { type Customer } from '@domain/entities';
import { type HealthScore, HealthScoreClassification } from '@domain/value-objects';

/**
 * Options for CSV export
 */
export interface ExportOptions {
  /** Include health score column. Default: true */
  includeHealthScore?: boolean;
  /** Include column headers. Default: true */
  includeHeaders?: boolean;
  /** Specific columns to include (by field name). Default: all columns */
  columns?: string[];
  /** Column delimiter. Default: ',' */
  delimiter?: string;
}

/**
 * Export column definition
 */
interface ExportColumn {
  header: string;
  getValue: (customer: Customer, healthScore?: HealthScore) => string;
}

/**
 * CSV Exporter for customer data.
 * Exports customer lists to CSV format with optional health scores.
 */
export class CsvExporter {
  private readonly defaultColumns: ExportColumn[] = [
    { header: 'Sirvoy Customer ID', getValue: (c) => c.id },
    { header: 'Account Owner', getValue: (c) => c.accountOwner },
    { header: 'Account Name', getValue: (c) => c.accountName },
    { header: 'Status', getValue: (c) => (c.isActive() ? 'Active Customer' : 'Inactive Customer') },
    { header: 'Account Type', getValue: (c) => c.accountType },
    { header: 'Latest Login', getValue: (c) => (c.latestLogin ? this.formatDateTime(c.latestLogin) : '') },
    { header: 'Created Date', getValue: (c) => this.formatDate(c.createdDate) },
    {
      header: 'Last Customer Success Contact Date',
      getValue: (c) => (c.lastCsContactDate ? this.formatDate(c.lastCsContactDate) : ''),
    },
    { header: 'Billing Country', getValue: (c) => c.billingCountry },
    { header: 'Language', getValue: (c) => c.languages.join('; ') },
    { header: 'Channels', getValue: (c) => c.channels.join('; ') },
    { header: 'Property Type', getValue: (c) => c.propertyType },
    { header: 'MRR (converted)', getValue: (c) => c.mrr.toFixed(2) },
    { header: 'MRR (converted) Currency', getValue: (c) => c.currency },
    { header: 'Sirvoy Account Status', getValue: (c) => c.accountStatus },
  ];

  private readonly healthScoreColumns: ExportColumn[] = [
    {
      header: 'Health Score',
      getValue: (_, healthScore) => (healthScore ? healthScore.value.toString() : ''),
    },
    {
      header: 'Health Status',
      getValue: (_, healthScore) => {
        if (!healthScore) return '';
        switch (healthScore.getClassification()) {
          case HealthScoreClassification.Healthy:
            return 'Healthy';
          case HealthScoreClassification.AtRisk:
            return 'At Risk';
          case HealthScoreClassification.Critical:
            return 'Critical';
        }
      },
    },
  ];

  /**
   * Export customers to CSV string
   */
  exportCustomers(
    customers: Customer[],
    healthScores?: Map<string, HealthScore>,
    options?: ExportOptions
  ): string {
    const delimiter = options?.delimiter ?? ',';
    const includeHeaders = options?.includeHeaders !== false;
    const includeHealthScore = options?.includeHealthScore !== false && healthScores !== undefined;

    // Determine columns to include
    let columns = [...this.defaultColumns];
    if (includeHealthScore) {
      columns = [...columns, ...this.healthScoreColumns];
    }

    // Filter columns if specific columns are requested
    if (options?.columns) {
      columns = columns.filter((col) => options.columns!.includes(col.header));
    }

    // Build CSV lines
    const lines: string[] = [];

    // Add header row
    if (includeHeaders) {
      const headerRow = columns.map((col) => this.escapeField(col.header)).join(delimiter);
      lines.push(headerRow);
    }

    // Add data rows
    for (const customer of customers) {
      const healthScore = healthScores?.get(customer.id);
      const row = columns.map((col) => this.escapeField(col.getValue(customer, healthScore))).join(delimiter);
      lines.push(row);
    }

    return lines.join('\n');
  }

  /**
   * Export customers and trigger browser download
   */
  downloadCsv(
    customers: Customer[],
    filename: string,
    healthScores?: Map<string, HealthScore>,
    options?: ExportOptions
  ): void {
    const csvContent = this.exportCustomers(customers, healthScores, options);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    // Create temporary link and trigger download
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    URL.revokeObjectURL(url);
  }

  /**
   * Generate default filename for export
   */
  generateFilename(prefix: string = 'customers-export'): string {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return `${prefix}-${date}.csv`;
  }

  /**
   * Escape a field value for CSV
   * - Wraps in quotes if contains comma, quote, or newline
   * - Doubles any existing quotes
   */
  private escapeField(value: string): string {
    if (!value) return '""';

    // Check if escaping is needed
    const needsQuoting = value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r');

    if (needsQuoting) {
      // Double any existing quotes and wrap in quotes
      const escaped = value.replace(/"/g, '""');
      return `"${escaped}"`;
    }

    // Still wrap in quotes for consistency
    return `"${value}"`;
  }

  /**
   * Format date as DD/MM/YYYY
   */
  private formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  /**
   * Format datetime as DD/MM/YYYY, HH:mm
   */
  private formatDateTime(date: Date): string {
    const dateStr = this.formatDate(date);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${dateStr}, ${hours}:${minutes}`;
  }
}
