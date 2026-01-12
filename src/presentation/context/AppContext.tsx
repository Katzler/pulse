import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { compositionRoot, type UseCases } from '@application/composition';
import { HealthScoreCalculator } from '@domain/services';
import {
  InMemoryCustomerRepository,
  InMemorySentimentRepository,
} from '@infrastructure/repositories';

/**
 * Application context value
 */
interface AppContextValue {
  useCases: UseCases;
  repository: InMemoryCustomerRepository;
  sentimentRepository: InMemorySentimentRepository;
  healthScoreCalculator: HealthScoreCalculator;
}

const AppContext = createContext<AppContextValue | null>(null);

/**
 * Provider that initializes and provides the application context.
 * Sets up the composition root with shared repository instance.
 */
export function AppProvider({ children }: { children: ReactNode }) {
  const contextValue = useMemo(() => {
    // Create shared instances
    const repository = new InMemoryCustomerRepository();
    const sentimentRepository = new InMemorySentimentRepository();
    const healthScoreCalculator = new HealthScoreCalculator();

    // Set up health calculator on repository for statistics
    repository.setHealthScoreCalculator(healthScoreCalculator);

    // Initialize composition root if not already done
    if (!compositionRoot.isInitialized()) {
      compositionRoot.initialize({
        customerReadRepository: repository,
        customerWriteRepository: repository,
        customerStatisticsRepository: repository,
        sentimentReadRepository: sentimentRepository,
        sentimentWriteRepository: sentimentRepository,
        healthScoreCalculator,
      });
    }

    return {
      useCases: compositionRoot.getUseCases(),
      repository,
      sentimentRepository,
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

/**
 * Hook to access the sentiment repository directly.
 */
export function useSentimentRepository(): InMemorySentimentRepository {
  return useApp().sentimentRepository;
}
