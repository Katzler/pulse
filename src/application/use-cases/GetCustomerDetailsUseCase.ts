import { type CustomerReadRepository } from '@domain/repositories';
import { type HealthScoreCalculator } from '@domain/services';
import { type CustomerDTO, type HealthScoreBreakdownDTO } from '@application/dtos';
import { CustomerMapper, HealthScoreMapper } from '@application/mappers';
import { CustomerId, type Result } from '@shared/types';

/**
 * Input for the get customer details use case
 */
export interface GetCustomerDetailsInput {
  customerId: string;
}

/**
 * Output with full customer details and health breakdown
 */
export interface GetCustomerDetailsOutput {
  customer: CustomerDTO;
  healthBreakdown: HealthScoreBreakdownDTO;
}

/**
 * Use case for retrieving detailed customer information.
 * Includes full customer data and health score breakdown.
 */
export class GetCustomerDetailsUseCase {
  private readonly customerReadRepository: CustomerReadRepository;
  private readonly healthScoreCalculator: HealthScoreCalculator;

  constructor(customerReadRepository: CustomerReadRepository, healthScoreCalculator: HealthScoreCalculator) {
    this.customerReadRepository = customerReadRepository;
    this.healthScoreCalculator = healthScoreCalculator;
  }

  /**
   * Execute the get customer details use case
   */
  execute(input: GetCustomerDetailsInput): Result<GetCustomerDetailsOutput, string> {
    // Find the customer
    const customerResult = this.customerReadRepository.getById(CustomerId.create(input.customerId));

    if (!customerResult.success) {
      return {
        success: false,
        error: `Customer not found: ${input.customerId}`,
      };
    }

    const customer = customerResult.value;

    // Calculate health score with breakdown
    const healthResult = this.healthScoreCalculator.calculate(customer);

    if (!healthResult.success) {
      return {
        success: false,
        error: `Failed to calculate health score: ${healthResult.error}`,
      };
    }

    const healthScore = healthResult.value;

    // Get factor breakdown
    const breakdown = this.healthScoreCalculator.getFactorBreakdown(customer);

    // Map to DTOs
    const customerDTO = CustomerMapper.toDTO(customer, healthScore);
    const healthBreakdownDTO = HealthScoreMapper.toBreakdownDTO(breakdown);

    return {
      success: true,
      value: {
        customer: customerDTO,
        healthBreakdown: healthBreakdownDTO,
      },
    };
  }
}
