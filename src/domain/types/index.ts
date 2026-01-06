// Domain Types (Result, errors, etc.)

export {
  type AnyDomainError,
  CsvParseError,
  CustomerNotFoundError,
  type DomainError,
  DuplicateCustomerError,
  ErrorCode,
  ImportError,
  InvalidCustomerIdError,
  InvalidHealthScoreError,
  InvalidMrrError,
  isDomainError,
  isErrorCode,
  ValidationError,
} from './errors';
