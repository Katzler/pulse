import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import type { ValidationError } from '@domain/types';

/**
 * Import workflow status
 */
export type ImportStatus = 'idle' | 'parsing' | 'validating' | 'importing' | 'complete' | 'error';

/**
 * Import result summary
 */
export interface ImportResultSummary {
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  skippedRows: number;
}

/**
 * Import state for managing CSV import workflow
 */
interface ImportState {
  /** Current import status */
  status: ImportStatus;
  /** Whether an import is in progress */
  isImporting: boolean;
  /** Import progress (0-100) */
  progress: number;
  /** Current step message */
  progressMessage: string | null;
  /** Import result summary */
  result: ImportResultSummary | null;
  /** Validation errors from import */
  errors: ValidationError[];
  /** Selected file name */
  fileName: string | null;
  /** File size in bytes */
  fileSize: number | null;
}

/**
 * Import actions for updating state
 */
interface ImportActions {
  /** Start a new import */
  startImport: (fileName: string, fileSize: number) => void;
  /** Update import progress */
  setProgress: (progress: number, message?: string) => void;
  /** Set import status */
  setStatus: (status: ImportStatus) => void;
  /** Complete import with result */
  completeImport: (result: ImportResultSummary) => void;
  /** Fail import with errors */
  failImport: (errors: ValidationError[]) => void;
  /** Add validation error */
  addError: (error: ValidationError) => void;
  /** Reset import state */
  resetImport: () => void;
}

const initialState: ImportState = {
  status: 'idle',
  isImporting: false,
  progress: 0,
  progressMessage: null,
  result: null,
  errors: [],
  fileName: null,
  fileSize: null,
};

/**
 * Zustand store for import workflow state.
 * Manages the CSV import process including progress tracking and error handling.
 *
 * @example
 * // Subscribe to import progress
 * const progress = useImportStore((state) => state.progress);
 * const status = useImportStore((state) => state.status);
 *
 * // Start an import
 * const { startImport, setProgress, completeImport } = useImportStore.getState();
 * startImport('customers.csv', 1024);
 * setProgress(50, 'Validating rows...');
 * completeImport({ totalRows: 100, successfulRows: 95, failedRows: 5, skippedRows: 0 });
 */
export const useImportStore = create<ImportState & ImportActions>()(
  devtools(
    (set) => ({
      ...initialState,

      startImport: (fileName, fileSize) =>
        set(
          {
            status: 'parsing',
            isImporting: true,
            progress: 0,
            progressMessage: 'Starting import...',
            result: null,
            errors: [],
            fileName,
            fileSize,
          },
          false,
          'startImport'
        ),

      setProgress: (progress, progressMessage) =>
        set({ progress, progressMessage: progressMessage ?? null }, false, 'setProgress'),

      setStatus: (status) =>
        set({ status }, false, 'setStatus'),

      completeImport: (result) =>
        set(
          {
            status: 'complete',
            isImporting: false,
            progress: 100,
            progressMessage: 'Import complete',
            result,
          },
          false,
          'completeImport'
        ),

      failImport: (errors) =>
        set(
          {
            status: 'error',
            isImporting: false,
            progressMessage: 'Import failed',
            errors,
          },
          false,
          'failImport'
        ),

      addError: (error) =>
        set(
          (state) => ({
            errors: [...state.errors, error],
          }),
          false,
          'addError'
        ),

      resetImport: () => set(initialState, false, 'resetImport'),
    }),
    { name: 'ImportStore' }
  )
);
