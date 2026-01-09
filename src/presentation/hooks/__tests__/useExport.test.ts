import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { CustomerDTO } from '@application/dtos';
import { useUIStore } from '@presentation/stores';

import { useExport } from '../useExport';

// Mock CsvExporter
vi.mock('@infrastructure/export', () => ({
  CsvExporter: {
    exportCustomers: vi.fn().mockReturnValue('csv,data,here'),
  },
}));

// Track download filename
let lastDownloadFilename: string | null = null;

// Mock URL methods
const mockCreateObjectURL = vi.fn().mockReturnValue('blob:test-url');
const mockRevokeObjectURL = vi.fn();

Object.defineProperty(globalThis, 'URL', {
  value: {
    createObjectURL: mockCreateObjectURL,
    revokeObjectURL: mockRevokeObjectURL,
  },
  writable: true,
});

// Store original createElement
const originalCreateElement = document.createElement.bind(document);

// Mock createElement to track anchor creation
vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
  const element = originalCreateElement(tagName);
  if (tagName === 'a') {
    // Wrap the click method to track downloads
    const originalClick = element.click.bind(element);
    element.click = () => {
      lastDownloadFilename = (element as HTMLAnchorElement).download;
      originalClick();
    };
  }
  return element;
});

describe('useExport', () => {
  const mockCustomers: CustomerDTO[] = [
    {
      id: '1',
      accountOwner: 'Test User',
      accountName: 'Acme Hotels',
      status: 'Active',
      accountType: 'Pro',
      accountStatus: 'Active',
      propertyType: 'Hotel',
      billingCountry: 'USA',
      mrr: 100,
      currency: 'USD',
      languages: ['English'],
      channels: ['Web'],
      createdDate: '2024-01-01',
      latestLogin: '2024-01-15',
      lastCsContactDate: '2024-01-10',
      healthScore: 85,
      healthClassification: 'healthy',
    },
    {
      id: '2',
      accountOwner: 'Test User 2',
      accountName: 'Budget Stays',
      status: 'Active',
      accountType: 'Starter',
      accountStatus: 'Active',
      propertyType: 'Hostel',
      billingCountry: 'UK',
      mrr: 50,
      currency: 'GBP',
      languages: ['English'],
      channels: ['Web'],
      createdDate: '2024-01-02',
      latestLogin: '2024-01-16',
      lastCsContactDate: null,
      healthScore: 72,
      healthClassification: 'healthy',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    lastDownloadFilename = null;
    // Reset UI store
    useUIStore.setState({ toasts: [] });
  });

  describe('basic functionality', () => {
    it('returns isExporting and handleExport', () => {
      const { result } = renderHook(() => useExport());

      expect(result.current.isExporting).toBe(false);
      expect(typeof result.current.handleExport).toBe('function');
    });

    it('initially not exporting', () => {
      const { result } = renderHook(() => useExport());

      expect(result.current.isExporting).toBe(false);
    });
  });

  describe('CSV export', () => {
    it('exports customers to CSV', async () => {
      const { result } = renderHook(() => useExport());

      await act(async () => {
        await result.current.handleExport('csv', mockCustomers);
      });

      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(lastDownloadFilename).toContain('.csv');
    });

    it('shows success toast after CSV export', async () => {
      const { result } = renderHook(() => useExport());

      await act(async () => {
        await result.current.handleExport('csv', mockCustomers);
      });

      await waitFor(() => {
        const toasts = useUIStore.getState().toasts;
        expect(toasts.length).toBe(1);
        expect(toasts[0].type).toBe('success');
        expect(toasts[0].title).toBe('Export complete');
      });
    });

    it('includes customer count in toast message', async () => {
      const { result } = renderHook(() => useExport());

      await act(async () => {
        await result.current.handleExport('csv', mockCustomers);
      });

      await waitFor(() => {
        const toasts = useUIStore.getState().toasts;
        expect(toasts[0].message).toContain('2 customers');
      });
    });
  });

  describe('JSON export', () => {
    it('exports customers to JSON', async () => {
      const { result } = renderHook(() => useExport());

      await act(async () => {
        await result.current.handleExport('json', mockCustomers);
      });

      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(lastDownloadFilename).toContain('.json');
    });

    it('shows success toast after JSON export', async () => {
      const { result } = renderHook(() => useExport());

      await act(async () => {
        await result.current.handleExport('json', mockCustomers);
      });

      await waitFor(() => {
        const toasts = useUIStore.getState().toasts;
        expect(toasts.length).toBe(1);
        expect(toasts[0].type).toBe('success');
      });
    });
  });

  describe('Excel export', () => {
    it('falls back to CSV for Excel format', async () => {
      const { result } = renderHook(() => useExport());

      await act(async () => {
        await result.current.handleExport('xlsx', mockCustomers);
      });

      // Should fall back to CSV
      expect(lastDownloadFilename).toContain('.csv');
    });

    it('shows info toast about Excel fallback', async () => {
      const { result } = renderHook(() => useExport());

      await act(async () => {
        await result.current.handleExport('xlsx', mockCustomers);
      });

      await waitFor(() => {
        const toasts = useUIStore.getState().toasts;
        expect(toasts.length).toBe(1);
        expect(toasts[0].type).toBe('info');
        expect(toasts[0].title).toBe('Exported as CSV');
      });
    });
  });

  describe('empty data', () => {
    it('shows warning toast when no customers to export', async () => {
      const { result } = renderHook(() => useExport());

      await act(async () => {
        await result.current.handleExport('csv', []);
      });

      await waitFor(() => {
        const toasts = useUIStore.getState().toasts;
        expect(toasts.length).toBe(1);
        expect(toasts[0].type).toBe('warning');
        expect(toasts[0].title).toBe('No data to export');
      });
    });

    it('does not trigger download when no data', async () => {
      const { result } = renderHook(() => useExport());

      await act(async () => {
        await result.current.handleExport('csv', []);
      });

      expect(lastDownloadFilename).toBeNull();
    });
  });

  describe('filename options', () => {
    it('uses custom filename prefix', async () => {
      const { result } = renderHook(() =>
        useExport({ filenamePrefix: 'my-customers' })
      );

      await act(async () => {
        await result.current.handleExport('csv', mockCustomers);
      });

      expect(lastDownloadFilename).toContain('my-customers');
    });

    it('includes date in filename by default', async () => {
      const { result } = renderHook(() => useExport());

      await act(async () => {
        await result.current.handleExport('csv', mockCustomers);
      });

      // Should include date pattern YYYY-MM-DD
      expect(lastDownloadFilename).toMatch(/\d{4}-\d{2}-\d{2}/);
    });

    it('excludes date from filename when option is false', async () => {
      const { result } = renderHook(() =>
        useExport({ filenamePrefix: 'test', includeDateInFilename: false })
      );

      await act(async () => {
        await result.current.handleExport('csv', mockCustomers);
      });

      expect(lastDownloadFilename).toBe('test.csv');
    });
  });

  describe('singular/plural in message', () => {
    it('uses singular when one customer', async () => {
      const { result } = renderHook(() => useExport());

      await act(async () => {
        await result.current.handleExport('csv', [mockCustomers[0]]);
      });

      await waitFor(() => {
        const toasts = useUIStore.getState().toasts;
        expect(toasts[0].message).toContain('1 customer exported');
      });
    });
  });
});
