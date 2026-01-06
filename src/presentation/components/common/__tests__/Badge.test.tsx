import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Badge } from '../Badge';

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>Status</Badge>);
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('applies default variant styles', () => {
    render(<Badge>Status</Badge>);
    expect(screen.getByText('Status')).toHaveClass('bg-gray-100');
  });

  it('applies success variant styles', () => {
    render(<Badge variant="success">Healthy</Badge>);
    expect(screen.getByText('Healthy')).toHaveClass('bg-green-100');
  });

  it('applies warning variant styles', () => {
    render(<Badge variant="warning">At Risk</Badge>);
    expect(screen.getByText('At Risk')).toHaveClass('bg-yellow-100');
  });

  it('applies error variant styles', () => {
    render(<Badge variant="error">Critical</Badge>);
    expect(screen.getByText('Critical')).toHaveClass('bg-red-100');
  });

  it('applies info variant styles', () => {
    render(<Badge variant="info">Info</Badge>);
    expect(screen.getByText('Info')).toHaveClass('bg-blue-100');
  });

  it('applies small size styles', () => {
    render(<Badge size="small">Small</Badge>);
    expect(screen.getByText('Small')).toHaveClass('text-xs');
  });

  it('applies medium size styles by default', () => {
    render(<Badge>Medium</Badge>);
    expect(screen.getByText('Medium')).toHaveClass('text-sm');
  });

  it('supports custom className', () => {
    render(<Badge className="custom-class">Status</Badge>);
    expect(screen.getByText('Status')).toHaveClass('custom-class');
  });
});
