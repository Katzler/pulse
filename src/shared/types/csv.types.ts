/**
 * Account type classification for customers
 */
export const AccountType = {
  Pro: 'Pro',
  Starter: 'Starter',
} as const;

export type AccountType = (typeof AccountType)[keyof typeof AccountType];

/**
 * Customer activity status
 */
export const CustomerStatus = {
  Active: 'Active Customer',
  Inactive: 'Inactive Customer',
} as const;

export type CustomerStatus = (typeof CustomerStatus)[keyof typeof CustomerStatus];

/**
 * Raw record structure as imported from CSV file.
 * Field names match the CSV column headers exactly.
 */
export interface RawCustomerRecord {
  /** Customer success manager assigned to this account */
  'Account Owner': string;
  /** Last login timestamp in DD/MM/YYYY, HH:mm format */
  'Latest Login': string;
  /** Account creation date in DD/MM/YYYY format */
  'Created Date': string;
  /** Customer's billing country */
  'Billing Country': string;
  /** Account tier: Pro or Starter */
  'Account Type': string;
  /** Preferred languages (semicolon-separated) */
  Language: string;
  /** Active or Inactive customer status */
  Status: string;
  /** Loyalty status (e.g., Loyal) */
  'Sirvoy Account Status': string;
  /** Unique customer identifier */
  'Sirvoy Customer ID': string;
  /** Type of property (Hotels, B&B, etc.) */
  'Property Type': string;
  /** Currency code for MRR */
  'MRR (converted) Currency': string;
  /** Monthly recurring revenue value as string */
  'MRR (converted)': string;
  /** Connected distribution channels (semicolon-separated) */
  Channels: string;
}

/**
 * List of all CSV column headers for validation
 */
export const CSV_HEADERS: (keyof RawCustomerRecord)[] = [
  'Account Owner',
  'Latest Login',
  'Created Date',
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
