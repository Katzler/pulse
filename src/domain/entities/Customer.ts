import { type AccountType, CustomerStatus, type Result } from '@shared/types';

/**
 * Error thrown when Customer entity validation fails
 */
export class CustomerValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CustomerValidationError';
  }
}

/**
 * Properties required to create a Customer entity
 */
export interface CustomerProps {
  /** Unique customer identifier */
  id: string;
  /** Name of the account owner/CSM */
  accountOwner: string;
  /** Account/company name */
  accountName: string;
  /** Timestamp of last login (null if never logged in) */
  latestLogin: Date | null;
  /** Account creation date */
  createdDate: Date;
  /** Last customer success contact date (null if never contacted) */
  lastCsContactDate: Date | null;
  /** Customer's billing country */
  billingCountry: string;
  /** Account tier: Pro or Starter */
  accountType: AccountType;
  /** Array of preferred languages */
  languages: string[];
  /** Active or Inactive status */
  status: CustomerStatus;
  /** Loyalty status (e.g., Loyal) */
  accountStatus: string;
  /** Type of property (Hotels, B&B, etc.) */
  propertyType: string;
  /** MRR currency code */
  currency: string;
  /** Monthly recurring revenue */
  mrr: number;
  /** Array of connected distribution channels */
  channels: string[];
}

/**
 * Customer entity representing a customer in the system.
 *
 * This is a rich domain entity that encapsulates customer data
 * and business rules. It is immutable after creation.
 *
 * @example
 * ```ts
 * const result = Customer.create({
 *   id: 'CUST-001',
 *   accountOwner: 'John Smith',
 *   // ... other props
 * });
 *
 * if (result.success) {
 *   const customer = result.value;
 *   console.log(customer.isActive());
 * }
 * ```
 */
export class Customer {
  readonly id: string;
  readonly accountOwner: string;
  readonly accountName: string;
  readonly latestLogin: Date | null;
  readonly createdDate: Date;
  readonly lastCsContactDate: Date | null;
  readonly billingCountry: string;
  readonly accountType: AccountType;
  readonly languages: readonly string[];
  readonly status: CustomerStatus;
  readonly accountStatus: string;
  readonly propertyType: string;
  readonly currency: string;
  readonly mrr: number;
  readonly channels: readonly string[];

  private constructor(
    id: string,
    accountOwner: string,
    accountName: string,
    latestLogin: Date | null,
    createdDate: Date,
    lastCsContactDate: Date | null,
    billingCountry: string,
    accountType: AccountType,
    languages: readonly string[],
    status: CustomerStatus,
    accountStatus: string,
    propertyType: string,
    currency: string,
    mrr: number,
    channels: readonly string[]
  ) {
    this.id = id;
    this.accountOwner = accountOwner;
    this.accountName = accountName;
    this.latestLogin = latestLogin;
    this.createdDate = createdDate;
    this.lastCsContactDate = lastCsContactDate;
    this.billingCountry = billingCountry;
    this.accountType = accountType;
    this.languages = languages;
    this.status = status;
    this.accountStatus = accountStatus;
    this.propertyType = propertyType;
    this.currency = currency;
    this.mrr = mrr;
    this.channels = channels;

    // Freeze arrays to ensure immutability
    Object.freeze(this.languages);
    Object.freeze(this.channels);
  }

  /**
   * Factory method to create a Customer entity with validation.
   * Returns a Result type for explicit error handling.
   */
  static create(props: CustomerProps): Result<Customer, CustomerValidationError> {
    // Validate customer ID
    if (!props.id || props.id.trim().length === 0) {
      return {
        success: false,
        error: new CustomerValidationError('Customer ID must be a non-empty string'),
      };
    }

    // Validate MRR
    if (props.mrr < 0) {
      return {
        success: false,
        error: new CustomerValidationError('MRR must be a non-negative number'),
      };
    }

    // Validate login date is not before created date (only if logged in)
    if (props.latestLogin !== null && props.latestLogin < props.createdDate) {
      return {
        success: false,
        error: new CustomerValidationError(
          'Latest login date cannot be before account created date'
        ),
      };
    }

    const customer = new Customer(
      props.id.trim(),
      props.accountOwner,
      props.accountName,
      props.latestLogin,
      props.createdDate,
      props.lastCsContactDate,
      props.billingCountry,
      props.accountType,
      [...props.languages],
      props.status,
      props.accountStatus,
      props.propertyType,
      props.currency,
      props.mrr,
      [...props.channels]
    );

    return {
      success: true,
      value: customer,
    };
  }

  /**
   * Returns true if the customer has an active status
   */
  isActive(): boolean {
    return this.status === CustomerStatus.Active;
  }

  /**
   * Returns true if the customer has a Pro account
   */
  isPro(): boolean {
    return this.accountType === 'Pro';
  }

  /**
   * Calculates the number of days since the customer last logged in.
   * Returns null if the customer has never logged in.
   * @param referenceDate - The date to calculate from (defaults to now)
   */
  daysSinceLastLogin(referenceDate: Date = new Date()): number | null {
    if (this.latestLogin === null) {
      return null;
    }
    const diffMs = referenceDate.getTime() - this.latestLogin.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Returns true if the customer has ever logged in
   */
  hasLoggedIn(): boolean {
    return this.latestLogin !== null;
  }

  /**
   * Returns the number of connected channels
   */
  get channelCount(): number {
    return this.channels.length;
  }

  /**
   * Checks if the customer has a specific channel connected (case-insensitive)
   */
  hasChannel(channelName: string): boolean {
    const lowerChannel = channelName.toLowerCase();
    return this.channels.some((ch) => ch.toLowerCase() === lowerChannel);
  }

  /**
   * Compares two customers for equality based on their ID.
   * In DDD, entities are equal if they have the same identity.
   */
  equals(other: Customer): boolean {
    return this.id === other.id;
  }
}
