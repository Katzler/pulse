/**
 * Branded types provide type safety for primitive values.
 * They prevent accidentally passing a raw string/number where
 * a specific domain type is expected.
 */

declare const brand: unique symbol;

/**
 * Creates a branded type by adding a unique symbol property
 */
type Brand<T, B> = T & { readonly [brand]: B };

/**
 * Unique identifier for a customer.
 * Corresponds to 'Sirvoy Customer ID' in the CSV.
 */
export type CustomerId = Brand<string, 'CustomerId'>;

/**
 * Health score value constrained to 0-100 range.
 * Used throughout the application for customer health metrics.
 */
export type HealthScoreValue = Brand<number, 'HealthScoreValue'>;

/**
 * Monthly recurring revenue value.
 * Always stored as a number after parsing from CSV.
 */
export type MrrValue = Brand<number, 'MrrValue'>;

/**
 * Type guard and constructor functions for branded types
 */
export const CustomerId = {
  create: (value: string): CustomerId => value as CustomerId,
  isValid: (value: string): boolean => value.length > 0,
};

export const HealthScoreValue = {
  create: (value: number): HealthScoreValue => {
    if (value < 0 || value > 100) {
      throw new Error(`Health score must be between 0 and 100, got ${value}`);
    }
    return value as HealthScoreValue;
  },
  isValid: (value: number): boolean => value >= 0 && value <= 100,
};

export const MrrValue = {
  create: (value: number): MrrValue => value as MrrValue,
  fromString: (value: string): MrrValue => {
    const parsed = parseFloat(value.replace(/[^0-9.-]/g, ''));
    return (isNaN(parsed) ? 0 : parsed) as MrrValue;
  },
};

