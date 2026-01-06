import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useFileUpload } from '../useFileUpload';

function createMockFile(name: string, size: number, type: string): File {
  const content = new Array(size).fill('a').join('');
  return new File([content], name, { type });
}

function createMockFileEvent(file: File): React.ChangeEvent<HTMLInputElement> {
  return {
    target: {
      files: [file] as unknown as FileList,
      value: 'C:\\fakepath\\' + file.name,
    },
  } as React.ChangeEvent<HTMLInputElement>;
}

function createMockDragEvent(files: File[]): React.DragEvent<HTMLElement> {
  return {
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    dataTransfer: {
      files: files as unknown as FileList,
      items: files.map(() => ({})) as unknown as DataTransferItemList,
    },
  } as unknown as React.DragEvent<HTMLElement>;
}

describe('useFileUpload', () => {
  describe('initial state', () => {
    it('has default state values', () => {
      const { result } = renderHook(() => useFileUpload());

      expect(result.current.file).toBeNull();
      expect(result.current.isProcessing).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.isDragActive).toBe(false);
    });

    it('has inputRef', () => {
      const { result } = renderHook(() => useFileUpload());

      expect(result.current.inputRef).toBeDefined();
    });
  });

  describe('handleFileSelect', () => {
    it('selects valid file', () => {
      const onFileSelect = vi.fn();
      const { result } = renderHook(() =>
        useFileUpload({ onFileSelect })
      );

      const file = createMockFile('test.csv', 1024, 'text/csv');
      const event = createMockFileEvent(file);

      act(() => {
        result.current.handleFileSelect(event);
      });

      expect(result.current.file).toBe(file);
      expect(result.current.error).toBeNull();
      expect(onFileSelect).toHaveBeenCalledWith(file);
    });

    it('rejects file exceeding max size', () => {
      const onError = vi.fn();
      const { result } = renderHook(() =>
        useFileUpload({ maxSize: 1000, onError })
      );

      const file = createMockFile('large.csv', 2000, 'text/csv');
      const event = createMockFileEvent(file);

      act(() => {
        result.current.handleFileSelect(event);
      });

      expect(result.current.file).toBeNull();
      expect(result.current.error).toContain('size exceeds');
      expect(onError).toHaveBeenCalled();
    });

    it('rejects file with wrong type', () => {
      const onError = vi.fn();
      const { result } = renderHook(() =>
        useFileUpload({ accept: '.csv', onError })
      );

      const file = createMockFile('test.txt', 1024, 'text/plain');
      const event = createMockFileEvent(file);

      act(() => {
        result.current.handleFileSelect(event);
      });

      expect(result.current.file).toBeNull();
      expect(result.current.error).toContain('not accepted');
      expect(onError).toHaveBeenCalled();
    });

    it('accepts file with matching extension', () => {
      const { result } = renderHook(() => useFileUpload({ accept: '.csv' }));

      const file = createMockFile('data.csv', 1024, 'text/csv');
      const event = createMockFileEvent(file);

      act(() => {
        result.current.handleFileSelect(event);
      });

      expect(result.current.file).toBe(file);
      expect(result.current.error).toBeNull();
    });

    it('accepts file with matching MIME type', () => {
      const { result } = renderHook(() => useFileUpload({ accept: 'text/csv' }));

      const file = createMockFile('data.csv', 1024, 'text/csv');
      const event = createMockFileEvent(file);

      act(() => {
        result.current.handleFileSelect(event);
      });

      expect(result.current.file).toBe(file);
    });

    it('uses custom validator', () => {
      const validator = vi.fn().mockReturnValue({
        isValid: false,
        error: 'Custom validation failed',
      });

      const { result } = renderHook(() => useFileUpload({ validator }));

      const file = createMockFile('test.csv', 1024, 'text/csv');
      const event = createMockFileEvent(file);

      act(() => {
        result.current.handleFileSelect(event);
      });

      expect(validator).toHaveBeenCalledWith(file);
      expect(result.current.error).toBe('Custom validation failed');
    });
  });

  describe('drag and drop', () => {
    it('sets isDragActive on dragEnter', () => {
      const { result } = renderHook(() => useFileUpload());

      const event = createMockDragEvent([createMockFile('test.csv', 1024, 'text/csv')]);

      act(() => {
        result.current.handleDragEnter(event);
      });

      expect(result.current.isDragActive).toBe(true);
    });

    it('clears isDragActive on dragLeave', () => {
      const { result } = renderHook(() => useFileUpload());

      const event = createMockDragEvent([createMockFile('test.csv', 1024, 'text/csv')]);

      act(() => {
        result.current.handleDragEnter(event);
        result.current.handleDragLeave(event);
      });

      expect(result.current.isDragActive).toBe(false);
    });

    it('handles nested drag enter/leave', () => {
      const { result } = renderHook(() => useFileUpload());

      const event = createMockDragEvent([createMockFile('test.csv', 1024, 'text/csv')]);

      act(() => {
        result.current.handleDragEnter(event);
        result.current.handleDragEnter(event); // Nested enter
      });

      expect(result.current.isDragActive).toBe(true);

      act(() => {
        result.current.handleDragLeave(event); // One leave
      });

      expect(result.current.isDragActive).toBe(true);

      act(() => {
        result.current.handleDragLeave(event); // Second leave
      });

      expect(result.current.isDragActive).toBe(false);
    });

    it('processes file on drop', () => {
      const onFileSelect = vi.fn();
      const { result } = renderHook(() => useFileUpload({ onFileSelect }));

      const file = createMockFile('dropped.csv', 1024, 'text/csv');
      const event = createMockDragEvent([file]);

      act(() => {
        result.current.handleDragEnter(event);
        result.current.handleDrop(event);
      });

      expect(result.current.file).toBe(file);
      expect(result.current.isDragActive).toBe(false);
      expect(onFileSelect).toHaveBeenCalledWith(file);
    });

    it('prevents default on dragOver', () => {
      const { result } = renderHook(() => useFileUpload());

      const event = createMockDragEvent([]);

      act(() => {
        result.current.handleDragOver(event);
      });

      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });
  });

  describe('clearFile', () => {
    it('resets state', () => {
      const { result } = renderHook(() => useFileUpload());

      const file = createMockFile('test.csv', 1024, 'text/csv');
      const event = createMockFileEvent(file);

      act(() => {
        result.current.handleFileSelect(event);
      });

      expect(result.current.file).toBe(file);

      act(() => {
        result.current.clearFile();
      });

      expect(result.current.file).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.isProcessing).toBe(false);
    });
  });

  describe('setProcessing', () => {
    it('updates processing state', () => {
      const { result } = renderHook(() => useFileUpload());

      act(() => {
        result.current.setProcessing(true);
      });

      expect(result.current.isProcessing).toBe(true);

      act(() => {
        result.current.setProcessing(false);
      });

      expect(result.current.isProcessing).toBe(false);
    });
  });

  describe('setError', () => {
    it('sets error message', () => {
      const { result } = renderHook(() => useFileUpload());

      act(() => {
        result.current.setError('Something went wrong');
      });

      expect(result.current.error).toBe('Something went wrong');

      act(() => {
        result.current.setError(null);
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('openFileDialog', () => {
    it('clicks input element', () => {
      const { result } = renderHook(() => useFileUpload());

      const mockClick = vi.fn();
      // @ts-expect-error - accessing ref internal
      result.current.inputRef.current = { click: mockClick };

      act(() => {
        result.current.openFileDialog();
      });

      expect(mockClick).toHaveBeenCalled();
    });
  });
});
