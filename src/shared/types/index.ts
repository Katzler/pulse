// Shared TypeScript Types

// CSV data types
export {
  AccountType,
  CSV_HEADERS,
  CustomerStatus,
  PropertyType,
  type RawCustomerRecord,
} from './csv.types';

// Branded types for type safety
export {
  CustomerId,
  HealthScoreValue,
  MrrValue,
} from './branded.types';

// Utility types
export {
  type AsyncResult,
  type Failure,
  Result,
  type Success,
} from './utility.types';
