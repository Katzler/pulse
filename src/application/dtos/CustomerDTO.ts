/**
 * Full customer data for detail views.
 * Contains all customer information including calculated health score.
 */
export interface CustomerDTO {
  /** Customer ID */
  id: string;
  /** Account owner name */
  accountOwner: string;
  /** Latest login as ISO date string */
  latestLogin: string;
  /** Account creation date as ISO date string */
  createdDate: string;
  /** Billing country name */
  billingCountry: string;
  /** Account type: "Pro" or "Starter" */
  accountType: string;
  /** Array of languages */
  languages: string[];
  /** Status: "Active Customer" or "Inactive Customer" */
  status: string;
  /** Account status (e.g., "Loyal") */
  accountStatus: string;
  /** Type of property */
  propertyType: string;
  /** Monthly recurring revenue */
  mrr: number;
  /** Currency code */
  currency: string;
  /** Array of connected channels */
  channels: string[];
  /** Calculated health score (0-100) */
  healthScore: number;
  /** Health classification: "healthy", "at-risk", or "critical" */
  healthClassification: string;
}

/**
 * Lightweight customer data for lists and search results.
 * Contains only essential fields for display in tables/lists.
 */
export interface CustomerSummaryDTO {
  /** Customer ID */
  id: string;
  /** Account owner name */
  accountOwner: string;
  /** Status: "Active Customer" or "Inactive Customer" */
  status: string;
  /** Account type: "Pro" or "Starter" */
  accountType: string;
  /** Health score value (0-100) */
  healthScore: number;
  /** Health classification: "healthy", "at-risk", or "critical" */
  healthClassification: string;
  /** Monthly recurring revenue */
  mrr: number;
  /** Number of connected channels */
  channelCount: number;
}
