/**
 * Lighthouse CI Configuration
 *
 * This configuration file defines performance, accessibility, and best practices
 * thresholds for the Customer Success Dashboard.
 *
 * Usage:
 *   npx lighthouse --config-path=lighthouse.config.js http://localhost:5173
 *
 * Or use Lighthouse CI:
 *   npm install -g @lhci/cli
 *   lhci autorun
 */

export default {
  ci: {
    collect: {
      // Number of runs to collect for each URL
      numberOfRuns: 3,
      // URLs to test (adjust port as needed)
      url: [
        'http://localhost:5173/',
        'http://localhost:5173/customers',
        'http://localhost:5173/import',
      ],
      // Start server command
      startServerCommand: 'npm run preview',
      startServerReadyPattern: 'Local:',
      startServerReadyTimeout: 30000,
      // Browser settings
      settings: {
        preset: 'desktop',
        throttling: {
          cpuSlowdownMultiplier: 1,
        },
      },
    },
    assert: {
      // Performance assertions
      assertions: {
        // Performance score (0-1 scale)
        'categories:performance': ['error', { minScore: 0.8 }],
        // Accessibility score
        'categories:accessibility': ['error', { minScore: 0.9 }],
        // Best practices score
        'categories:best-practices': ['error', { minScore: 0.9 }],
        // SEO score (less critical for internal dashboard)
        'categories:seo': ['warn', { minScore: 0.7 }],

        // Core Web Vitals
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],

        // Additional performance metrics
        'speed-index': ['warn', { maxNumericValue: 3000 }],
        interactive: ['warn', { maxNumericValue: 3500 }],

        // Resource hints
        'uses-rel-preconnect': 'warn',
        'uses-rel-preload': 'warn',

        // Image optimization
        'uses-optimized-images': 'warn',
        'uses-webp-images': 'warn',
        'uses-responsive-images': 'warn',

        // JavaScript
        'unused-javascript': ['warn', { maxLength: 0 }],
        'modern-image-formats': 'warn',

        // Accessibility specifics
        'color-contrast': 'error',
        'document-title': 'error',
        'html-has-lang': 'error',
        'meta-viewport': 'error',
        'bypass': 'error',
        'image-alt': 'error',
        'link-name': 'error',
        'button-name': 'error',
      },
    },
    upload: {
      // Target for uploading results (optional)
      target: 'temporary-public-storage',
    },
  },
};
