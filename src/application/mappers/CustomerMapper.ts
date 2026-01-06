import { type Customer } from '@domain/entities';
import { type HealthScore } from '@domain/value-objects';
import { type CustomerDTO, type CustomerSummaryDTO } from '@application/dtos';

/**
 * Maps Customer entities to DTOs.
 * Pure functions with no side effects.
 */
export const CustomerMapper = {
  /**
   * Convert a Customer entity and its health score to a full DTO
   */
  toDTO(customer: Customer, healthScore: HealthScore): CustomerDTO {
    return {
      id: customer.id,
      accountOwner: customer.accountOwner,
      latestLogin: customer.latestLogin.toISOString(),
      createdDate: customer.createdDate.toISOString(),
      billingCountry: customer.billingCountry,
      accountType: customer.accountType,
      languages: [...customer.languages],
      status: customer.status,
      accountStatus: customer.accountStatus,
      propertyType: customer.propertyType,
      mrr: customer.mrr,
      currency: customer.currency,
      channels: [...customer.channels],
      healthScore: healthScore.value,
      healthClassification: healthScore.getClassification(),
    };
  },

  /**
   * Convert a Customer entity and its health score to a summary DTO
   */
  toSummaryDTO(customer: Customer, healthScore: HealthScore): CustomerSummaryDTO {
    return {
      id: customer.id,
      accountOwner: customer.accountOwner,
      status: customer.status,
      accountType: customer.accountType,
      healthScore: healthScore.value,
      healthClassification: healthScore.getClassification(),
      mrr: customer.mrr,
      channelCount: customer.channelCount,
      latestLogin: customer.latestLogin.toISOString(),
      billingCountry: customer.billingCountry,
    };
  },

  /**
   * Convert a list of customers to full DTOs
   */
  toDTOList(customers: Customer[], healthScores: Map<string, HealthScore>): CustomerDTO[] {
    return customers
      .map((customer) => {
        const healthScore = healthScores.get(customer.id);
        if (!healthScore) {
          return null;
        }
        return CustomerMapper.toDTO(customer, healthScore);
      })
      .filter((dto): dto is CustomerDTO => dto !== null);
  },

  /**
   * Convert a list of customers to summary DTOs
   */
  toSummaryDTOList(
    customers: Customer[],
    healthScores: Map<string, HealthScore>
  ): CustomerSummaryDTO[] {
    return customers
      .map((customer) => {
        const healthScore = healthScores.get(customer.id);
        if (!healthScore) {
          return null;
        }
        return CustomerMapper.toSummaryDTO(customer, healthScore);
      })
      .filter((dto): dto is CustomerSummaryDTO => dto !== null);
  },
};
