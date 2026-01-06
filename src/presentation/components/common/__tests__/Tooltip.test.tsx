import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Tooltip } from '../Tooltip';

describe('Tooltip', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('rendering', () => {
    it('renders children', () => {
      render(
        <Tooltip content="Tooltip text">
          <button>Hover me</button>
        </Tooltip>
      );

      expect(screen.getByRole('button', { name: 'Hover me' })).toBeInTheDocument();
    });

    it('does not show tooltip initially', () => {
      render(
        <Tooltip content="Tooltip text">
          <button>Hover me</button>
        </Tooltip>
      );

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
  });

  describe('mouse interaction', () => {
    it('shows tooltip on mouse enter after delay', async () => {
      render(
        <Tooltip content="Tooltip text" delay={200}>
          <button>Hover me</button>
        </Tooltip>
      );

      const button = screen.getByRole('button');
      fireEvent.mouseEnter(button);

      // Not visible immediately
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

      // Advance timer
      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(screen.getByRole('tooltip')).toBeInTheDocument();
      expect(screen.getByText('Tooltip text')).toBeInTheDocument();
    });

    it('hides tooltip on mouse leave', async () => {
      render(
        <Tooltip content="Tooltip text" delay={0}>
          <button>Hover me</button>
        </Tooltip>
      );

      const button = screen.getByRole('button');
      fireEvent.mouseEnter(button);

      act(() => {
        vi.advanceTimersByTime(0);
      });

      expect(screen.getByRole('tooltip')).toBeInTheDocument();

      fireEvent.mouseLeave(button);

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('cancels tooltip if mouse leaves before delay', () => {
      render(
        <Tooltip content="Tooltip text" delay={500}>
          <button>Hover me</button>
        </Tooltip>
      );

      const button = screen.getByRole('button');
      fireEvent.mouseEnter(button);

      act(() => {
        vi.advanceTimersByTime(200);
      });

      fireEvent.mouseLeave(button);

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
  });

  describe('focus interaction', () => {
    it('shows tooltip on focus', () => {
      render(
        <Tooltip content="Tooltip text" delay={0}>
          <button>Focus me</button>
        </Tooltip>
      );

      const button = screen.getByRole('button');
      fireEvent.focus(button);

      act(() => {
        vi.advanceTimersByTime(0);
      });

      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });

    it('hides tooltip on blur', () => {
      render(
        <Tooltip content="Tooltip text" delay={0}>
          <button>Focus me</button>
        </Tooltip>
      );

      const button = screen.getByRole('button');
      fireEvent.focus(button);

      act(() => {
        vi.advanceTimersByTime(0);
      });

      fireEvent.blur(button);

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
  });

  describe('keyboard interaction', () => {
    it('hides tooltip on Escape key', () => {
      render(
        <Tooltip content="Tooltip text" delay={0}>
          <button>Press Escape</button>
        </Tooltip>
      );

      const button = screen.getByRole('button');
      fireEvent.mouseEnter(button);

      act(() => {
        vi.advanceTimersByTime(0);
      });

      expect(screen.getByRole('tooltip')).toBeInTheDocument();

      // Get the wrapper div and fire keydown event
      const wrapper = button.parentElement!;
      fireEvent.keyDown(wrapper, { key: 'Escape' });

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
  });

  describe('positions', () => {
    it.each(['top', 'right', 'bottom', 'left'] as const)(
      'renders in %s position',
      (position) => {
        render(
          <Tooltip content="Tooltip text" position={position} delay={0}>
            <button>Hover me</button>
          </Tooltip>
        );

        fireEvent.mouseEnter(screen.getByRole('button'));

        act(() => {
          vi.advanceTimersByTime(0);
        });

        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      }
    );
  });

  describe('disabled state', () => {
    it('does not show tooltip when disabled', () => {
      render(
        <Tooltip content="Tooltip text" disabled delay={0}>
          <button>Hover me</button>
        </Tooltip>
      );

      fireEvent.mouseEnter(screen.getByRole('button'));

      act(() => {
        vi.advanceTimersByTime(0);
      });

      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('renders children normally when disabled', () => {
      render(
        <Tooltip content="Tooltip text" disabled>
          <button>Click me</button>
        </Tooltip>
      );

      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });
  });

  describe('custom content', () => {
    it('renders ReactNode content', () => {
      render(
        <Tooltip
          content={
            <div>
              <strong>Bold</strong> text
            </div>
          }
          delay={0}
        >
          <button>Hover me</button>
        </Tooltip>
      );

      fireEvent.mouseEnter(screen.getByRole('button'));

      act(() => {
        vi.advanceTimersByTime(0);
      });

      expect(screen.getByText('Bold')).toBeInTheDocument();
    });
  });
});
