import { beforeEach, describe, expect, it } from 'vitest';

import { type Customer } from '@domain/entities';
import {
  type CustomerReadRepository,
  type CustomerStatistics,
  type CustomerStatisticsRepository,
  type CustomerWriteRepository,
  type HealthDistribution,
  type ImportSummary,
  type MrrByCountry,
  type SearchCriteria,
} from '@domain/repositories';
import { HealthScoreCalculator } from '@domain/services';
import {
  type CustomerNotFoundError,
  type DuplicateCustomerError,
  type ImportError,
} from '@domain/types/errors';
import {
  type ApplicationDependencies,
  CompositionRoot,
  compositionRoot,
  createCompositionRoot,
} from '@application/composition/CompositionRoot';
import { type Result } from '@shared/types';

class MockCustomerReadRepository implements CustomerReadRepository {
  getAll(): Customer[] {
    return [];
  }
  getById(_id: string): Result<Customer, CustomerNotFoundError> {
    return {
      success: false,
      error: {
        type: 'CUSTOMER_NOT_FOUND',
        message: 'Not found',
        details: { customerId: _id },
      },
    };
  }
  search(_criteria: SearchCriteria): Customer[] {
    return [];
  }
  count(): number {
    return 0;
  }
}

class MockCustomerWriteRepository implements CustomerWriteRepository {
  add(_customer: Customer): Result<void, DuplicateCustomerError> {
    return { success: true, value: undefined };
  }
  addMany(_customers: Customer[]): Result<ImportSummary, ImportError> {
    return {
      success: true,
      value: { totalProcessed: 0, successCount: 0, failedCount: 0, skippedCount: 0 },
    };
  }
  clear(): void {}
}

class MockCustomerStatisticsRepository implements CustomerStatisticsRepository {
  getStatistics(): CustomerStatistics {
    return {
      totalCount: 0,
      activeCount: 0,
      inactiveCount: 0,
      averageHealthScore: 0,
      totalMrr: 0,
      atRiskCount: 0,
    };
  }
  getHealthDistribution(): HealthDistribution {
    return { healthy: 0, atRisk: 0, critical: 0 };
  }
  getMrrByCountry(): MrrByCountry[] {
    return [];
  }
}

describe('CompositionRoot', () => {
  let root: CompositionRoot;
  let dependencies: ApplicationDependencies;

  beforeEach(() => {
    root = new CompositionRoot();
    dependencies = {
      customerReadRepository: new MockCustomerReadRepository(),
      customerWriteRepository: new MockCustomerWriteRepository(),
      customerStatisticsRepository: new MockCustomerStatisticsRepository(),
      healthScoreCalculator: new HealthScoreCalculator(),
    };
  });

  describe('initialize', () => {
    it('creates all use cases', () => {
      const context = root.initialize(dependencies);

      expect(context.useCases.importCustomers).toBeDefined();
      expect(context.useCases.getDashboardOverview).toBeDefined();
      expect(context.useCases.searchCustomers).toBeDefined();
      expect(context.useCases.getCustomerDetails).toBeDefined();
    });

    it('stores dependencies', () => {
      const context = root.initialize(dependencies);

      expect(context.dependencies).toBe(dependencies);
    });

    it('sets initialized state', () => {
      expect(root.isInitialized()).toBe(false);

      root.initialize(dependencies);

      expect(root.isInitialized()).toBe(true);
    });
  });

  describe('getUseCases', () => {
    it('returns use cases after initialization', () => {
      root.initialize(dependencies);

      const useCases = root.getUseCases();

      expect(useCases.importCustomers).toBeDefined();
    });

    it('throws when not initialized', () => {
      expect(() => root.getUseCases()).toThrow('not initialized');
    });
  });

  describe('getDependencies', () => {
    it('returns dependencies after initialization', () => {
      root.initialize(dependencies);

      const deps = root.getDependencies();

      expect(deps).toBe(dependencies);
    });

    it('throws when not initialized', () => {
      expect(() => root.getDependencies()).toThrow('not initialized');
    });
  });

  describe('reset', () => {
    it('clears initialized state', () => {
      root.initialize(dependencies);
      expect(root.isInitialized()).toBe(true);

      root.reset();

      expect(root.isInitialized()).toBe(false);
    });

    it('allows reinitialization', () => {
      root.initialize(dependencies);
      root.reset();

      const context = root.initialize(dependencies);

      expect(context.useCases).toBeDefined();
    });
  });

  describe('use case functionality', () => {
    it('importCustomers use case works', () => {
      const context = root.initialize(dependencies);

      const result = context.useCases.importCustomers.execute({ records: [] });

      expect(result.success).toBe(true);
    });

    it('getDashboardOverview use case works', () => {
      const context = root.initialize(dependencies);

      const result = context.useCases.getDashboardOverview.execute();

      expect(result.success).toBe(true);
    });

    it('searchCustomers use case works', () => {
      const context = root.initialize(dependencies);

      const result = context.useCases.searchCustomers.execute({});

      expect(result.success).toBe(true);
    });

    it('getCustomerDetails use case returns not found for missing customer', () => {
      const context = root.initialize(dependencies);

      const result = context.useCases.getCustomerDetails.execute({ customerId: 'MISSING' });

      expect(result.success).toBe(false);
    });
  });
});

describe('createCompositionRoot', () => {
  it('creates a new instance', () => {
    const root1 = createCompositionRoot();
    const root2 = createCompositionRoot();

    expect(root1).not.toBe(root2);
  });
});

describe('compositionRoot singleton', () => {
  beforeEach(() => {
    compositionRoot.reset();
  });

  it('is a singleton instance', () => {
    expect(compositionRoot).toBeInstanceOf(CompositionRoot);
  });

  it('can be initialized', () => {
    const dependencies: ApplicationDependencies = {
      customerReadRepository: new MockCustomerReadRepository(),
      customerWriteRepository: new MockCustomerWriteRepository(),
      customerStatisticsRepository: new MockCustomerStatisticsRepository(),
      healthScoreCalculator: new HealthScoreCalculator(),
    };

    compositionRoot.initialize(dependencies);

    expect(compositionRoot.isInitialized()).toBe(true);
  });
});
