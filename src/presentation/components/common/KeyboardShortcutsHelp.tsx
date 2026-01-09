import type { JSX } from 'react';
import { useCallback, useEffect, useRef } from 'react';

import {
  formatShortcut,
  groupShortcutsByCategory,
  type KeyboardShortcut,
} from '@presentation/hooks';

/**
 * Props for KeyboardShortcutsHelp component
 */
export interface KeyboardShortcutsHelpProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** List of shortcuts to display */
  shortcuts: KeyboardShortcut[];
  /** Modal title */
  title?: string;
}

/**
 * Close icon component
 */
function CloseIcon(): JSX.Element {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

/**
 * Keyboard icon component
 */
function KeyboardIcon(): JSX.Element {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 17H5a2 2 0 01-2-2V7a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4m-4 0v4m0-4h4m-4 0H9"
      />
    </svg>
  );
}

/**
 * Single shortcut row display
 */
interface ShortcutRowProps {
  shortcut: KeyboardShortcut;
}

function ShortcutRow({ shortcut }: ShortcutRowProps): JSX.Element {
  const formattedKey = formatShortcut(shortcut);

  return (
    <div
      className="flex items-center justify-between py-2 px-1"
      data-testid={`shortcut-row-${typeof shortcut.key === 'string' ? shortcut.key : shortcut.key.join('-')}`}
    >
      <span className="text-sm text-gray-600 dark:text-gray-400">{shortcut.description ?? 'No description'}</span>
      <kbd
        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-mono bg-gray-100 dark:bg-surface-700 text-gray-700 dark:text-gray-300 rounded border border-gray-200 dark:border-surface-600 shadow-sm"
        aria-label={`Keyboard shortcut: ${formattedKey}`}
      >
        {formattedKey}
      </kbd>
    </div>
  );
}

/**
 * Category section with shortcuts
 */
interface CategorySectionProps {
  category: string;
  shortcuts: KeyboardShortcut[];
}

function CategorySection({ category, shortcuts }: CategorySectionProps): JSX.Element {
  // Filter out shortcuts without descriptions
  const displayableShortcuts = shortcuts.filter((s) => s.description);

  if (displayableShortcuts.length === 0) return <></>;

  return (
    <div className="mb-6 last:mb-0" data-testid={`category-${category.toLowerCase().replace(/\s+/g, '-')}`}>
      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
        {category}
      </h3>
      <div className="divide-y divide-gray-100 dark:divide-surface-700">
        {displayableShortcuts.map((shortcut, index) => (
          <ShortcutRow key={`${category}-${index}`} shortcut={shortcut} />
        ))}
      </div>
    </div>
  );
}

/**
 * KeyboardShortcutsHelp displays a modal with all available keyboard shortcuts.
 * Shortcuts are grouped by category and displayed with their key combinations.
 *
 * @example
 * <KeyboardShortcutsHelp
 *   isOpen={showHelp}
 *   onClose={() => setShowHelp(false)}
 *   shortcuts={allShortcuts}
 * />
 */
export function KeyboardShortcutsHelp({
  isOpen,
  onClose,
  shortcuts,
  title = 'Keyboard Shortcuts',
}: KeyboardShortcutsHelpProps): JSX.Element | null {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Group shortcuts by category
  const groupedShortcuts = groupShortcutsByCategory(shortcuts);

  // Sort categories: Global first, then alphabetically
  const sortedCategories = Array.from(groupedShortcuts.keys()).sort((a, b) => {
    if (a === 'Global') return -1;
    if (b === 'Global') return 1;
    return a.localeCompare(b);
  });

  // Handle Escape key to close
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        event.preventDefault();
        onClose();
      }
    },
    [isOpen, onClose]
  );

  // Focus trap and keyboard handling
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    // Focus the close button when modal opens
    closeButtonRef.current?.focus();

    // Add escape key listener
    document.addEventListener('keydown', handleKeyDown);

    // Store previously focused element
    const previouslyFocused = document.activeElement as HTMLElement | null;

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Return focus to previously focused element
      previouslyFocused?.focus();
    };
  }, [isOpen, handleKeyDown]);

  // Handle click outside to close
  const handleBackdropClick = useCallback(
    (event: React.MouseEvent) => {
      if (event.target === event.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="keyboard-shortcuts-title"
      data-testid="keyboard-shortcuts-modal"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-lg max-h-[80vh] bg-white dark:bg-surface-800 rounded-xl shadow-xl overflow-hidden"
        role="document"
      >
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 bg-white dark:bg-surface-800 border-b border-gray-200 dark:border-surface-700">
          <div className="flex items-center gap-2">
            <KeyboardIcon />
            <h2 id="keyboard-shortcuts-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-surface-800"
            onClick={onClose}
            aria-label="Close keyboard shortcuts help"
            data-testid="close-shortcuts-modal"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto max-h-[calc(80vh-80px)]">
          {sortedCategories.length > 0 ? (
            sortedCategories.map((category) => {
              const categoryShortcuts = groupedShortcuts.get(category);
              if (!categoryShortcuts) return null;
              return (
                <CategorySection
                  key={category}
                  category={category}
                  shortcuts={categoryShortcuts}
                />
              );
            })
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
              No keyboard shortcuts available.
            </p>
          )}
        </div>

        {/* Footer hint */}
        <div className="sticky bottom-0 px-6 py-3 bg-gray-50 dark:bg-surface-900 border-t border-gray-200 dark:border-surface-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Press <kbd className="px-1.5 py-0.5 text-xs font-mono bg-gray-200 dark:bg-surface-700 dark:text-gray-300 rounded">Esc</kbd> or click outside to close
          </p>
        </div>
      </div>
    </div>
  );
}
