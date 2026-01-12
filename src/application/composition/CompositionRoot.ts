import {
  type CustomerReadRepository,
  type CustomerStatisticsRepository,
  type CustomerWriteRepository,
  type SentimentReadRepository,
  type SentimentWriteRepository,
} from '@domain/repositories';
import { type HealthScoreCalculator } from '@domain/services';
import {
  GetCustomerDetailsUseCase,
  GetDashboardOverviewUseCase,
  ImportCustomersUseCase,
  ImportSentimentDataUseCase,
  SearchCustomersUseCase,
} from '@application/use-cases';

/**
 * Container for all application dependencies
 */
export interface ApplicationDependencies {
  // Repositories
  customerReadRepository: CustomerReadRepository;
  customerWriteRepository: CustomerWriteRepository;
  customerStatisticsRepository: CustomerStatisticsRepository;
  sentimentReadRepository: SentimentReadRepository;
  sentimentWriteRepository: SentimentWriteRepository;

  // Domain Services
  healthScoreCalculator: HealthScoreCalculator;
}

/**
 * Container for all use cases
 */
export interface UseCases {
  importCustomers: ImportCustomersUseCase;
  importSentimentData: ImportSentimentDataUseCase;
  getDashboardOverview: GetDashboardOverviewUseCase;
  searchCustomers: SearchCustomersUseCase;
  getCustomerDetails: GetCustomerDetailsUseCase;
}

/**
 * Full application context
 */
export interface ApplicationContext {
  useCases: UseCases;
  dependencies: ApplicationDependencies;
}

/**
 * Composition Root
 *
 * Single entry point for dependency injection.
 * Creates and wires all application dependencies.
 */
export class CompositionRoot {
  private useCases: UseCases | null = null;
  private dependencies: ApplicationDependencies | null = null;

  /**
   * Initialize the composition root with dependencies
   */
  initialize(dependencies: ApplicationDependencies): ApplicationContext {
    this.dependencies = dependencies;

    // Create use cases with injected dependencies
    this.useCases = {
      importCustomers: new ImportCustomersUseCase(
        dependencies.customerWriteRepository,
        dependencies.healthScoreCalculator
      ),
      importSentimentData: new ImportSentimentDataUseCase(
        dependencies.sentimentWriteRepository,
        dependencies.customerReadRepository
      ),
      getDashboardOverview: new GetDashboardOverviewUseCase(
        dependencies.customerReadRepository,
        dependencies.customerStatisticsRepository,
        dependencies.healthScoreCalculator
      ),
      searchCustomers: new SearchCustomersUseCase(
        dependencies.customerReadRepository,
        dependencies.healthScoreCalculator
      ),
      getCustomerDetails: new GetCustomerDetailsUseCase(
        dependencies.customerReadRepository,
        dependencies.healthScoreCalculator
      ),
    };

    return {
      useCases: this.useCases,
      dependencies: this.dependencies,
    };
  }

  /**
   * Get use cases (throws if not initialized)
   */
  getUseCases(): UseCases {
    if (!this.useCases) {
      throw new Error('CompositionRoot not initialized. Call initialize() first.');
    }
    return this.useCases;
  }

  /**
   * Get dependencies (throws if not initialized)
   */
  getDependencies(): ApplicationDependencies {
    if (!this.dependencies) {
      throw new Error('CompositionRoot not initialized. Call initialize() first.');
    }
    return this.dependencies;
  }

  /**
   * Check if initialized
   */
  isInitialized(): boolean {
    return this.useCases !== null && this.dependencies !== null;
  }

  /**
   * Reset the composition root (useful for testing)
   */
  reset(): void {
    this.useCases = null;
    this.dependencies = null;
  }
}

/**
 * Default composition root instance (singleton)
 */
export const compositionRoot = new CompositionRoot();

/**
 * Factory function for creating a new composition root
 * Useful for testing or multiple isolated contexts
 */
export function createCompositionRoot(): CompositionRoot {
  return new CompositionRoot();
}
