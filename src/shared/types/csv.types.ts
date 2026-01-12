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
 * Property type classification for customer properties.
 * Common values from the CSV data.
 */
export const PropertyType = {
  Hotels: 'Hotels',
  BedAndBreakfast: 'Bed & Breakfast',
  Hostel: 'Hostel',
  Vacation: 'Vacation',
  Apartment: 'Apartment',
  Other: 'Other',
} as const;

export type PropertyType = (typeof PropertyType)[keyof typeof PropertyType];

/**
 * Raw record structure as imported from CSV file.
 * Field names match the CSV column headers exactly.
 */
export interface RawCustomerRecord {
  /** Customer success manager assigned to this account */
  'Account Owner': string;
  /** Account/company name */
  'Account Name': string;
  /** Last login timestamp in DD/MM/YYYY, HH:mm format */
  'Latest Login': string;
  /** Account creation date in DD/MM/YYYY format */
  'Created Date': string;
  /** Last customer success contact date in DD/MM/YYYY format */
  'Last Customer Success Contact Date': string;
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

/**
 * Raw record structure for sentiment/chat interaction data.
 * Field names match the CSV column headers exactly.
 */
export interface RawSentimentRecord {
  /** Sentiment score from chat analysis (-1 to +1) */
  'Customer Sentiment Score': string;
  /** Date of the interaction in DD/MM/YYYY format */
  'Interaction: Created Date': string;
  /** Salesforce case number for lookup */
  Case: string;
  /** Customer ID to match with customer records */
  'Account: Sirvoy Customer ID': string;
}

/**
 * List of all sentiment CSV column headers for validation
 */
export const SENTIMENT_CSV_HEADERS: (keyof RawSentimentRecord)[] = [
  'Customer Sentiment Score',
  'Interaction: Created Date',
  'Case',
  'Account: Sirvoy Customer ID',
];
