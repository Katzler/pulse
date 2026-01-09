# Browser Compatibility

This document outlines the browser compatibility for the Pulse Customer Success Dashboard.

## Supported Browsers

### Primary Support (Actively Tested)

The application is tested against these browsers in our E2E test suite using Playwright:

| Browser | Minimum Version | Status |
|---------|----------------|--------|
| Chrome/Chromium | 120+ | ✅ Fully Supported |
| Firefox | 120+ | ✅ Fully Supported |
| Safari/WebKit | 17+ | ✅ Fully Supported |

### Extended Support

These browsers should work but are not actively tested:

| Browser | Minimum Version | Status |
|---------|----------------|--------|
| Microsoft Edge | 120+ | ✅ Expected to work (Chromium-based) |
| Opera | 100+ | ✅ Expected to work (Chromium-based) |
| Brave | Latest | ✅ Expected to work (Chromium-based) |

### Not Supported

| Browser | Notes |
|---------|-------|
| Internet Explorer | Not supported - EOL product |
| Safari < 17 | May have issues with modern CSS features |
| Chrome < 100 | May have issues with CSS Container Queries |

## Feature Compatibility

### CSS Features Used

| Feature | Chrome | Firefox | Safari | Notes |
|---------|--------|---------|--------|-------|
| Tailwind CSS v4 | ✅ | ✅ | ✅ | Uses modern CSS features |
| CSS Grid | ✅ | ✅ | ✅ | Full support |
| CSS Flexbox | ✅ | ✅ | ✅ | Full support |
| CSS Custom Properties | ✅ | ✅ | ✅ | Used for theming |
| Dark Mode (prefers-color-scheme) | ✅ | ✅ | ✅ | System preference detection |
| CSS Container Queries | ✅ | ✅ | ✅ | Used for responsive components |

### JavaScript Features Used

| Feature | Chrome | Firefox | Safari | Notes |
|---------|--------|---------|--------|-------|
| ES2022+ | ✅ | ✅ | ✅ | Transpiled via Vite |
| Async/Await | ✅ | ✅ | ✅ | Native support |
| Optional Chaining | ✅ | ✅ | ✅ | Native support |
| Nullish Coalescing | ✅ | ✅ | ✅ | Native support |
| Private Class Fields | ✅ | ✅ | ✅ | Native support |
| Intl API | ✅ | ✅ | ✅ | Used for date/number formatting |

### API Features Used

| Feature | Chrome | Firefox | Safari | Notes |
|---------|--------|---------|--------|-------|
| File API | ✅ | ✅ | ✅ | CSV file upload |
| Blob API | ✅ | ✅ | ✅ | CSV export download |
| localStorage | ✅ | ✅ | ✅ | Theme preference persistence |
| URL API | ✅ | ✅ | ✅ | Blob URL creation |

## Responsive Breakpoints

The application is tested at these viewport sizes:

| Breakpoint | Width | Device Type |
|------------|-------|-------------|
| Mobile | 375px | iPhone SE, small phones |
| Tablet | 768px | iPad, tablets |
| Desktop | 1024px | Laptops, small monitors |
| Large Desktop | 1920px | Full HD monitors |

## Running Cross-Browser Tests

### Local Testing

Run E2E tests against all browsers:

```bash
# All browsers
npm run test:e2e

# Specific browser
npm run test:e2e -- --project=chromium
npm run test:e2e -- --project=firefox
npm run test:e2e -- --project=webkit

# With headed mode (see browser)
npm run test:e2e:headed
```

### CI/CD Testing

The Playwright configuration supports parallel testing across browsers in CI:

```bash
# CI mode runs with single worker and retries
CI=true npm run test:e2e
```

## Known Issues

### Safari/WebKit

1. **Scroll behavior**: Safari may handle scroll restoration differently after navigation
2. **Date input**: Native date pickers behave differently than Chrome

### Firefox

1. **CSS transitions**: Some subtle animation timing differences
2. **Focus styles**: Default focus outlines may appear slightly different

### Chrome

1. No known specific issues

## Accessibility Testing

Accessibility is tested using:

- **axe-core**: Automated WCAG 2.1 compliance testing
- **Keyboard navigation**: Manual testing for tab order and focus management
- **Screen reader**: Tested with VoiceOver (Safari) and NVDA (Chrome)

### WCAG 2.1 Compliance

| Criterion | Level | Status |
|-----------|-------|--------|
| Perceivable | A | ✅ Pass |
| Operable | A | ✅ Pass |
| Understandable | A | ✅ Pass |
| Robust | A | ✅ Pass |

Some known accessibility issues are documented and skipped in tests:

1. **FileUpload component**: Nested interactive elements (button containing input)
2. **Dashboard empty state**: Heading order jump (h1 to h3)

## Performance Considerations

### Bundle Size

The application is optimized for modern browsers with:

- Tree-shaking for unused code
- Code splitting via React lazy loading
- Modern JavaScript output (no legacy polyfills)

### Network

- Total bundle size: ~200KB gzipped (estimated)
- Initial load time target: < 2s on 3G
- Time to interactive target: < 3s on 3G

## Testing Matrix

| Test Type | Chrome | Firefox | Safari |
|-----------|--------|---------|--------|
| Unit Tests | ✅ | N/A | N/A |
| Integration Tests | ✅ | N/A | N/A |
| E2E Tests | ✅ | ✅ | ✅ |
| Accessibility Tests | ✅ | N/A | N/A |
| Performance Tests | ✅ | N/A | N/A |

## Updating Browser Support

To update browser support:

1. Update `playwright.config.ts` to add/remove browsers
2. Update this document
3. Run full test suite: `npm run test:e2e`
4. Update CI/CD configuration if needed
