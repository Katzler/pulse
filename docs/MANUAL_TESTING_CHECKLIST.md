# Manual Browser Testing Checklist

This document provides comprehensive manual testing checklists for cross-browser compatibility testing of the Customer Success Dashboard.

## Pre-Test Setup

### Environment Setup

1. Clear browser cache and cookies
2. Disable browser extensions that may interfere with testing
3. Set browser to standard zoom (100%)
4. Enable JavaScript (if disabled)
5. Note browser version and OS version

### Test Data Setup

1. Prepare test CSV file with sample customer data
2. Have test accounts ready if applicable
3. Document any test-specific configurations

---

## Browser-Specific Checklists

### Chrome (Latest)

#### Visual Rendering
- [ ] Fonts render correctly (Inter, system fonts)
- [ ] Colors match design specifications
- [ ] Icons (SVG) display properly
- [ ] Gradients render smoothly
- [ ] Border radius applied correctly
- [ ] Box shadows visible
- [ ] Dark mode toggle works
- [ ] Dark mode colors correct

#### Layout & Responsiveness
- [ ] Desktop layout (1920px) displays correctly
- [ ] Laptop layout (1366px) displays correctly
- [ ] Tablet layout (768px) displays correctly
- [ ] Mobile layout (375px) displays correctly
- [ ] Flexbox layouts work
- [ ] Grid layouts work
- [ ] Sticky header functions
- [ ] Scrolling behavior smooth

#### Functionality
- [ ] File upload works
- [ ] CSV parsing completes
- [ ] Charts render and animate
- [ ] Sorting works
- [ ] Search/filter works
- [ ] Navigation works
- [ ] Theme toggle persists
- [ ] Form validation works

#### Performance
- [ ] Initial page load < 3s
- [ ] Navigation transitions smooth
- [ ] No layout shift on load
- [ ] Charts animate smoothly
- [ ] No memory leaks visible

---

### Firefox (Latest)

#### Visual Rendering
- [ ] Fonts render correctly
- [ ] Colors match specifications
- [ ] Icons display properly
- [ ] Gradients render smoothly
- [ ] Border radius applied
- [ ] Box shadows visible
- [ ] Dark mode works
- [ ] Scrollbar styling (may differ)

#### Layout & Responsiveness
- [ ] Desktop layout correct
- [ ] Laptop layout correct
- [ ] Tablet layout correct
- [ ] Mobile layout correct
- [ ] Flexbox layouts work
- [ ] Grid layouts work
- [ ] Sticky header functions
- [ ] Scroll behavior works

#### Functionality
- [ ] File upload works
- [ ] CSV parsing completes
- [ ] Charts render correctly
- [ ] Sorting works
- [ ] Search/filter works
- [ ] Navigation works
- [ ] Theme toggle works
- [ ] Form validation works

#### Firefox-Specific
- [ ] :focus-visible styling works
- [ ] Print styles work
- [ ] Developer tools show no errors

---

### Safari (Latest)

#### Visual Rendering
- [ ] Fonts render correctly (-webkit-font-smoothing)
- [ ] Colors match specifications
- [ ] Icons display properly
- [ ] Gradients render smoothly
- [ ] Border radius applied
- [ ] Box shadows visible
- [ ] Dark mode works
- [ ] Backdrop blur works

#### Layout & Responsiveness
- [ ] Desktop layout correct
- [ ] Laptop layout correct
- [ ] Tablet layout correct
- [ ] Mobile layout correct
- [ ] Flexbox layouts work
- [ ] Grid layouts work
- [ ] Sticky header functions
- [ ] Overscroll behavior works

#### Safari-Specific
- [ ] Date parsing works correctly
- [ ] File input styling works
- [ ] Safe area insets respected
- [ ] -webkit prefixes applied
- [ ] Touch events work (if testing on touch device)

#### Functionality
- [ ] File upload works
- [ ] CSV parsing completes
- [ ] Charts render correctly
- [ ] All interactions work
- [ ] LocalStorage works

---

### Edge (Latest)

#### Visual Rendering
- [ ] Fonts render correctly
- [ ] Colors match specifications
- [ ] Icons display properly
- [ ] All CSS features work
- [ ] Dark mode works

#### Functionality
- [ ] All features work (same as Chrome)
- [ ] Edge-specific features (if any)

---

### Mobile Safari (iOS)

#### Visual Rendering
- [ ] Fonts render correctly
- [ ] Touch targets minimum 44x44px
- [ ] Viewport scaling disabled
- [ ] Safe area insets applied
- [ ] Dark mode works

#### Touch Interactions
- [ ] Tap works correctly
- [ ] Scroll is smooth
- [ ] Swipe gestures work (if applicable)
- [ ] Long press doesn't trigger issues
- [ ] Pinch-to-zoom disabled on inputs

#### iOS-Specific
- [ ] Keyboard doesn't overlap inputs
- [ ] Form inputs zoom correctly
- [ ] Date inputs work
- [ ] File upload works
- [ ] Add to Home Screen works

---

### Chrome Mobile (Android)

#### Visual Rendering
- [ ] Fonts render correctly
- [ ] Touch targets adequate
- [ ] Material Design touches (if applicable)
- [ ] Dark mode works

#### Touch Interactions
- [ ] Tap works correctly
- [ ] Scroll is smooth
- [ ] Back gesture works
- [ ] Keyboard behavior correct

---

## Feature-Specific Checklists

### File Import Flow

| Step | Expected Result | Chrome | Firefox | Safari | Edge |
|------|-----------------|--------|---------|--------|------|
| Navigate to /import | Import page loads | [ ] | [ ] | [ ] | [ ] |
| Click upload area | File dialog opens | [ ] | [ ] | [ ] | [ ] |
| Select CSV file | File name displayed | [ ] | [ ] | [ ] | [ ] |
| Click Import | Progress shown | [ ] | [ ] | [ ] | [ ] |
| Import complete | Success message | [ ] | [ ] | [ ] | [ ] |
| View Customers | Navigate to list | [ ] | [ ] | [ ] | [ ] |
| Invalid file | Error displayed | [ ] | [ ] | [ ] | [ ] |

### Dashboard

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Page loads | [ ] | [ ] | [ ] | [ ] |
| Metrics display | [ ] | [ ] | [ ] | [ ] |
| Health chart renders | [ ] | [ ] | [ ] | [ ] |
| MRR chart renders | [ ] | [ ] | [ ] | [ ] |
| Channel chart renders | [ ] | [ ] | [ ] | [ ] |
| Chart tooltips work | [ ] | [ ] | [ ] | [ ] |
| Chart click navigation | [ ] | [ ] | [ ] | [ ] |
| Empty state (no data) | [ ] | [ ] | [ ] | [ ] |
| Dark mode | [ ] | [ ] | [ ] | [ ] |

### Customer List

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Table renders | [ ] | [ ] | [ ] | [ ] |
| Sort by column | [ ] | [ ] | [ ] | [ ] |
| Search works | [ ] | [ ] | [ ] | [ ] |
| Health filter | [ ] | [ ] | [ ] | [ ] |
| Country filter | [ ] | [ ] | [ ] | [ ] |
| Clear filters | [ ] | [ ] | [ ] | [ ] |
| Pagination | [ ] | [ ] | [ ] | [ ] |
| Row click | [ ] | [ ] | [ ] | [ ] |
| Mobile card view | [ ] | [ ] | [ ] | [ ] |

### Customer Detail

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Page loads | [ ] | [ ] | [ ] | [ ] |
| Back navigation | [ ] | [ ] | [ ] | [ ] |
| Health gauge | [ ] | [ ] | [ ] | [ ] |
| Info sections | [ ] | [ ] | [ ] | [ ] |
| Health breakdown | [ ] | [ ] | [ ] | [ ] |
| Comparative metrics | [ ] | [ ] | [ ] | [ ] |
| Not found state | [ ] | [ ] | [ ] | [ ] |

---

## Accessibility Checklist

### Keyboard Navigation

| Test | Result |
|------|--------|
| Tab order is logical | [ ] |
| Focus visible on all elements | [ ] |
| Skip link works | [ ] |
| Escape closes modals/dropdowns | [ ] |
| Enter/Space activate buttons | [ ] |
| Arrow keys in menus | [ ] |

### Screen Reader

| Test | NVDA | VoiceOver |
|------|------|-----------|
| Page title announced | [ ] | [ ] |
| Headings navigable | [ ] | [ ] |
| Landmarks present | [ ] | [ ] |
| Tables have headers | [ ] | [ ] |
| Forms have labels | [ ] | [ ] |
| Errors announced | [ ] | [ ] |
| Loading announced | [ ] | [ ] |

### Visual

| Test | Result |
|------|--------|
| Color contrast 4.5:1 | [ ] |
| Text resizable to 200% | [ ] |
| No information by color only | [ ] |
| Focus indicator visible | [ ] |
| Reduced motion respected | [ ] |

---

## Performance Checklist

### Load Times

| Metric | Target | Actual |
|--------|--------|--------|
| First Contentful Paint | < 1.8s | |
| Largest Contentful Paint | < 2.5s | |
| Time to Interactive | < 3.5s | |
| Cumulative Layout Shift | < 0.1 | |

### Runtime Performance

| Test | Result |
|------|--------|
| Scroll performance 60fps | [ ] |
| Animation performance 60fps | [ ] |
| No memory leaks | [ ] |
| Charts responsive | [ ] |

---

## Test Results Template

```
Browser: [Name] [Version]
OS: [Name] [Version]
Date: [YYYY-MM-DD]
Tester: [Name]

Pass: X / Total
Fail: X / Total

Issues Found:
1. [Description] - [Severity: Critical/Major/Minor]
2. ...

Screenshots/Videos:
- [Link to screenshot]
- [Link to video]

Notes:
- [Any additional observations]
```

---

## Reporting Issues

When reporting browser-specific issues, include:

1. **Browser & Version**: e.g., Chrome 120.0.6099.109
2. **Operating System**: e.g., macOS 14.2
3. **Steps to Reproduce**: Numbered steps
4. **Expected Result**: What should happen
5. **Actual Result**: What actually happened
6. **Screenshots/Video**: Visual evidence
7. **Console Errors**: Any JavaScript errors
8. **Network Tab**: Any failed requests
