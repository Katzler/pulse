# Screen Reader Testing Guide

This guide documents screen reader testing procedures and results for the Customer Success Dashboard.

## Supported Screen Readers

### Primary Testing

| Screen Reader | Operating System | Browser | Priority |
|--------------|------------------|---------|----------|
| NVDA | Windows | Firefox/Chrome | High |
| VoiceOver | macOS | Safari | High |
| VoiceOver | iOS | Safari | Medium |
| TalkBack | Android | Chrome | Medium |

### Secondary Testing

| Screen Reader | Operating System | Browser | Priority |
|--------------|------------------|---------|----------|
| JAWS | Windows | Chrome/Edge | Medium |
| Narrator | Windows | Edge | Low |

## Testing Checklist

### Navigation

- [ ] **Skip Links**: Skip to main content link is announced and functional
- [ ] **Landmarks**: All page regions are properly identified (header, nav, main, footer)
- [ ] **Navigation Menu**: Menu items are announced with their role and state
- [ ] **Active State**: Current page is announced in navigation
- [ ] **Focus Management**: Focus moves logically through interactive elements

### Dashboard Page

- [ ] **Page Title**: Page title is announced on load
- [ ] **Heading Hierarchy**: H1-H6 headings are in logical order
- [ ] **Metric Cards**: Each metric card announces its label and value
- [ ] **Charts**: Charts have accessible names and descriptions
- [ ] **Empty State**: Empty state message is announced clearly
- [ ] **Import CTA**: Import button is announced with its purpose

### Customer List Page

- [ ] **Table Structure**: Table announces column headers
- [ ] **Row Content**: Each row announces customer information
- [ ] **Sorting**: Sort state is announced for columns
- [ ] **Search**: Search input has proper label
- [ ] **Filters**: Filter controls are labeled and announce their state
- [ ] **Pagination**: Page navigation announces current page
- [ ] **Loading State**: Loading state is announced

### Import Page

- [ ] **File Input**: File upload area is announced
- [ ] **Drag/Drop**: Instructions are provided for drag and drop
- [ ] **File Selection**: Selected file name is announced
- [ ] **Validation Errors**: Errors are announced immediately
- [ ] **Success Message**: Import success is announced

### Customer Detail Page

- [ ] **Back Navigation**: Back link announces destination
- [ ] **Customer Header**: Name and status are announced
- [ ] **Health Score**: Score and classification are announced
- [ ] **Detail Sections**: Each section has a proper heading
- [ ] **Progress Bars**: Health breakdown bars announce values

## ARIA Attributes Used

### Roles

```html
<!-- Navigation landmarks -->
<nav role="navigation" aria-label="Main navigation">

<!-- Main content -->
<main role="main">

<!-- Tables -->
<table role="grid">

<!-- Status regions -->
<div role="status" aria-live="polite">

<!-- Alert messages -->
<div role="alert" aria-live="assertive">

<!-- Menu buttons -->
<button aria-haspopup="menu" aria-expanded="false">
```

### States and Properties

```html
<!-- Current page in navigation -->
<a aria-current="page">

<!-- Sort state -->
<th aria-sort="ascending">

<!-- Loading state -->
<div aria-busy="true">

<!-- Expanded/collapsed -->
<button aria-expanded="true/false">

<!-- Selected items -->
<option aria-selected="true">
```

### Labels

```html
<!-- Form inputs -->
<input aria-label="Search customers" />

<!-- Icons with meaning -->
<svg aria-label="Health score: Good">

<!-- Complex widgets -->
<div aria-labelledby="chart-title" aria-describedby="chart-description">
```

## Testing Procedures

### NVDA (Windows)

1. **Setup**
   - Download NVDA from nvaccess.org
   - Install and restart
   - Press Caps Lock + N to start NVDA

2. **Basic Navigation**
   - Use Arrow keys to read content
   - Press H to navigate by headings
   - Press T to navigate by tables
   - Press F to navigate by forms
   - Press B to navigate by buttons

3. **Testing Commands**
   - Caps Lock + Down Arrow: Read from current position
   - Caps Lock + Up Arrow: Read current line
   - Tab/Shift+Tab: Navigate focusable elements
   - Enter: Activate current element

### VoiceOver (macOS)

1. **Setup**
   - Press Cmd + F5 to enable VoiceOver
   - Or go to System Preferences > Accessibility > VoiceOver

2. **Basic Navigation**
   - VO + Right/Left Arrow: Navigate by item
   - VO + Cmd + H: Navigate by headings
   - VO + Cmd + T: Navigate by tables
   - VO + U: Open rotor for navigation

3. **Testing Commands**
   - VO = Control + Option
   - VO + A: Read from current position
   - VO + Space: Activate current element
   - Tab: Navigate focusable elements

### VoiceOver (iOS)

1. **Setup**
   - Settings > Accessibility > VoiceOver
   - Triple-click Home/Side button for quick toggle

2. **Gestures**
   - Swipe right: Next item
   - Swipe left: Previous item
   - Double tap: Activate
   - Rotor (two-finger rotate): Change navigation mode

## Known Issues and Workarounds

### Chart Accessibility

**Issue**: Recharts library provides limited screen reader support for chart data.

**Workarounds**:
- All charts have an accessible `aria-label` describing the chart type and purpose
- Data tables are provided as an alternative view (planned)
- Key insights are summarized in text form

### Dynamic Content

**Issue**: Dynamic content updates may not be announced automatically.

**Workarounds**:
- Use `aria-live="polite"` for non-critical updates
- Use `aria-live="assertive"` for important status changes
- Loading states announce "Loading..." and completion status

### Modal Dialogs

**Issue**: Focus management in modals.

**Workarounds**:
- Focus is trapped within modal when open
- Focus returns to trigger element on close
- Escape key closes modal

## Test Results Template

Use this template to document screen reader testing results:

```markdown
## Test Session

- **Date**: YYYY-MM-DD
- **Tester**: Name
- **Screen Reader**: NVDA/VoiceOver/etc
- **Version**: X.X
- **Browser**: Chrome/Firefox/Safari
- **Browser Version**: XXX

### Results

| Page | Test Case | Pass/Fail | Notes |
|------|-----------|-----------|-------|
| Dashboard | Page title announced | Pass | |
| Dashboard | Metric cards readable | Pass | |
| Dashboard | Charts have descriptions | Pass | |
| ... | ... | ... | ... |

### Issues Found

1. **Issue**: Description
   - **Severity**: Critical/Major/Minor
   - **Steps to Reproduce**: ...
   - **Expected**: ...
   - **Actual**: ...
```

## Automated Accessibility Testing

In addition to manual screen reader testing, we use automated tools:

### vitest-axe

All components have accessibility tests using `vitest-axe`:

```typescript
import { axe, toHaveNoViolations } from 'vitest-axe';

expect.extend(toHaveNoViolations);

it('should have no accessibility violations', async () => {
  const { container } = render(<MyComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### axe DevTools

- Install axe DevTools browser extension
- Open DevTools > axe DevTools tab
- Click "Analyze" to scan current page
- Review and fix any issues

### Lighthouse

Run Lighthouse accessibility audit:

```bash
npx lighthouse http://localhost:5173 --only-categories=accessibility
```

## Resources

- [NVDA User Guide](https://www.nvaccess.org/files/nvda/documentation/userGuide.html)
- [VoiceOver User Guide](https://support.apple.com/guide/voiceover/welcome/mac)
- [WebAIM Screen Reader Survey](https://webaim.org/projects/screenreadersurvey9/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [MDN ARIA documentation](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA)
