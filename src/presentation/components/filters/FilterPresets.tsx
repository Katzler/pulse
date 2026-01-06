import type { JSX } from 'react';
import { useCallback, useState } from 'react';

import type { FilterState } from './FilterPanel';
import { type FilterPreset, systemPresets } from './presets';

/**
 * Preset icon component
 */
function PresetIcon({
  type,
}: {
  type: FilterPreset['icon'];
}): JSX.Element {
  const iconClasses = 'w-4 h-4';

  switch (type) {
    case 'critical':
      return (
        <svg className={`${iconClasses} text-red-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    case 'at-risk':
      return (
        <svg className={`${iconClasses} text-orange-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'healthy':
      return (
        <svg className={`${iconClasses} text-green-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'active':
      return (
        <svg className={`${iconClasses} text-blue-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    case 'inactive':
      return (
        <svg className={`${iconClasses} text-gray-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      );
    case 'custom':
    default:
      return (
        <svg className={`${iconClasses} text-purple-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      );
  }
}

/**
 * Props for FilterPresets component
 */
export interface FilterPresetsProps {
  /** Current filter state */
  currentFilters: Partial<FilterState>;
  /** Callback when a preset is applied */
  onApplyPreset: (filters: Partial<FilterState>) => void;
  /** Custom presets (in addition to system presets) */
  customPresets?: FilterPreset[] | undefined;
  /** Callback when a custom preset is saved */
  onSavePreset?: ((preset: Omit<FilterPreset, 'id'>) => void) | undefined;
  /** Callback when a custom preset is deleted */
  onDeletePreset?: ((presetId: string) => void) | undefined;
  /** Compact mode (horizontal list) */
  compact?: boolean;
  /** Additional CSS class */
  className?: string;
}

/**
 * Check if filters match a preset
 */
function filtersMatchPreset(
  currentFilters: Partial<FilterState>,
  presetFilters: Partial<FilterState>
): boolean {
  const presetKeys = Object.keys(presetFilters) as (keyof FilterState)[];

  // All preset filter keys must be in current filters with same value
  for (const key of presetKeys) {
    const presetValue = presetFilters[key];
    const currentValue = currentFilters[key];

    if (Array.isArray(presetValue) && Array.isArray(currentValue)) {
      if (
        presetValue.length !== currentValue.length ||
        !presetValue.every((v) => currentValue.includes(v))
      ) {
        return false;
      }
    } else if (presetValue !== currentValue) {
      return false;
    }
  }

  return true;
}

/**
 * FilterPresets component for quick filter selection.
 * Displays system presets and custom user presets.
 *
 * @example
 * <FilterPresets
 *   currentFilters={filters}
 *   onApplyPreset={handleApplyPreset}
 * />
 */
export function FilterPresets({
  currentFilters,
  onApplyPreset,
  customPresets = [],
  onSavePreset,
  onDeletePreset,
  compact = false,
  className = '',
}: FilterPresetsProps): JSX.Element {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  const allPresets = [...systemPresets, ...customPresets];

  const handleApplyPreset = useCallback(
    (preset: FilterPreset) => {
      onApplyPreset(preset.filters);
    },
    [onApplyPreset]
  );

  const handleSavePreset = useCallback(() => {
    if (onSavePreset && newPresetName.trim()) {
      onSavePreset({
        name: newPresetName.trim(),
        filters: currentFilters,
        icon: 'custom',
      });
      setNewPresetName('');
      setShowSaveDialog(false);
    }
  }, [onSavePreset, newPresetName, currentFilters]);

  const hasActiveFilters = Object.keys(currentFilters).length > 0;

  if (compact) {
    return (
      <div
        className={`flex flex-wrap gap-2 ${className}`}
        data-testid="filter-presets"
        role="group"
        aria-label="Filter presets"
      >
        {allPresets.map((preset) => {
          const isActive = filtersMatchPreset(currentFilters, preset.filters);
          return (
            <button
              key={preset.id}
              type="button"
              className={`
                inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full
                transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500
                ${
                  isActive
                    ? 'bg-blue-100 text-blue-800 border-2 border-blue-500'
                    : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                }
              `}
              onClick={() => handleApplyPreset(preset)}
              aria-pressed={isActive}
              data-testid={`preset-${preset.id}`}
            >
              <PresetIcon type={preset.icon} />
              <span>{preset.name}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={`space-y-3 ${className}`}
      data-testid="filter-presets"
      role="group"
      aria-label="Filter presets"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">Quick Filters</h3>
        {onSavePreset && hasActiveFilters && (
          <button
            type="button"
            className="text-xs text-blue-600 hover:text-blue-800 focus:outline-none"
            onClick={() => setShowSaveDialog(true)}
            data-testid="save-preset-button"
          >
            Save current as preset
          </button>
        )}
      </div>

      {/* Preset list */}
      <div className="space-y-1.5">
        {allPresets.map((preset) => {
          const isActive = filtersMatchPreset(currentFilters, preset.filters);
          return (
            <div
              key={preset.id}
              className={`
                flex items-center justify-between p-2 rounded-lg
                transition-colors cursor-pointer
                ${
                  isActive
                    ? 'bg-blue-50 border border-blue-200'
                    : 'bg-gray-50 border border-transparent hover:bg-gray-100'
                }
              `}
              data-testid={`preset-${preset.id}`}
            >
              <button
                type="button"
                className="flex items-center gap-2 flex-1 text-left focus:outline-none"
                onClick={() => handleApplyPreset(preset)}
                aria-pressed={isActive}
              >
                <PresetIcon type={preset.icon} />
                <div>
                  <p
                    className={`text-sm font-medium ${
                      isActive ? 'text-blue-800' : 'text-gray-800'
                    }`}
                  >
                    {preset.name}
                  </p>
                  {preset.description && (
                    <p className="text-xs text-gray-500">{preset.description}</p>
                  )}
                </div>
              </button>
              {!preset.isSystem && onDeletePreset && (
                <button
                  type="button"
                  className="p-1 text-gray-400 hover:text-red-500 focus:outline-none"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeletePreset(preset.id);
                  }}
                  aria-label={`Delete ${preset.name} preset`}
                  data-testid={`delete-preset-${preset.id}`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Save preset dialog */}
      {showSaveDialog && (
        <div
          className="p-3 bg-gray-50 rounded-lg border border-gray-200"
          data-testid="save-preset-dialog"
        >
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Preset Name
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter preset name"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              data-testid="preset-name-input"
              autoFocus
            />
            <button
              type="button"
              className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 disabled:bg-blue-300"
              onClick={handleSavePreset}
              disabled={!newPresetName.trim()}
              data-testid="confirm-save-preset"
            >
              Save
            </button>
            <button
              type="button"
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
              onClick={() => {
                setShowSaveDialog(false);
                setNewPresetName('');
              }}
              data-testid="cancel-save-preset"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Screen reader status */}
      <div className="sr-only" role="status" aria-live="polite">
        {allPresets.filter((p) => filtersMatchPreset(currentFilters, p.filters)).length > 0
          ? `Active preset: ${allPresets.find((p) => filtersMatchPreset(currentFilters, p.filters))?.name}`
          : 'No preset active'}
      </div>
    </div>
  );
}
