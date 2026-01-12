// Shared TypeScript Types

// CSV data types
export {
  AccountType,
  CSV_HEADERS,
  CustomerStatus,
  PropertyType,
  type RawCustomerRecord,
  type RawSentimentRecord,
  SENTIMENT_CSV_HEADERS,
} from './csv.types';

// Branded types for type safety
export {
  CurrencyCode,
  CustomerId,
  type DateString,
  type DateTimeString,
  HealthScoreValue,
  MrrValue,
} from './branded.types';

// Utility types
export {
  type AsyncResult,
  type DeepPartial,
  type ElementOf,
  type Failure,
  type Nullable,
  type Optional,
  type RequireKeys,
  Result,
  type Success,
} from './utility.types';
