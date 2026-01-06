import { type ReactNode } from 'react';

export interface CardProps {
  children: ReactNode;
  title?: string;
  footer?: ReactNode;
  variant?: 'default' | 'outlined';
  padding?: 'none' | 'small' | 'medium' | 'large';
  className?: string;
  'data-testid'?: string;
}

const paddingStyles = {
  none: '',
  small: 'p-3',
  medium: 'p-4',
  large: 'p-6',
};

const variantStyles = {
  default: 'bg-white shadow-sm',
  outlined: 'bg-white border border-gray-200',
};

/**
 * Card component for content containers.
 */
export function Card({
  children,
  title,
  footer,
  variant = 'default',
  padding = 'medium',
  className = '',
  'data-testid': testId,
}: CardProps) {
  return (
    <div
      className={`
        rounded-lg
        ${variantStyles[variant]}
        ${className}
      `}
      data-testid={testId}
    >
      {title && (
        <div className="border-b border-gray-200 px-4 py-3">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        </div>
      )}
      <div className={paddingStyles[padding]}>{children}</div>
      {footer && (
        <div className="border-t border-gray-200 px-4 py-3 bg-gray-50 rounded-b-lg">
          {footer}
        </div>
      )}
    </div>
  );
}
