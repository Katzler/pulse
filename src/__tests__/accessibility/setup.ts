/**
 * Accessibility testing setup with vitest-axe
 *
 * Note: vitest-axe matchers are extended globally in __tests__/setup.ts
 * via 'vitest-axe/extend-expect' import.
 */
import { axe, type AxeMatchers } from 'vitest-axe';
import { expect, type Assertion } from 'vitest';

/**
 * Run axe accessibility checks on a container element
 * @param container - The HTML element to test
 * @param options - Optional axe configuration
 */
export async function testAccessibility(
  container: HTMLElement,
  options?: Parameters<typeof axe>[1]
): Promise<void> {
  const results = await axe(container, {
    // Default rules that align with WCAG 2.1 AA
    rules: {
      // Ignore color-contrast for now as it's often context-dependent
      // and can be tested separately
      'color-contrast': { enabled: true },
    },
    ...options,
  });
  // Use type assertion to access vitest-axe matcher
  (expect(results) as Assertion & AxeMatchers).toHaveNoViolations();
}

/**
 * Test that keyboard navigation works correctly
 * @param element - Element to test focus on
 */
export function expectFocusable(element: HTMLElement) {
  expect(element.tabIndex).toBeGreaterThanOrEqual(0);
}

/**
 * Test that an element has proper ARIA attributes
 */
export function expectAriaLabel(element: HTMLElement, label: string | RegExp) {
  const ariaLabel = element.getAttribute('aria-label');
  const ariaLabelledBy = element.getAttribute('aria-labelledby');

  if (ariaLabel) {
    if (typeof label === 'string') {
      expect(ariaLabel).toBe(label);
    } else {
      expect(ariaLabel).toMatch(label);
    }
  } else if (ariaLabelledBy) {
    const labelElement = document.getElementById(ariaLabelledBy);
    expect(labelElement).not.toBeNull();
    if (typeof label === 'string') {
      expect(labelElement?.textContent).toBe(label);
    } else {
      expect(labelElement?.textContent).toMatch(label);
    }
  } else {
    throw new Error('Element has no aria-label or aria-labelledby');
  }
}

/**
 * Verify heading hierarchy is correct (h1 -> h2 -> h3, etc.)
 */
export function expectValidHeadingHierarchy(container: HTMLElement) {
  const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
  let lastLevel = 0;

  headings.forEach((heading) => {
    const level = parseInt(heading.tagName[1], 10);
    // Allow same level or one level deeper, or going back up
    if (level > lastLevel + 1 && lastLevel !== 0) {
      throw new Error(
        `Invalid heading hierarchy: h${lastLevel} followed by h${level}. ` +
          `Headings should not skip levels.`
      );
    }
    lastLevel = level;
  });
}
