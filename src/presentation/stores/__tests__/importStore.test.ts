import { act } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { ErrorCode, type ValidationError } from '@domain/types';

import { useImportStore } from '../importStore';

describe('importStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    act(() => {
      useImportStore.getState().resetImport();
    });
  });

  describe('initial state', () => {
    it('has idle status', () => {
      expect(useImportStore.getState().status).toBe('idle');
    });

    it('has isImporting as false', () => {
      expect(useImportStore.getState().isImporting).toBe(false);
    });

    it('has zero progress', () => {
      expect(useImportStore.getState().progress).toBe(0);
    });

    it('has null progressMessage', () => {
      expect(useImportStore.getState().progressMessage).toBeNull();
    });

    it('has null result', () => {
      expect(useImportStore.getState().result).toBeNull();
    });

    it('has empty errors array', () => {
      expect(useImportStore.getState().errors).toEqual([]);
    });

    it('has null fileName', () => {
      expect(useImportStore.getState().fileName).toBeNull();
    });

    it('has null fileSize', () => {
      expect(useImportStore.getState().fileSize).toBeNull();
    });
  });

  describe('startImport', () => {
    it('initializes import state', () => {
      act(() => {
        useImportStore.getState().startImport('customers.csv', 1024);
      });

      const state = useImportStore.getState();
      expect(state.status).toBe('parsing');
      expect(state.isImporting).toBe(true);
      expect(state.progress).toBe(0);
      expect(state.progressMessage).toBe('Starting import...');
      expect(state.result).toBeNull();
      expect(state.errors).toEqual([]);
      expect(state.fileName).toBe('customers.csv');
      expect(state.fileSize).toBe(1024);
    });

    it('clears previous result and errors', () => {
      // First, complete an import with errors
      act(() => {
        useImportStore.getState().startImport('old.csv', 500);
        useImportStore.getState().addError({
          type: ErrorCode.VALIDATION_ERROR,
          message: 'Old error',
          details: {},
        });
        useImportStore.getState().completeImport({
          totalRows: 10,
          successfulRows: 8,
          failedRows: 2,
          skippedRows: 0,
        });
      });

      // Start a new import
      act(() => {
        useImportStore.getState().startImport('new.csv', 2048);
      });

      expect(useImportStore.getState().errors).toEqual([]);
      expect(useImportStore.getState().result).toBeNull();
    });
  });

  describe('setProgress', () => {
    it('updates progress value', () => {
      act(() => {
        useImportStore.getState().setProgress(50);
      });

      expect(useImportStore.getState().progress).toBe(50);
    });

    it('updates progress with message', () => {
      act(() => {
        useImportStore.getState().setProgress(75, 'Validating rows...');
      });

      expect(useImportStore.getState().progress).toBe(75);
      expect(useImportStore.getState().progressMessage).toBe('Validating rows...');
    });
  });

  describe('setStatus', () => {
    it('updates status', () => {
      act(() => {
        useImportStore.getState().setStatus('validating');
      });

      expect(useImportStore.getState().status).toBe('validating');
    });
  });

  describe('completeImport', () => {
    it('sets completion state with result', () => {
      act(() => {
        useImportStore.getState().startImport('customers.csv', 1024);
        useImportStore.getState().setProgress(50, 'Processing...');
        useImportStore.getState().completeImport({
          totalRows: 100,
          successfulRows: 95,
          failedRows: 5,
          skippedRows: 0,
        });
      });

      const state = useImportStore.getState();
      expect(state.status).toBe('complete');
      expect(state.isImporting).toBe(false);
      expect(state.progress).toBe(100);
      expect(state.progressMessage).toBe('Import complete');
      expect(state.result).toEqual({
        totalRows: 100,
        successfulRows: 95,
        failedRows: 5,
        skippedRows: 0,
      });
    });
  });

  describe('failImport', () => {
    it('sets error state with validation errors', () => {
      const errors: ValidationError[] = [
        {
          type: ErrorCode.VALIDATION_ERROR,
          message: 'Invalid health score',
          details: { row: 5, field: 'healthScore', value: 150 },
        },
        {
          type: ErrorCode.VALIDATION_ERROR,
          message: 'Missing customer name',
          details: { row: 10, field: 'name' },
        },
      ];

      act(() => {
        useImportStore.getState().startImport('customers.csv', 1024);
        useImportStore.getState().failImport(errors);
      });

      const state = useImportStore.getState();
      expect(state.status).toBe('error');
      expect(state.isImporting).toBe(false);
      expect(state.progressMessage).toBe('Import failed');
      expect(state.errors).toEqual(errors);
    });
  });

  describe('addError', () => {
    it('appends error to errors array', () => {
      const error1: ValidationError = {
        type: ErrorCode.VALIDATION_ERROR,
        message: 'Error 1',
        details: { row: 1 },
      };
      const error2: ValidationError = {
        type: ErrorCode.VALIDATION_ERROR,
        message: 'Error 2',
        details: { row: 2 },
      };

      act(() => {
        useImportStore.getState().addError(error1);
        useImportStore.getState().addError(error2);
      });

      expect(useImportStore.getState().errors).toHaveLength(2);
      expect(useImportStore.getState().errors[0]).toEqual(error1);
      expect(useImportStore.getState().errors[1]).toEqual(error2);
    });
  });

  describe('resetImport', () => {
    it('resets all state to initial values', () => {
      // Set up state
      act(() => {
        useImportStore.getState().startImport('customers.csv', 1024);
        useImportStore.getState().setProgress(50, 'Processing...');
        useImportStore.getState().addError({
          type: ErrorCode.VALIDATION_ERROR,
          message: 'Error',
          details: {},
        });
        useImportStore.getState().completeImport({
          totalRows: 100,
          successfulRows: 95,
          failedRows: 5,
          skippedRows: 0,
        });
      });

      // Reset
      act(() => {
        useImportStore.getState().resetImport();
      });

      const state = useImportStore.getState();
      expect(state.status).toBe('idle');
      expect(state.isImporting).toBe(false);
      expect(state.progress).toBe(0);
      expect(state.progressMessage).toBeNull();
      expect(state.result).toBeNull();
      expect(state.errors).toEqual([]);
      expect(state.fileName).toBeNull();
      expect(state.fileSize).toBeNull();
    });
  });

  describe('workflow scenarios', () => {
    it('handles successful import workflow', () => {
      // Start import
      act(() => {
        useImportStore.getState().startImport('customers.csv', 2048);
      });
      expect(useImportStore.getState().status).toBe('parsing');

      // Update progress
      act(() => {
        useImportStore.getState().setStatus('validating');
        useImportStore.getState().setProgress(25, 'Validating data...');
      });
      expect(useImportStore.getState().status).toBe('validating');

      // Continue progress
      act(() => {
        useImportStore.getState().setStatus('importing');
        useImportStore.getState().setProgress(75, 'Importing customers...');
      });
      expect(useImportStore.getState().status).toBe('importing');

      // Complete
      act(() => {
        useImportStore.getState().completeImport({
          totalRows: 50,
          successfulRows: 50,
          failedRows: 0,
          skippedRows: 0,
        });
      });
      expect(useImportStore.getState().status).toBe('complete');
      expect(useImportStore.getState().result?.successfulRows).toBe(50);
    });

    it('handles partial import with errors', () => {
      act(() => {
        useImportStore.getState().startImport('customers.csv', 1024);
        useImportStore.getState().setStatus('validating');
      });

      // Add errors during validation
      act(() => {
        useImportStore.getState().addError({
          type: ErrorCode.VALIDATION_ERROR,
          message: 'Invalid row',
          details: { row: 3 },
        });
        useImportStore.getState().addError({
          type: ErrorCode.VALIDATION_ERROR,
          message: 'Missing field',
          details: { row: 7 },
        });
      });

      // Complete with partial success
      act(() => {
        useImportStore.getState().completeImport({
          totalRows: 10,
          successfulRows: 8,
          failedRows: 2,
          skippedRows: 0,
        });
      });

      expect(useImportStore.getState().status).toBe('complete');
      expect(useImportStore.getState().errors).toHaveLength(2);
      expect(useImportStore.getState().result?.failedRows).toBe(2);
    });
  });
});
