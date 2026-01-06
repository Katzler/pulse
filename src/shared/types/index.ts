// Shared TypeScript Types

// CSV data types
export {
  AccountType,
  CustomerStatus,
  CSV_HEADERS,
  type RawCustomerRecord,
} from './csv.types';

// Branded types for type safety
export {
  CustomerId,
  HealthScoreValue,
  MrrValue,
  CurrencyCode,
  type DateString,
  type DateTimeString,
} from './branded.types';

// Utility types
export {
  Result,
  type Nullable,
  type DeepPartial,
  type ElementOf,
  type RequireKeys,
  type Success,
  type Failure,
  type AsyncResult,
} from './utility.types';
