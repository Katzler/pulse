import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { FileUpload } from '../FileUpload';

function createMockFile(name: string, size: number, type: string): File {
  const content = new Array(size).fill('a').join('');
  return new File([content], name, { type });
}

describe('FileUpload', () => {
  describe('rendering', () => {
    it('renders upload area with label', () => {
      render(<FileUpload label="Upload CSV" />);
      expect(screen.getByText('Upload CSV')).toBeInTheDocument();
    });

    it('renders helper text when provided', () => {
      render(<FileUpload helperText="CSV files only, max 10MB" />);
      expect(screen.getByText('CSV files only, max 10MB')).toBeInTheDocument();
    });

    it('renders drag and drop instructions', () => {
      render(<FileUpload />);
      expect(screen.getByText('Drag and drop or click to browse')).toBeInTheDocument();
    });

    it('has accessible button role', () => {
      render(<FileUpload label="Upload file" />);
      expect(screen.getByRole('button', { name: /upload file/i })).toBeInTheDocument();
    });
  });

  describe('file selection', () => {
    it('shows selected file info', async () => {
      const onFileSelect = vi.fn();
      render(<FileUpload onFileSelect={onFileSelect} />);

      const file = createMockFile('data.csv', 1024, 'text/csv');
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      // Simulate file selection
      Object.defineProperty(input, 'files', {
        value: [file],
      });
      fireEvent.change(input);

      expect(screen.getByText('data.csv')).toBeInTheDocument();
      expect(screen.getByText('1 KB')).toBeInTheDocument();
      expect(onFileSelect).toHaveBeenCalledWith(file);
    });

    it('shows remove button when file is selected', async () => {
      render(<FileUpload />);

      const file = createMockFile('test.csv', 512, 'text/csv');
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      Object.defineProperty(input, 'files', {
        value: [file],
      });
      fireEvent.change(input);

      expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument();
    });

    it('clears file when remove is clicked', async () => {
      const user = userEvent.setup();
      render(<FileUpload />);

      const file = createMockFile('test.csv', 512, 'text/csv');
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      Object.defineProperty(input, 'files', {
        value: [file],
      });
      fireEvent.change(input);

      expect(screen.getByText('test.csv')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /remove/i }));

      expect(screen.queryByText('test.csv')).not.toBeInTheDocument();
    });
  });

  describe('validation', () => {
    it('shows error for invalid file type', () => {
      const onError = vi.fn();
      render(<FileUpload accept=".csv" onError={onError} />);

      const file = createMockFile('test.txt', 512, 'text/plain');
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      Object.defineProperty(input, 'files', {
        value: [file],
      });
      fireEvent.change(input);

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(onError).toHaveBeenCalled();
    });

    it('shows error for file exceeding max size', () => {
      const onError = vi.fn();
      render(<FileUpload maxSize={1000} onError={onError} />);

      const file = createMockFile('large.csv', 2000, 'text/csv');
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      Object.defineProperty(input, 'files', {
        value: [file],
      });
      fireEvent.change(input);

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(onError).toHaveBeenCalled();
    });
  });

  describe('disabled state', () => {
    it('applies disabled styles', () => {
      render(<FileUpload disabled label="Upload file" />);

      const uploadArea = screen.getByRole('button', { name: /upload file/i });
      expect(uploadArea).toHaveAttribute('aria-disabled', 'true');
      expect(uploadArea).toHaveClass('cursor-not-allowed');
    });

    it('prevents file selection when disabled', () => {
      render(<FileUpload disabled />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      expect(input).toBeDisabled();
    });
  });

  describe('drag and drop', () => {
    it('shows drop indicator on drag enter', () => {
      render(<FileUpload label="Upload file" />);

      const uploadArea = screen.getByRole('button', { name: /upload file/i });

      fireEvent.dragEnter(uploadArea, {
        dataTransfer: {
          items: [{ kind: 'file' }],
        },
      });

      expect(screen.getByText('Drop the file here')).toBeInTheDocument();
    });

    it('hides drop indicator on drag leave', () => {
      render(<FileUpload label="Upload file" />);

      const uploadArea = screen.getByRole('button', { name: /upload file/i });

      fireEvent.dragEnter(uploadArea, {
        dataTransfer: {
          items: [{ kind: 'file' }],
        },
      });

      fireEvent.dragLeave(uploadArea);

      expect(screen.queryByText('Drop the file here')).not.toBeInTheDocument();
    });
  });

  describe('keyboard interaction', () => {
    it('is focusable with tabIndex', () => {
      render(<FileUpload label="Upload file" />);

      const uploadArea = screen.getByRole('button', { name: /upload file/i });
      uploadArea.focus();

      // Check that the upload area is focusable
      expect(uploadArea).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('file size formatting', () => {
    it('formats bytes correctly', () => {
      render(<FileUpload />);

      const file = createMockFile('tiny.csv', 500, 'text/csv');
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      Object.defineProperty(input, 'files', {
        value: [file],
      });
      fireEvent.change(input);

      expect(screen.getByText('500 Bytes')).toBeInTheDocument();
    });

    it('formats kilobytes correctly', () => {
      render(<FileUpload />);

      const file = createMockFile('small.csv', 2048, 'text/csv');
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      Object.defineProperty(input, 'files', {
        value: [file],
      });
      fireEvent.change(input);

      expect(screen.getByText('2 KB')).toBeInTheDocument();
    });

    it('formats megabytes correctly', () => {
      render(<FileUpload />);

      const file = createMockFile('medium.csv', 2 * 1024 * 1024, 'text/csv');
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      Object.defineProperty(input, 'files', {
        value: [file],
      });
      fireEvent.change(input);

      expect(screen.getByText('2 MB')).toBeInTheDocument();
    });
  });
});
