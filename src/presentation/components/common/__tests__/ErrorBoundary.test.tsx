import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  ChartErrorBoundary,
  ErrorBoundary,
  PageErrorBoundary,
  RootErrorBoundary,
  withErrorBoundary,
} from '../ErrorBoundary';

// Component that throws an error
function BuggyComponent({ shouldThrow = true }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>Working component</div>;
}

// Suppress console.error for expected errors in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('The above error occurred')
    ) {
      return;
    }
    originalError(...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

describe('ErrorBoundary', () => {
  describe('normal rendering', () => {
    it('renders children when no error', () => {
      render(
        <ErrorBoundary>
          <div>Child content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Child content')).toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('renders default fallback on error', () => {
      render(
        <ErrorBoundary>
          <BuggyComponent />
        </ErrorBoundary>
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Test error')).toBeInTheDocument();
    });

    it('renders custom fallback when provided', () => {
      render(
        <ErrorBoundary fallback={<div>Custom error UI</div>}>
          <BuggyComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom error UI')).toBeInTheDocument();
    });

    it('calls onError callback when error occurs', () => {
      const onError = vi.fn();

      render(
        <ErrorBoundary onError={onError}>
          <BuggyComponent />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      );
    });

    it('shows error message in fallback', () => {
      render(
        <ErrorBoundary>
          <BuggyComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Test error')).toBeInTheDocument();
    });
  });

  describe('retry functionality', () => {
    it('shows retry button by default', () => {
      render(
        <ErrorBoundary>
          <BuggyComponent />
        </ErrorBoundary>
      );

      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('hides retry button when showRetry is false', () => {
      render(
        <ErrorBoundary showRetry={false}>
          <BuggyComponent />
        </ErrorBoundary>
      );

      expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
    });

    it('resets error state when retry is clicked', async () => {
      const user = userEvent.setup();
      let shouldThrow = true;

      function ConditionalBuggy() {
        if (shouldThrow) {
          throw new Error('Test error');
        }
        return <div>Recovered</div>;
      }

      render(
        <ErrorBoundary>
          <ConditionalBuggy />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      // Fix the component before retry
      shouldThrow = false;

      await user.click(screen.getByRole('button', { name: /try again/i }));

      expect(screen.getByText('Recovered')).toBeInTheDocument();
    });
  });

  describe('resetKey functionality', () => {
    it('resets error state when resetKey changes', () => {
      let shouldThrow = true;

      function ConditionalBuggy() {
        if (shouldThrow) {
          throw new Error('Test error');
        }
        return <div>Recovered</div>;
      }

      const { rerender } = render(
        <ErrorBoundary resetKey="key1">
          <ConditionalBuggy />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      // Fix the component and change resetKey
      shouldThrow = false;

      rerender(
        <ErrorBoundary resetKey="key2">
          <ConditionalBuggy />
        </ErrorBoundary>
      );

      expect(screen.getByText('Recovered')).toBeInTheDocument();
    });
  });
});

describe('withErrorBoundary HOC', () => {
  it('wraps component with error boundary', () => {
    function TestComponent(): React.ReactElement {
      throw new Error('HOC test error');
    }

    const WrappedComponent = withErrorBoundary(TestComponent);

    render(<WrappedComponent />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('passes error boundary props', () => {
    function TestComponent(): React.ReactElement {
      throw new Error('HOC test error');
    }

    const WrappedComponent = withErrorBoundary(TestComponent, {
      showRetry: false,
    });

    render(<WrappedComponent />);

    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
  });

  it('passes through component props', () => {
    function TestComponent({ message }: { message: string }) {
      return <div>{message}</div>;
    }

    const WrappedComponent = withErrorBoundary(TestComponent);

    render(<WrappedComponent message="Hello" />);

    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('sets displayName correctly', () => {
    function MyComponent() {
      return <div>Test</div>;
    }

    const WrappedComponent = withErrorBoundary(MyComponent);

    expect(WrappedComponent.displayName).toBe('withErrorBoundary(MyComponent)');
  });
});

describe('RootErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      <RootErrorBoundary>
        <div>App content</div>
      </RootErrorBoundary>
    );

    expect(screen.getByText('App content')).toBeInTheDocument();
  });

  it('renders root fallback UI on error', () => {
    render(
      <RootErrorBoundary>
        <BuggyComponent />
      </RootErrorBoundary>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/We're sorry, but something unexpected happened/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /refresh page/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /go to dashboard/i })).toBeInTheDocument();
  });

  it('calls onError callback', () => {
    const onError = vi.fn();

    render(
      <RootErrorBoundary onError={onError}>
        <BuggyComponent />
      </RootErrorBoundary>
    );

    expect(onError).toHaveBeenCalledTimes(1);
  });
});

describe('PageErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      <PageErrorBoundary>
        <div>Page content</div>
      </PageErrorBoundary>
    );

    expect(screen.getByText('Page content')).toBeInTheDocument();
  });

  it('renders page fallback UI on error', () => {
    render(
      <PageErrorBoundary>
        <BuggyComponent />
      </PageErrorBoundary>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Page error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /go to dashboard/i })).toBeInTheDocument();
  });

  it('shows page name in error message', () => {
    render(
      <PageErrorBoundary pageName="Customer List">
        <BuggyComponent />
      </PageErrorBoundary>
    );

    expect(screen.getByText('Error loading Customer List')).toBeInTheDocument();
  });

  it('resets error state on retry', async () => {
    const user = userEvent.setup();
    let shouldThrow = true;

    function ConditionalBuggy() {
      if (shouldThrow) {
        throw new Error('Test page error message');
      }
      return <div>Page recovered</div>;
    }

    render(
      <PageErrorBoundary>
        <ConditionalBuggy />
      </PageErrorBoundary>
    );

    expect(screen.getByRole('heading', { name: 'Page error' })).toBeInTheDocument();

    shouldThrow = false;
    await user.click(screen.getByRole('button', { name: /try again/i }));

    expect(screen.getByText('Page recovered')).toBeInTheDocument();
  });

  it('resets on resetKey change', () => {
    let shouldThrow = true;

    function ConditionalBuggy() {
      if (shouldThrow) {
        throw new Error('Test page error message');
      }
      return <div>Page recovered</div>;
    }

    const { rerender } = render(
      <PageErrorBoundary resetKey="key1">
        <ConditionalBuggy />
      </PageErrorBoundary>
    );

    expect(screen.getByRole('heading', { name: 'Page error' })).toBeInTheDocument();

    shouldThrow = false;
    rerender(
      <PageErrorBoundary resetKey="key2">
        <ConditionalBuggy />
      </PageErrorBoundary>
    );

    expect(screen.getByText('Page recovered')).toBeInTheDocument();
  });
});

describe('ChartErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      <ChartErrorBoundary>
        <div>Chart content</div>
      </ChartErrorBoundary>
    );

    expect(screen.getByText('Chart content')).toBeInTheDocument();
  });

  it('renders chart fallback UI on error', () => {
    render(
      <ChartErrorBoundary>
        <BuggyComponent />
      </ChartErrorBoundary>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Chart could not be displayed')).toBeInTheDocument();
    expect(screen.getByText('There was a problem rendering this chart')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('resets error state on retry', async () => {
    const user = userEvent.setup();
    let shouldThrow = true;

    function ConditionalBuggy() {
      if (shouldThrow) {
        throw new Error('Chart error');
      }
      return <div>Chart recovered</div>;
    }

    render(
      <ChartErrorBoundary>
        <ConditionalBuggy />
      </ChartErrorBoundary>
    );

    expect(screen.getByText('Chart could not be displayed')).toBeInTheDocument();

    shouldThrow = false;
    await user.click(screen.getByRole('button', { name: /retry/i }));

    expect(screen.getByText('Chart recovered')).toBeInTheDocument();
  });

  it('resets on resetKey change', () => {
    let shouldThrow = true;

    function ConditionalBuggy() {
      if (shouldThrow) {
        throw new Error('Chart error');
      }
      return <div>Chart recovered</div>;
    }

    const { rerender } = render(
      <ChartErrorBoundary resetKey="key1">
        <ConditionalBuggy />
      </ChartErrorBoundary>
    );

    expect(screen.getByText('Chart could not be displayed')).toBeInTheDocument();

    shouldThrow = false;
    rerender(
      <ChartErrorBoundary resetKey="key2">
        <ConditionalBuggy />
      </ChartErrorBoundary>
    );

    expect(screen.getByText('Chart recovered')).toBeInTheDocument();
  });

  it('calls onError callback', () => {
    const onError = vi.fn();

    render(
      <ChartErrorBoundary onError={onError}>
        <BuggyComponent />
      </ChartErrorBoundary>
    );

    expect(onError).toHaveBeenCalledTimes(1);
  });
});
