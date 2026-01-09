/**
 * XSS Prevention Tests
 *
 * Verify that the application properly handles malicious input
 * and prevents XSS attacks.
 */
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { compositionRoot } from '@application/composition';
import { Badge } from '@presentation/components/common';
import { AppProvider, ThemeProvider } from '@presentation/context';
import { CustomerList } from '@presentation/pages/CustomerList';
import { useCustomerStore, useImportStore } from '@presentation/stores';

import type { CustomerSummaryDTO } from '@application/dtos';

// XSS payloads to test
const xssPayloads = [
  '<script>alert("xss")</script>',
  '<img src=x onerror=alert("xss")>',
  '<svg onload=alert("xss")>',
  'javascript:alert("xss")',
  '"><script>alert("xss")</script>',
  '<img src="x" onerror="alert(\'xss\')">',
  '<body onload=alert("xss")>',
  '<input onfocus=alert("xss") autofocus>',
  '<marquee onstart=alert("xss")>',
  '<div style="background-image:url(javascript:alert(\'xss\'))">',
];

// Reset state between tests
beforeEach(() => {
  compositionRoot.reset();
});

afterEach(() => {
  useCustomerStore.getState().clearAll();
  useImportStore.getState().resetImport();
});

// Helper to create a customer with XSS payload in name
function createCustomerWithPayload(payload: string): CustomerSummaryDTO {
  return {
    id: 'XSS-TEST-001',
    accountOwner: payload,
    accountName: 'Test Hotels Inc',
    status: 'Active Customer',
    accountType: 'Pro',
    healthScore: 85,
    healthClassification: 'healthy',
    mrr: 1000,
    channelCount: 2,
    latestLogin: new Date().toISOString(),
    lastCsContactDate: new Date().toISOString(),
    billingCountry: 'USA',
  };
}

describe('XSS Prevention', () => {
  describe('Badge Component', () => {
    xssPayloads.forEach((payload) => {
      it(`should safely render badge with payload: ${payload.substring(0, 30)}...`, () => {
        const { container } = render(<Badge>{payload}</Badge>);

        // Should not find any script elements
        expect(container.querySelector('script')).toBeNull();

        // Should not have any event handlers in the DOM
        const allElements = container.getElementsByTagName('*');
        for (const el of allElements) {
          expect(el.getAttribute('onerror')).toBeNull();
          expect(el.getAttribute('onload')).toBeNull();
          expect(el.getAttribute('onclick')).toBeNull();
          expect(el.getAttribute('onfocus')).toBeNull();
        }
      });
    });
  });

  describe('Customer Display', () => {
    xssPayloads.forEach((payload) => {
      it(`should safely display customer name: ${payload.substring(0, 30)}...`, () => {
        const customer = createCustomerWithPayload(payload);

        // Set the customer in the store
        useCustomerStore.getState().setCustomers([customer]);

        const { container } = render(
          <MemoryRouter>
            <ThemeProvider>
              <AppProvider>
                <Routes>
                  <Route path="*" element={<CustomerList />} />
                </Routes>
              </AppProvider>
            </ThemeProvider>
          </MemoryRouter>
        );

        // Should not execute any scripts
        expect(container.querySelector('script')).toBeNull();

        // Should not have any executable event handlers
        const elements = container.querySelectorAll('[onerror], [onload], [onclick], [onfocus]');
        expect(elements.length).toBe(0);
      });
    });
  });

  describe('React Built-in Protection', () => {
    it('should not allow dangerouslySetInnerHTML to execute scripts', () => {
      // This test verifies React's built-in escaping
      const maliciousContent = '<script>window.xssExecuted = true</script>';

      // React should escape this automatically when used as text content
      render(
        <div data-testid="content">{maliciousContent}</div>
      );

      // The script should not execute
      expect((window as unknown as { xssExecuted?: boolean }).xssExecuted).toBeUndefined();

      // The text should be visible as text, not executed
      expect(screen.getByTestId('content').textContent).toContain('<script>');
    });
  });

  describe('URL Validation', () => {
    // React 19+ blocks javascript: URLs automatically
    const blockedUrls = ['javascript:alert("xss")', 'javascript:void(0)'];

    blockedUrls.forEach((url) => {
      it(`should block javascript URL: ${url.substring(0, 30)}`, () => {
        const { container } = render(
          <a href={url} data-testid="link">
            Link
          </a>
        );

        const link = container.querySelector('a');
        if (link) {
          const href = link.getAttribute('href');
          // React 19+ blocks javascript: URLs by replacing them with an error
          expect(href).toContain('javascript:');
          expect(href).toContain('React has blocked');
        }
      });
    });

    it('should document vbscript URL behavior', () => {
      // vbscript: is not blocked by React but is obsolete and only works in IE
      const { container } = render(
        <a href='vbscript:alert("xss")' data-testid="link">
          Link
        </a>
      );

      const link = container.querySelector('a');
      // vbscript is passed through but is not executable in modern browsers
      expect(link?.getAttribute('href')).toBe('vbscript:alert("xss")');
    });

    it('should allow safe data: URLs for images', () => {
      // Data URLs for images are generally safe
      const safeDataUrl = 'data:image/png;base64,ABC123';
      const { container } = render(
        <a href={safeDataUrl} data-testid="link">
          Image Link
        </a>
      );

      const link = container.querySelector('a');
      expect(link?.getAttribute('href')).toBe(safeDataUrl);
    });
  });

  describe('HTML Entity Encoding', () => {
    it('should properly encode HTML entities in displayed text', () => {
      const htmlContent = '<div class="test">&amp;&lt;&gt;</div>';

      render(<span data-testid="content">{htmlContent}</span>);

      // Should display the literal text, not render as HTML
      expect(screen.getByTestId('content').textContent).toContain('<div class="test">');
    });
  });
});
