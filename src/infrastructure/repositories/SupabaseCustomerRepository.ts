import { Customer, type CustomerProps } from '@domain/entities';
import type {
  CustomerRepository,
  CustomerStatistics,
  HealthDistribution,
  ImportSummary,
  MrrByCountry,
  SearchCriteria,
} from '@domain/repositories';
import { type HealthScoreCalculator } from '@domain/services';
import {
  type CustomerNotFoundError,
  type DuplicateCustomerError,
  type ImportError,
} from '@domain/types/errors';
import { type HealthScoreClassification } from '@domain/value-objects';
import { type AccountType, type CustomerId, type CustomerStatus, type Result } from '@shared/types';

import { supabase } from '../database/supabaseClient';
import type { Database } from '../database/types';

type CustomerRow = Database['public']['Tables']['customers_current']['Row'];
type CustomerInsert = Database['public']['Tables']['customers_current']['Insert'];
type HealthScoreHistoryInsert = Database['public']['Tables']['health_score_history']['Insert'];
type HealthAlertInsert = Database['public']['Tables']['health_alerts']['Insert'];
type PortfolioSnapshotInsert = Database['public']['Tables']['portfolio_snapshots']['Insert'];
type ImportHistoryInsert = Database['public']['Tables']['import_history']['Insert'];

/**
 * Supabase-backed customer repository.
 * Implements all domain repository interfaces for persistent storage.
 */
export class SupabaseCustomerRepository implements CustomerRepository {
  private readonly healthScoreCalculator: HealthScoreCalculator;

  constructor(healthScoreCalculator: HealthScoreCalculator) {
    this.healthScoreCalculator = healthScoreCalculator;
  }

  // ==================== CustomerReadRepository ====================

  async getAll(): Promise<Customer[]> {
    const { data, error } = await supabase
      .from('customers_current')
      .select('*')
      .order('account_name');

    if (error) {
      throw new Error(`Failed to fetch customers: ${error.message}`);
    }

    const customers: Customer[] = [];
    for (const row of data) {
      const result = this.mapRowToCustomer(row);
      if (result.success) {
        customers.push(result.value);
      }
    }

    return customers;
  }

  async getById(id: CustomerId): Promise<Result<Customer, CustomerNotFoundError>> {
    const { data, error } = await supabase
      .from('customers_current')
      .select('*')
      .eq('sirvoy_customer_id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          success: false,
          error: {
            type: 'CUSTOMER_NOT_FOUND',
            message: `Customer not found: ${id}`,
            details: { customerId: id },
          },
        };
      }
      throw new Error(`Failed to fetch customer: ${error.message}`);
    }

    const result = this.mapRowToCustomer(data);
    if (!result.success) {
      throw new Error(`Failed to map customer row: ${result.error.message}`);
    }

    return { success: true, value: result.value };
  }

  async search(criteria: SearchCriteria): Promise<Customer[]> {
    let query = supabase.from('customers_current').select('*');

    if (criteria.query) {
      const searchTerm = `%${criteria.query}%`;
      query = query.or(
        `sirvoy_customer_id.ilike.${searchTerm},account_owner.ilike.${searchTerm}`
      );
    }

    if (criteria.status) {
      query = query.eq('status', criteria.status);
    }

    if (criteria.country) {
      query = query.eq('billing_country', criteria.country);
    }

    if (criteria.accountType) {
      query = query.eq('account_type', criteria.accountType);
    }

    if (criteria.healthStatus) {
      query = query.eq('health_classification', criteria.healthStatus);
    }

    if (criteria.limit) {
      const offset = criteria.offset ?? 0;
      query = query.range(offset, offset + criteria.limit - 1);
    }

    query = query.order('account_name');

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to search customers: ${error.message}`);
    }

    const customers: Customer[] = [];
    for (const row of data) {
      const result = this.mapRowToCustomer(row);
      if (result.success) {
        customers.push(result.value);
      }
    }

    return customers;
  }

  async count(): Promise<number> {
    const { count, error } = await supabase
      .from('customers_current')
      .select('*', { count: 'exact', head: true });

    if (error) {
      throw new Error(`Failed to count customers: ${error.message}`);
    }

    return count ?? 0;
  }

  // ==================== CustomerWriteRepository ====================

  async add(customer: Customer): Promise<Result<void, DuplicateCustomerError>> {
    // Check if customer already exists
    const { data: existing } = await supabase
      .from('customers_current')
      .select('sirvoy_customer_id')
      .eq('sirvoy_customer_id', customer.id)
      .single();

    if (existing) {
      return {
        success: false,
        error: {
          type: 'DUPLICATE_CUSTOMER',
          message: `Customer already exists: ${customer.id}`,
          details: { customerId: customer.id },
        },
      };
    }

    const row = this.mapCustomerToRow(customer);
    const { error } = await supabase.from('customers_current').insert(row);

    if (error) {
      throw new Error(`Failed to add customer: ${error.message}`);
    }

    return { success: true, value: undefined };
  }

  async addMany(customers: Customer[]): Promise<Result<ImportSummary, ImportError>> {
    const rows: CustomerInsert[] = [];
    for (const customer of customers) {
      rows.push(this.mapCustomerToRow(customer));
    }

    const { error } = await supabase
      .from('customers_current')
      .upsert(rows, { onConflict: 'sirvoy_customer_id' });

    if (error) {
      return {
        success: false,
        error: {
          type: 'IMPORT_ERROR',
          message: `Import failed: ${error.message}`,
          details: { errors: [], totalRows: customers.length, failedRows: customers.length },
        },
      };
    }

    await this.saveHealthScoreHistory(customers);
    await this.generateHealthAlerts(customers);

    return {
      success: true,
      value: {
        totalProcessed: customers.length,
        successCount: customers.length,
        failedCount: 0,
        skippedCount: 0,
      },
    };
  }

  async clear(): Promise<void> {
    const { error } = await supabase
      .from('customers_current')
      .delete()
      .neq('sirvoy_customer_id', '');

    if (error) {
      throw new Error(`Failed to clear customers: ${error.message}`);
    }
  }

  // ==================== CustomerStatisticsRepository ====================

  async getStatistics(): Promise<CustomerStatistics> {
    const { data, error } = await supabase.from('customers_current').select('*');

    if (error) {
      throw new Error(`Failed to get statistics: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return {
        totalCount: 0,
        activeCount: 0,
        inactiveCount: 0,
        averageHealthScore: 0,
        totalMrr: 0,
        atRiskCount: 0,
      };
    }

    let activeCount = 0;
    let totalMrr = 0;
    let totalHealthScore = 0;
    let atRiskCount = 0;

    for (const row of data) {
      if (row.status === 'Active Customer') {
        activeCount++;
      }
      totalMrr += row.mrr ?? 0;
      totalHealthScore += row.health_score;
      if (row.health_classification === 'at-risk' || row.health_classification === 'critical') {
        atRiskCount++;
      }
    }

    return {
      totalCount: data.length,
      activeCount,
      inactiveCount: data.length - activeCount,
      averageHealthScore: Math.round(totalHealthScore / data.length),
      totalMrr,
      atRiskCount,
    };
  }

  async getHealthDistribution(): Promise<HealthDistribution> {
    const { data, error } = await supabase
      .from('customers_current')
      .select('health_classification');

    if (error) {
      throw new Error(`Failed to get health distribution: ${error.message}`);
    }

    let healthy = 0;
    let atRisk = 0;
    let critical = 0;

    for (const row of data) {
      switch (row.health_classification) {
        case 'healthy':
          healthy++;
          break;
        case 'at-risk':
          atRisk++;
          break;
        case 'critical':
          critical++;
          break;
      }
    }

    return { healthy, atRisk, critical };
  }

  async getMrrByCountry(): Promise<MrrByCountry[]> {
    const { data, error } = await supabase
      .from('customers_current')
      .select('billing_country, mrr');

    if (error) {
      throw new Error(`Failed to get MRR by country: ${error.message}`);
    }

    const countryMap = new Map<string, { totalMrr: number; customerCount: number }>();

    for (const row of data) {
      const country = row.billing_country ?? 'Unknown';
      const existing = countryMap.get(country);
      if (existing) {
        existing.totalMrr += row.mrr ?? 0;
        existing.customerCount++;
      } else {
        countryMap.set(country, { totalMrr: row.mrr ?? 0, customerCount: 1 });
      }
    }

    return Array.from(countryMap.entries())
      .map(([country, d]) => ({ country, totalMrr: d.totalMrr, customerCount: d.customerCount }))
      .sort((a, b) => b.totalMrr - a.totalMrr);
  }

  // ==================== SNAPSHOT OPERATIONS ====================

  async savePortfolioSnapshot(): Promise<Result<void, string>> {
    try {
      const stats = await this.getStatistics();
      const dist = await this.getHealthDistribution();
      const mrrData = await this.getMrrByCountry();

      const mrrByCountry: Record<string, number> = {};
      for (const entry of mrrData) {
        mrrByCountry[entry.country] = entry.totalMrr;
      }

      const snapshot: PortfolioSnapshotInsert = {
        snapshot_date: new Date().toISOString().split('T')[0],
        total_customers: stats.totalCount,
        active_customers: stats.activeCount,
        avg_health_score: stats.averageHealthScore,
        total_mrr: stats.totalMrr,
        healthy_count: dist.healthy,
        at_risk_count: dist.atRisk,
        critical_count: dist.critical,
        health_distribution: { healthy: dist.healthy, atRisk: dist.atRisk, critical: dist.critical },
        mrr_by_country: mrrByCountry,
      };

      const { error } = await supabase
        .from('portfolio_snapshots')
        .upsert(snapshot, { onConflict: 'snapshot_date' });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, value: undefined };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }

  async logImport(
    customersImported: number,
    customersUpdated: number,
    alertsGenerated: number
  ): Promise<Result<void, string>> {
    try {
      const row: ImportHistoryInsert = {
        import_type: 'csv',
        customers_imported: customersImported,
        customers_updated: customersUpdated,
        alerts_generated: alertsGenerated,
        imported_by: null,
        metadata: null,
      };

      const { error } = await supabase.from('import_history').insert(row);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, value: undefined };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }

  // ==================== PRIVATE HELPERS ====================

  private async saveHealthScoreHistory(customers: Customer[]): Promise<void> {
    const today = new Date().toISOString().split('T')[0];

    const historyRows: HealthScoreHistoryInsert[] = [];
    for (const customer of customers) {
      const scoreResult = this.healthScoreCalculator.calculate(customer);
      if (scoreResult.success) {
        historyRows.push({
          sirvoy_customer_id: customer.id,
          snapshot_date: today,
          health_score: scoreResult.value.value,
          health_classification: scoreResult.value.getClassification(),
        });
      }
    }

    if (historyRows.length > 0) {
      await supabase
        .from('health_score_history')
        .upsert(historyRows, { onConflict: 'sirvoy_customer_id,snapshot_date' });
    }
  }

  private async generateHealthAlerts(customers: Customer[]): Promise<void> {
    const alerts: HealthAlertInsert[] = [];

    for (const customer of customers) {
      const scoreResult = this.healthScoreCalculator.calculate(customer);
      if (!scoreResult.success) continue;

      const newScore = scoreResult.value.value;

      // Get previous health score
      const { data: previousScores } = await supabase
        .from('health_score_history')
        .select('health_score')
        .eq('sirvoy_customer_id', customer.id)
        .order('snapshot_date', { ascending: false })
        .limit(2);

      if (previousScores && previousScores.length === 2) {
        const oldScore = previousScores[1].health_score;
        const change = newScore - oldScore;

        // Alert on significant drops (15+ points)
        if (change <= -15) {
          alerts.push({
            sirvoy_customer_id: customer.id,
            alert_type: 'critical_drop',
            old_score: oldScore,
            new_score: newScore,
            score_change: change,
            message: `Health score dropped ${Math.abs(change)} points for ${customer.accountName}`,
            acknowledged: false,
          });
        }

        // Alert on recovery from critical
        if (oldScore < 30 && newScore >= 30) {
          alerts.push({
            sirvoy_customer_id: customer.id,
            alert_type: 'recovered',
            old_score: oldScore,
            new_score: newScore,
            score_change: change,
            message: `${customer.accountName} recovered from critical status`,
            acknowledged: false,
          });
        }
      }

      // Alert on 30+ days inactivity
      const daysSinceLogin = customer.daysSinceLastLogin();
      if (daysSinceLogin !== null && daysSinceLogin > 30) {
        alerts.push({
          sirvoy_customer_id: customer.id,
          alert_type: 'inactive_30d',
          old_score: null,
          new_score: newScore,
          score_change: null,
          message: `${customer.accountName} has been inactive for ${daysSinceLogin} days`,
          acknowledged: false,
        });
      }
    }

    if (alerts.length > 0) {
      await supabase.from('health_alerts').insert(alerts);
    }
  }

  private mapRowToCustomer(row: CustomerRow): Result<Customer, Error> {
    const props: CustomerProps = {
      id: row.sirvoy_customer_id,
      accountOwner: row.account_owner,
      accountName: row.account_name,
      status: row.status as CustomerStatus,
      accountStatus: row.account_status ?? '',
      accountType: row.account_type as AccountType,
      createdDate: new Date(row.created_date),
      latestLogin: row.latest_login ? new Date(row.latest_login) : null,
      lastCsContactDate: row.last_cs_contact_date ? new Date(row.last_cs_contact_date) : null,
      billingCountry: row.billing_country ?? '',
      propertyType: row.property_type ?? '',
      currency: row.currency ?? '',
      mrr: row.mrr ?? 0,
      languages: row.languages ?? [],
      channels: row.channels ?? [],
    };

    return Customer.create(props);
  }

  private mapCustomerToRow(customer: Customer): CustomerInsert {
    const scoreResult = this.healthScoreCalculator.calculate(customer);
    const healthScore = scoreResult.success ? scoreResult.value.value : 0;
    const classification: HealthScoreClassification = scoreResult.success
      ? scoreResult.value.getClassification()
      : 'critical';

    return {
      sirvoy_customer_id: customer.id,
      account_owner: customer.accountOwner,
      account_name: customer.accountName,
      status: customer.status,
      account_status: customer.accountStatus,
      account_type: customer.accountType,
      created_date: customer.createdDate.toISOString(),
      latest_login: customer.latestLogin?.toISOString() ?? null,
      last_cs_contact_date: customer.lastCsContactDate?.toISOString() ?? null,
      billing_country: customer.billingCountry,
      property_type: customer.propertyType,
      mrr: customer.mrr,
      currency: customer.currency,
      languages: [...customer.languages],
      channels: [...customer.channels],
      health_score: healthScore,
      health_classification: classification,
    };
  }
}
