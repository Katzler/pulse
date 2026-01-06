import type { FilterState } from './FilterPanel';

/**
 * Preset filter configuration
 */
export interface FilterPreset {
  /** Unique preset ID */
  id: string;
  /** Display name */
  name: string;
  /** Preset description */
  description?: string | undefined;
  /** Filter configuration */
  filters: Partial<FilterState>;
  /** Whether this is a system preset (cannot be deleted) */
  isSystem?: boolean;
  /** Preset icon */
  icon?: 'critical' | 'at-risk' | 'healthy' | 'active' | 'inactive' | 'custom' | undefined;
}

/**
 * Built-in system presets
 */
export const systemPresets: FilterPreset[] = [
  {
    id: 'critical-customers',
    name: 'Critical Customers',
    description: 'Customers with health score below 30',
    filters: { healthClassification: 'critical' },
    isSystem: true,
    icon: 'critical',
  },
  {
    id: 'at-risk-customers',
    name: 'At-Risk Customers',
    description: 'Customers with health score 30-69',
    filters: { healthClassification: 'at-risk' },
    isSystem: true,
    icon: 'at-risk',
  },
  {
    id: 'healthy-customers',
    name: 'Healthy Customers',
    description: 'Customers with health score 70+',
    filters: { healthClassification: 'healthy' },
    isSystem: true,
    icon: 'healthy',
  },
  {
    id: 'active-pro',
    name: 'Active Pro',
    description: 'Active customers with Pro accounts',
    filters: { status: 'active', accountType: 'pro' },
    isSystem: true,
    icon: 'active',
  },
  {
    id: 'inactive-all',
    name: 'Inactive Customers',
    description: 'All inactive customers',
    filters: { status: 'inactive' },
    isSystem: true,
    icon: 'inactive',
  },
];
