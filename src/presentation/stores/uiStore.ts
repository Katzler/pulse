import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * Toast notification types
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * Toast notification structure
 */
export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  dismissible?: boolean;
}

/**
 * UI state for managing global UI concerns
 */
interface UIState {
  /** Global loading state */
  isLoading: boolean;
  /** Loading message to display */
  loadingMessage: string | null;
  /** Active toast notifications */
  toasts: Toast[];
  /** Whether sidebar is open (for mobile) */
  sidebarOpen: boolean;
}

/**
 * UI actions for updating state
 */
interface UIActions {
  /** Set global loading state */
  setLoading: (loading: boolean, message?: string) => void;
  /** Add a toast notification */
  addToast: (toast: Omit<Toast, 'id'>) => void;
  /** Remove a toast notification by ID */
  removeToast: (id: string) => void;
  /** Clear all toasts */
  clearToasts: () => void;
  /** Toggle sidebar visibility */
  toggleSidebar: () => void;
  /** Set sidebar visibility */
  setSidebarOpen: (open: boolean) => void;
}

const initialState: UIState = {
  isLoading: false,
  loadingMessage: null,
  toasts: [],
  sidebarOpen: false,
};

/**
 * Generate unique ID for toasts
 */
function generateToastId(): string {
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Zustand store for UI state.
 * Manages loading states, toasts, and other global UI concerns.
 */
export const useUIStore = create<UIState & UIActions>()(
  devtools(
    (set) => ({
      ...initialState,

      setLoading: (isLoading, loadingMessage) =>
        set({ isLoading, loadingMessage: loadingMessage ?? null }, false, 'setLoading'),

      addToast: (toast) =>
        set(
          (state) => ({
            toasts: [
              ...state.toasts,
              {
                ...toast,
                id: generateToastId(),
                dismissible: toast.dismissible ?? true,
              },
            ],
          }),
          false,
          'addToast'
        ),

      removeToast: (id) =>
        set(
          (state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
          }),
          false,
          'removeToast'
        ),

      clearToasts: () => set({ toasts: [] }, false, 'clearToasts'),

      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen }), false, 'toggleSidebar'),

      setSidebarOpen: (sidebarOpen) =>
        set({ sidebarOpen }, false, 'setSidebarOpen'),
    }),
    { name: 'UIStore' }
  )
);
