export interface LoadingSkeletonProps {
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'circular' | 'rectangular';
  className?: string;
}

const variantStyles = {
  text: 'rounded',
  circular: 'rounded-full',
  rectangular: 'rounded-md',
};

/**
 * Skeleton placeholder for loading content.
 */
export function LoadingSkeleton({
  width,
  height,
  variant = 'text',
  className = '',
}: LoadingSkeletonProps) {
  const style: React.CSSProperties = {};

  if (width !== undefined) {
    style.width = typeof width === 'number' ? `${width}px` : width;
  }
  if (height !== undefined) {
    style.height = typeof height === 'number' ? `${height}px` : height;
  }

  return (
    <div
      className={`
        animate-pulse bg-gray-200
        ${variantStyles[variant]}
        ${!height && variant === 'text' ? 'h-4' : ''}
        ${!width && variant === 'text' ? 'w-full' : ''}
        ${className}
      `}
      style={style}
      aria-hidden="true"
    />
  );
}
