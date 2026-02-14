/**
 * Utility types for common patterns throughout the application
 */

/**
 * Result type for explicit error handling.
 * Follows the functional programming pattern of returning
 * either a success value or an error, never throwing.
 */
export type Result<T, E = Error> = Success<T> | Failure<E>;

export interface Success<T> {
  readonly success: true;
  readonly value: T;
}

export interface Failure<E> {
  readonly success: false;
  readonly error: E;
}

/**
 * Helper functions for creating Result types
 */
export const Result = {
  /**
   * Creates a successful result
   */
  ok: <T>(value: T): Success<T> => ({
    success: true,
    value,
  }),

  /**
   * Creates a failure result
   */
  fail: <E>(error: E): Failure<E> => ({
    success: false,
    error,
  }),

  /**
   * Type guard for success results
   */
  isOk: <T, E>(result: Result<T, E>): result is Success<T> => result.success,

  /**
   * Type guard for failure results
   */
  isFail: <T, E>(result: Result<T, E>): result is Failure<E> => !result.success,

  /**
   * Maps a successful result to a new value
   */
  map: <T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> => {
    if (result.success) {
      return Result.ok(fn(result.value));
    }
    return result;
  },

  /**
   * Unwraps a result, throwing if it's a failure
   */
  unwrap: <T, E>(result: Result<T, E>): T => {
    if (result.success) {
      return result.value;
    }
    throw result.error;
  },

  /**
   * Unwraps a result with a default value for failures
   */
  unwrapOr: <T, E>(result: Result<T, E>, defaultValue: T): T => {
    if (result.success) {
      return result.value;
    }
    return defaultValue;
  },

  /**
   * Chains Result-returning operations (flatMap/bind)
   * If the result is a success, applies fn to the value and returns the new Result.
   * If the result is a failure, returns the failure unchanged.
   */
  flatMap: <T, U, E>(result: Result<T, E>, fn: (value: T) => Result<U, E>): Result<U, E> => {
    if (result.success) {
      return fn(result.value);
    }
    return result;
  },

  /**
   * Pattern matches on a Result, calling the appropriate handler
   */
  match: <T, E, U>(
    result: Result<T, E>,
    handlers: {
      success: (value: T) => U;
      failure: (error: E) => U;
    }
  ): U => {
    if (result.success) {
      return handlers.success(result.value);
    }
    return handlers.failure(result.error);
  },
};

/**
 * Async version of Result for promise-based operations
 */
export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;
