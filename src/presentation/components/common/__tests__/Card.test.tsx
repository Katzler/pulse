import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Card } from '../Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('renders title when provided', () => {
    render(<Card title="Card Title">Content</Card>);
    expect(screen.getByText('Card Title')).toBeInTheDocument();
  });

  it('renders footer when provided', () => {
    render(<Card footer={<div>Footer content</div>}>Content</Card>);
    expect(screen.getByText('Footer content')).toBeInTheDocument();
  });

  it('applies default variant styles', () => {
    render(<Card>Content</Card>);
    const card = screen.getByText('Content').parentElement;
    expect(card).toHaveClass('bg-white');
  });

  it('applies outlined variant styles', () => {
    render(<Card variant="outlined">Content</Card>);
    const card = screen.getByText('Content').parentElement;
    expect(card).toHaveClass('border');
  });

  it('applies padding styles', () => {
    render(<Card padding="large">Content</Card>);
    expect(screen.getByText('Content')).toHaveClass('p-6');
  });

  it('applies no padding when padding is none', () => {
    render(<Card padding="none">Content</Card>);
    expect(screen.getByText('Content')).not.toHaveClass('p-4');
  });

  it('supports custom className', () => {
    render(<Card className="custom-class">Content</Card>);
    expect(screen.getByText('Content').parentElement).toHaveClass('custom-class');
  });
});
