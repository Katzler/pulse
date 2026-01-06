import { describe, expect, it, vi } from 'vitest';

import { FileUploadHandler } from '../FileUploadHandler';

// Mock File class for Node.js test environment
function createMockFile(content: string, name: string, type: string = 'text/csv'): File {
  const blob = new Blob([content], { type });
  return new File([blob], name, { type, lastModified: Date.now() });
}

describe('FileUploadHandler', () => {
  const handler = new FileUploadHandler();

  describe('validateFile', () => {
    it('validates a valid CSV file', () => {
      const file = createMockFile('header1,header2\nvalue1,value2', 'test.csv');

      const result = handler.validateFile(file);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.name).toBe('test.csv');
        expect(result.value.size).toBeGreaterThan(0);
      }
    });

    it('rejects empty files', () => {
      const file = createMockFile('', 'empty.csv');

      const result = handler.validateFile(file);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('EMPTY_FILE');
      }
    });

    it('rejects files that are too large', () => {
      const largeContent = 'x'.repeat(1024); // 1KB content
      const file = createMockFile(largeContent, 'large.csv');

      const result = handler.validateFile(file, { maxSizeBytes: 100 });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('FILE_TOO_LARGE');
      }
    });

    it('rejects non-CSV files', () => {
      const file = createMockFile('content', 'image.png', 'image/png');

      const result = handler.validateFile(file);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_TYPE');
      }
    });

    it('accepts CSV files with text/plain MIME type', () => {
      const blob = new Blob(['header,value'], { type: 'text/plain' });
      const file = new File([blob], 'data.csv', { type: 'text/plain' });

      const result = handler.validateFile(file);

      expect(result.success).toBe(true);
    });

    it('accepts files with .csv extension regardless of MIME type', () => {
      const blob = new Blob(['header,value'], { type: '' });
      const file = new File([blob], 'data.csv', { type: '' });

      const result = handler.validateFile(file);

      expect(result.success).toBe(true);
    });

    it('returns file metadata on success', () => {
      const file = createMockFile('test content', 'test.csv');

      const result = handler.validateFile(file);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.name).toBe('test.csv');
        expect(result.value.type).toBe('text/csv');
        expect(result.value.lastModified).toBeInstanceOf(Date);
      }
    });
  });

  describe('readFile', () => {
    it('reads valid CSV file content', async () => {
      const csvContent = 'name,value\ntest,123';
      const file = createMockFile(csvContent, 'test.csv');

      const result = await handler.readFile(file);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.content).toBe(csvContent);
        expect(result.value.metadata.name).toBe('test.csv');
      }
    });

    it('returns error for invalid file', async () => {
      const file = createMockFile('', 'empty.csv');

      const result = await handler.readFile(file);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('EMPTY_FILE');
      }
    });
  });

  describe('readFileWithProgress', () => {
    it('calls progress callback', async () => {
      const csvContent = 'name,value\ntest,123';
      const file = createMockFile(csvContent, 'test.csv');
      const progressCallback = vi.fn();

      const result = await handler.readFileWithProgress(file, progressCallback);

      expect(result.success).toBe(true);
      // Progress should be called at least once (at 100%)
      expect(progressCallback).toHaveBeenCalledWith(100);
    });

    it('returns file content', async () => {
      const csvContent = 'header1,header2\nvalue1,value2';
      const file = createMockFile(csvContent, 'test.csv');

      const result = await handler.readFileWithProgress(file, () => {});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.content).toBe(csvContent);
      }
    });

    it('returns error for invalid file', async () => {
      const file = createMockFile('content', 'invalid.txt', 'text/html');

      const result = await handler.readFileWithProgress(file, () => {});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_TYPE');
      }
    });
  });

  describe('cancellation support', () => {
    it('returns CANCELLED when signal is already aborted for readFile', async () => {
      const file = createMockFile('name,value\ntest,123', 'test.csv');
      const controller = new AbortController();
      controller.abort();

      const result = await handler.readFile(file, { signal: controller.signal });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('CANCELLED');
        expect(result.error.message).toBe('File read was cancelled');
      }
    });

    it('returns CANCELLED when signal is already aborted for readFileWithProgress', async () => {
      const file = createMockFile('name,value\ntest,123', 'test.csv');
      const controller = new AbortController();
      controller.abort();

      const result = await handler.readFileWithProgress(file, () => {}, { signal: controller.signal });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('CANCELLED');
      }
    });

    it('completes normally when signal is not aborted', async () => {
      const csvContent = 'name,value\ntest,123';
      const file = createMockFile(csvContent, 'test.csv');
      const controller = new AbortController();

      const result = await handler.readFile(file, { signal: controller.signal });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.content).toBe(csvContent);
      }
    });

    it('can be cancelled mid-read for readFile', async () => {
      const csvContent = 'name,value\ntest,123';
      const file = createMockFile(csvContent, 'test.csv');
      const controller = new AbortController();

      // Start the read and abort immediately
      const resultPromise = handler.readFile(file, { signal: controller.signal });
      controller.abort();

      const result = await resultPromise;

      // Either completes successfully (if read finished before abort)
      // or returns CANCELLED (if abort happened in time)
      if (!result.success) {
        expect(result.error.code).toBe('CANCELLED');
      }
    });

    it('can be cancelled mid-read for readFileWithProgress', async () => {
      const csvContent = 'name,value\ntest,123';
      const file = createMockFile(csvContent, 'test.csv');
      const controller = new AbortController();

      // Start the read and abort immediately
      const resultPromise = handler.readFileWithProgress(file, () => {}, { signal: controller.signal });
      controller.abort();

      const result = await resultPromise;

      // Either completes successfully (if read finished before abort)
      // or returns CANCELLED (if abort happened in time)
      if (!result.success) {
        expect(result.error.code).toBe('CANCELLED');
      }
    });
  });
});
