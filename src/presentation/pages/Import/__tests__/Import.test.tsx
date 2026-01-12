import { MemoryRouter } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppProvider } from '@presentation/context';
import { useCustomerStore, useUIStore } from '@presentation/stores';

import { Import } from '../Import';

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock CsvParser as a class
const mockParseFile = vi.fn();
const mockSentimentParseFile = vi.fn();
vi.mock('@infrastructure/csv', () => ({
  CsvParser: class MockCsvParser {
    parseFile = mockParseFile;
  },
  SentimentCsvParser: class MockSentimentCsvParser {
    parseFile = mockSentimentParseFile;
  },
}));

// Mock ImportCustomersUseCase as a class
const mockExecute = vi.fn();
vi.mock('@application/use-cases', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@application/use-cases')>();
  return {
    ...actual,
    ImportCustomersUseCase: class MockImportCustomersUseCase {
      execute = mockExecute;
    },
  };
});

// Mock domain services as a class
vi.mock('@domain/services', () => ({
  HealthScoreCalculator: class MockHealthScoreCalculator {
    calculate = vi.fn().mockReturnValue({ success: true, value: { value: 75 } });
  },
}));

// Mock infrastructure repositories as a class
vi.mock('@infrastructure/repositories', () => ({
  InMemoryCustomerRepository: class MockInMemoryCustomerRepository {
    addMany = vi.fn().mockReturnValue({
      success: true,
      value: { successCount: 1, failedCount: 0, errors: [] },
    });
    getAll = vi.fn().mockReturnValue([]);
    setHealthScoreCalculator = vi.fn();
  },
  InMemorySentimentRepository: class MockInMemorySentimentRepository {
    addMany = vi.fn().mockReturnValue({
      success: true,
      value: { successCount: 0, failedCount: 0, skippedCount: 0, customersUpdated: [] },
    });
    getByCustomerId = vi.fn().mockReturnValue([]);
    getSummaryByCustomerId = vi.fn().mockReturnValue({ success: false, error: { type: 'SENTIMENT_NOT_FOUND', message: 'Not found', details: { customerId: '' } } });
    getCustomerIdsWithSentiment = vi.fn().mockReturnValue([]);
    hasSentimentData = vi.fn().mockReturnValue(false);
    count = vi.fn().mockReturnValue(0);
    clear = vi.fn();
    clearByCustomerId = vi.fn();
  },
}));

// Mock HealthScoreClassification enum
vi.mock('@domain/value-objects', () => ({
  HealthScoreClassification: {
    Healthy: 'healthy',
    AtRisk: 'at-risk',
    Critical: 'critical',
  },
}));

function renderImport() {
  return render(
    <AppProvider>
      <MemoryRouter>
        <Import />
      </MemoryRouter>
    </AppProvider>
  );
}

describe('Import', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useUIStore.setState({ toasts: [] });
    useCustomerStore.setState({ customers: [] });

    // Setup default successful mock responses
    mockParseFile.mockResolvedValue({
      success: true,
      value: {
        records: [
          {
            'Sirvoy Customer ID': 'CUST-001',
            'Account Owner': 'John Smith',
            'Latest Login': '15/01/2024, 10:00',
            'Created Date': '01/01/2023',
            'Billing Country': 'Sweden',
            'Account Type': 'Pro',
            Language: 'English',
            Status: 'Active Customer',
            'Sirvoy Account Status': 'Loyal',
            'Property Type': 'Hotels',
            'MRR (converted) Currency': 'SEK',
            'MRR (converted)': '1500',
            Channels: 'Booking.com',
          },
        ],
        totalRows: 1,
        successfulRows: 1,
        errors: [],
      },
    });

    mockExecute.mockReturnValue({
      success: true,
      value: {
        success: true,
        totalRows: 1,
        importedCount: 1,
        errorCount: 0,
        errors: [],
        healthScores: new Map(),
      },
    });
  });

  describe('initial render', () => {
    it('renders page title', () => {
      renderImport();

      expect(screen.getByRole('heading', { name: /import data/i })).toBeInTheDocument();
    });

    it('renders page description', () => {
      renderImport();

      expect(screen.getByText(/upload csv files to import customer and sentiment data/i)).toBeInTheDocument();
    });

    it('renders file upload component', () => {
      renderImport();

      expect(screen.getByText(/upload customer csv file/i)).toBeInTheDocument();
    });

    it('renders expected CSV format section', () => {
      renderImport();

      expect(screen.getByText(/expected customer csv format/i)).toBeInTheDocument();
    });

    it('displays expected column headers', () => {
      renderImport();

      expect(screen.getByText('Account Owner')).toBeInTheDocument();
      expect(screen.getByText('Sirvoy Customer ID')).toBeInTheDocument();
      expect(screen.getByText('MRR (converted)')).toBeInTheDocument();
    });

    it('does not show import button initially', () => {
      renderImport();

      expect(screen.queryByRole('button', { name: /import data/i })).not.toBeInTheDocument();
    });
  });

  describe('file selection', () => {
    it('shows import button after file selection', async () => {
      const user = userEvent.setup();
      renderImport();

      const file = new File(['test content'], 'test.csv', { type: 'text/csv' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /import data/i })).toBeInTheDocument();
      });
    });

    it('shows cancel button after file selection', async () => {
      const user = userEvent.setup();
      renderImport();

      const file = new File(['test content'], 'test.csv', { type: 'text/csv' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      });
    });
  });

  describe('import process', () => {
    it('shows success result after successful import', async () => {
      const user = userEvent.setup();
      renderImport();

      const file = new File(['test content'], 'test.csv', { type: 'text/csv' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /import data/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /import data/i }));

      await waitFor(() => {
        expect(screen.getByText(/import successful/i)).toBeInTheDocument();
        expect(screen.getByText(/1 of 1 customers imported/i)).toBeInTheDocument();
      });
    });

    it('shows navigation buttons after successful import', async () => {
      const user = userEvent.setup();
      renderImport();

      const file = new File(['test content'], 'test.csv', { type: 'text/csv' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /import data/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /import data/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /view dashboard/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /view customers/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /import another file/i })).toBeInTheDocument();
      });
    });

    it('adds success toast after successful import', async () => {
      const user = userEvent.setup();
      renderImport();

      const file = new File(['test content'], 'test.csv', { type: 'text/csv' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /import data/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /import data/i }));

      await waitFor(() => {
        const toasts = useUIStore.getState().toasts;
        expect(toasts.length).toBeGreaterThan(0);
        expect(toasts.some((t) => t.type === 'success')).toBe(true);
      });
    });

    it('shows error when parse fails', async () => {
      mockParseFile.mockResolvedValue({
        success: false,
        error: {
          row: 1,
          message: 'Invalid CSV headers',
          code: 'INVALID_HEADERS',
        },
      });

      const user = userEvent.setup();
      renderImport();

      const file = new File(['test content'], 'test.csv', { type: 'text/csv' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /import data/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /import data/i }));

      await waitFor(() => {
        expect(screen.getByText(/import failed/i)).toBeInTheDocument();
      });
    });

    it('shows partial success with errors', async () => {
      mockExecute.mockReturnValue({
        success: true,
        value: {
          success: false,
          totalRows: 3,
          importedCount: 2,
          errorCount: 1,
          errors: [{ row: 3, field: 'Status', message: 'Required field is missing' }],
          healthScores: new Map(),
        },
      });

      const user = userEvent.setup();
      renderImport();

      const file = new File(['test content'], 'test.csv', { type: 'text/csv' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /import data/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /import data/i }));

      await waitFor(() => {
        expect(screen.getByText(/import completed with errors/i)).toBeInTheDocument();
        expect(screen.getByText(/2 of 3 customers imported/i)).toBeInTheDocument();
      });
    });

    it('displays error details table', async () => {
      mockExecute.mockReturnValue({
        success: true,
        value: {
          success: false,
          totalRows: 2,
          importedCount: 1,
          errorCount: 1,
          errors: [{ row: 2, field: 'Status', message: 'Required field is missing' }],
          healthScores: new Map(),
        },
      });

      const user = userEvent.setup();
      renderImport();

      const file = new File(['test content'], 'test.csv', { type: 'text/csv' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /import data/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /import data/i }));

      await waitFor(() => {
        expect(screen.getByText(/import errors/i)).toBeInTheDocument();
        expect(screen.getByText('Required field is missing')).toBeInTheDocument();
      });
    });
  });

  describe('navigation', () => {
    it('navigates to dashboard when clicking View Dashboard', async () => {
      const user = userEvent.setup();
      renderImport();

      const file = new File(['test content'], 'test.csv', { type: 'text/csv' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /import data/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /import data/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /view dashboard/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /view dashboard/i }));

      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('navigates to customers when clicking View Customers', async () => {
      const user = userEvent.setup();
      renderImport();

      const file = new File(['test content'], 'test.csv', { type: 'text/csv' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /import data/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /import data/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /view customers/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /view customers/i }));

      expect(mockNavigate).toHaveBeenCalledWith('/customers');
    });
  });

  describe('reset functionality', () => {
    it('resets to initial state when clicking Import Another File', async () => {
      const user = userEvent.setup();
      renderImport();

      const file = new File(['test content'], 'test.csv', { type: 'text/csv' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /import data/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /import data/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /import another file/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /import another file/i }));

      // Should be back to initial state
      expect(screen.getByText(/upload customer csv file/i)).toBeInTheDocument();
      expect(screen.queryByText(/import successful/i)).not.toBeInTheDocument();
    });

    it('clears file selection when clicking Cancel', async () => {
      const user = userEvent.setup();
      renderImport();

      const file = new File(['test content'], 'test.csv', { type: 'text/csv' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      // Import button should be gone
      expect(screen.queryByRole('button', { name: /import data/i })).not.toBeInTheDocument();
    });
  });
});
