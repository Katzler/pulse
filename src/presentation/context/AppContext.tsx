import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { compositionRoot, type UseCases } from '@application/composition';
import { type CustomerRepository } from '@domain/repositories';
import { HealthScoreCalculator } from '@domain/services';
import { InMemoryCustomerRepository, SupabaseCustomerRepository } from '@infrastructure/repositories';

/**
 * Application context value
 */
interface AppContextValue {
  useCases: UseCases;
  repository: CustomerRepository;
  healthScoreCalculator: HealthScoreCalculator;
}

const AppContext = createContext<AppContextValue | null>(null);

/**
 * Create the appropriate repository based on environment configuration.
 * Set VITE_USE_SUPABASE=true in .env.local to use Supabase persistence.
 */
function createRepository(healthScoreCalculator: HealthScoreCalculator): CustomerRepository {
  const useSupabase = import.meta.env.VITE_USE_SUPABASE === 'true';

  if (useSupabase) {
    return new SupabaseCustomerRepository(healthScoreCalculator);
  }

  const repository = new InMemoryCustomerRepository();
  repository.setHealthScoreCalculator(healthScoreCalculator);
  return repository;
}

/**
 * Provider that initializes and provides the application context.
 * Sets up the composition root with shared repository instance.
 */
export function AppProvider({ children }: { children: ReactNode }) {
  const contextValue = useMemo(() => {
    const healthScoreCalculator = new HealthScoreCalculator();
    const repository = createRepository(healthScoreCalculator);

    // Initialize composition root if not already done
    if (!compositionRoot.isInitialized()) {
      compositionRoot.initialize({
        customerReadRepository: repository,
        customerWriteRepository: repository,
        customerStatisticsRepository: repository,
        healthScoreCalculator,
      });
    }

    return {
      useCases: compositionRoot.getUseCases(),
      repository,
      healthScoreCalculator,
    };
  }, []);

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}

/**
 * Hook to access the application context.
 * Must be used within an AppProvider.
 */
export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

/**
 * Hook to access use cases directly.
 */
export function useUseCases(): UseCases {
  return useApp().useCases;
}
