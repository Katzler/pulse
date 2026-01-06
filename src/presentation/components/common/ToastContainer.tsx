import { useUIStore } from '@presentation/stores';

import { Toast } from './Toast';

/**
 * Props for ToastContainer component
 */
export interface ToastContainerProps {
  /** Position of the toast container */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  /** Maximum number of visible toasts */
  maxToasts?: number;
}

/**
 * Get position classes for toast container
 */
function getPositionClasses(position: ToastContainerProps['position']): string {
  switch (position) {
    case 'top-right':
      return 'top-4 right-4';
    case 'top-left':
      return 'top-4 left-4';
    case 'bottom-right':
      return 'bottom-4 right-4';
    case 'bottom-left':
      return 'bottom-4 left-4';
    case 'top-center':
      return 'top-4 left-1/2 -translate-x-1/2';
    case 'bottom-center':
      return 'bottom-4 left-1/2 -translate-x-1/2';
    default:
      return 'top-4 right-4';
  }
}

/**
 * Container component for displaying toast notifications.
 * Connects to the UI store and renders all active toasts.
 *
 * @example
 * // Add to your app layout
 * function App() {
 *   return (
 *     <>
 *       <Router />
 *       <ToastContainer position="top-right" />
 *     </>
 *   );
 * }
 *
 * // Show a toast from anywhere
 * const { addToast } = useUIStore.getState();
 * addToast({ type: 'success', title: 'Success!', message: 'Operation completed' });
 */
export function ToastContainer({ position = 'top-right', maxToasts = 5 }: ToastContainerProps) {
  const toasts = useUIStore((state) => state.toasts);
  const removeToast = useUIStore((state) => state.removeToast);

  // Limit visible toasts
  const visibleToasts = toasts.slice(-maxToasts);

  if (visibleToasts.length === 0) {
    return null;
  }

  return (
    <div
      className={`pointer-events-none fixed z-50 flex flex-col gap-2 ${getPositionClasses(position)}`}
      aria-label="Notifications"
    >
      {visibleToasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={removeToast} />
      ))}
    </div>
  );
}
