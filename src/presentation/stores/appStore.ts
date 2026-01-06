import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * Global application state store.
 * Uses Zustand for lightweight, performant state management.
 */

interface AppState {
  /** Whether customer data has been imported */
  isDataLoaded: boolean;
  /** Timestamp of last data import */
  lastImportTime: Date | null;
  /** Current error message, if any */
  error: string | null;

  // Actions
  setDataLoaded: (loaded: boolean) => void;
  setLastImportTime: (time: Date) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    (set) => ({
      isDataLoaded: false,
      lastImportTime: null,
      error: null,

      setDataLoaded: (loaded) => set({ isDataLoaded: loaded }),
      setLastImportTime: (time) => set({ lastImportTime: time }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
    }),
    { name: 'app-store' }
  )
);
