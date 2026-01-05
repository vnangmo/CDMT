# CDMT Application - Compatibility Documentation

**Document Version:** 1.0
**Last Updated:** 2026-01-05
**Sprint:** 8.2 - Security & Testing

---

## Overview

This document describes the browser and device compatibility implementation for the CDMT application, in compliance with the non-functional requirements REQ-COMP-01 and REQ-COMP-02.

---

## 1. Browser Compatibility (REQ-COMP-01)

### 1.1 Supported Browsers

| Browser | Minimum Version | Status |
|---------|-----------------|--------|
| Google Chrome | N-1 (2 latest versions) | ✅ Supported |
| Mozilla Firefox | N-1 (2 latest versions) | ✅ Supported |
| Microsoft Edge | N-1 (2 latest versions) | ✅ Supported |
| Apple Safari | N-1 (2 latest versions) | ✅ Supported |

### 1.2 Browserslist Configuration

**File:** `frontend/package.json`

```json
{
  "browserslist": {
    "production": [
      "last 2 chrome versions",
      "last 2 firefox versions",
      "last 2 edge versions",
      "last 2 safari versions",
      "not dead"
    ],
    "development": [
      "last 2 chrome versions",
      "last 2 firefox versions",
      "last 2 edge versions",
      "last 2 safari versions"
    ]
  }
}
```

### 1.3 Cross-Browser CSS Fixes

**File:** `frontend/src/index.css`

The following CSS normalizations ensure consistent behavior across browsers:

```css
/* Consistent box-sizing */
*, *::before, *::after {
  box-sizing: border-box;
}

/* Normalize scroll behavior */
html {
  scroll-behavior: smooth;
  -webkit-text-size-adjust: 100%; /* iOS orientation change fix */
}

/* Button normalization */
button {
  font-family: inherit;
  -webkit-appearance: button;
}

/* Focus visible for accessibility */
:focus-visible {
  outline: 2px solid #1976d2;
  outline-offset: 2px;
}

/* Safari flexbox fix */
@supports (-webkit-touch-callout: none) {
  .flex-container {
    display: -webkit-box;
    display: -webkit-flex;
    display: flex;
  }
}
```

### 1.4 Polyfills and Transpilation

- **Babel**: Configured via react-scripts to transpile modern JavaScript
- **Autoprefixer**: Automatically adds vendor prefixes based on browserslist
- **Core-js**: Polyfills for modern JavaScript features

---

## 2. Device Compatibility (REQ-COMP-02)

### 2.1 Supported Devices

| Device Type | Screen Size | Support Level |
|-------------|-------------|---------------|
| Desktop | 1200px+ | Full functionality |
| Tablet Landscape | 992px - 1199px | Full functionality |
| Tablet Portrait | 768px - 991px | Full functionality (consultation) |
| Mobile | < 768px | Basic support (reference only) |

### 2.2 Responsive Breakpoints

**File:** `frontend/src/styles/responsive.css`

```css
/* Desktop (1200px+) */
@media (min-width: 1200px) { ... }

/* Tablet Landscape (992px - 1199px) */
@media (min-width: 992px) and (max-width: 1199px) { ... }

/* Tablet Portrait (768px - 991px) */
@media (min-width: 768px) and (max-width: 991px) { ... }

/* Small Tablet / Large Mobile (< 768px) */
@media (max-width: 767px) { ... }
```

### 2.3 CSS Custom Properties

```css
:root {
  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;

  /* Container widths */
  --container-max-width: 1400px;
  --sidebar-width: 240px;

  /* Typography scale */
  --font-size-base: 14px;
  --font-size-sm: 12px;
  --font-size-lg: 16px;
}
```

### 2.4 Tablet-Specific Optimizations

- **Touch-friendly targets**: Minimum 44px height/width for buttons and inputs
- **Touch-friendly spacing**: Increased padding on table cells and menu items
- **Collapsible sidebar**: Adaptive sidebar for portrait orientation
- **Responsive grids**: 4-column → 3-column → 2-column → 1-column layouts

### 2.5 Orientation Support

```css
/* Portrait tablet adjustments */
@media (orientation: portrait) and (min-width: 768px) {
  .sidebar-collapsible {
    position: fixed;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }
}

/* Landscape tablet - prioritize horizontal space */
@media (orientation: landscape) and (min-width: 768px) and (max-width: 1199px) {
  .dashboard-sidebar {
    width: 180px !important;
  }
}
```

### 2.6 High DPI / Retina Display Support

```css
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  /* Sharper borders */
  .MuiOutlinedInput-notchedOutline,
  .MuiCard-root,
  table {
    border-width: 0.5px;
  }

  /* Sharper icons */
  .MuiSvgIcon-root {
    shape-rendering: geometricPrecision;
  }
}
```

---

## 3. Print Optimization (REQ-COMP-02)

### 3.1 Print Stylesheet

**File:** `frontend/src/styles/print.css`

### 3.2 Page Setup

```css
@page {
  size: A4;
  margin: 15mm 10mm;
}

@page :first {
  margin-top: 20mm;
}
```

### 3.3 Hidden Elements in Print

The following elements are automatically hidden when printing:

- Navigation sidebar and app bar
- Interactive buttons and form controls
- Search fields and filter controls
- Notifications and tooltips
- Pagination controls

### 3.4 Print-Optimized Tables

- Table headers repeat on each page (`display: table-header-group`)
- Zebra striping preserved with `print-color-adjust: exact`
- Page breaks avoided inside table rows
- Reduced font size (9pt) for data density

### 3.5 Print-Specific Classes

| Class | Description |
|-------|-------------|
| `.print-only` | Visible only when printing |
| `.no-print`, `.hide-print` | Hidden when printing |
| `.page-break-before` | Force page break before element |
| `.page-break-after` | Force page break after element |
| `.no-page-break` | Prevent page break inside element |

### 3.6 Print Header and Footer

```html
<!-- Add to printable pages -->
<div class="print-header">
  <h1>CDMT - Ministry of Budget</h1>
  <div class="print-date">Generated: 2026-01-05</div>
</div>

<div class="print-footer">
  Republic of Djibouti - Confidential Document
</div>
```

---

## 4. Utility Classes

### 4.1 Visibility Classes

| Class | Desktop | Tablet | Mobile |
|-------|---------|--------|--------|
| `.hide-desktop` | Hidden | Visible | Visible |
| `.hide-tablet` | Visible | Hidden | Visible |
| `.hide-mobile` | Visible | Visible | Hidden |

### 4.2 Layout Classes

| Class | Description |
|-------|-------------|
| `.table-responsive` | Horizontal scroll wrapper for tables |
| `.full-width-mobile` | Full width on mobile, auto on larger screens |
| `.stack-tablet` | Row on desktop, column on tablet/mobile |
| `.grid-2-cols` | 2-column grid (responsive) |
| `.grid-3-cols` | 3-column grid (responsive) |
| `.grid-4-cols` | 4-column grid (responsive) |

---

## 5. Testing Recommendations

### 5.1 Browser Testing Checklist

- [ ] Chrome (latest and N-1)
- [ ] Firefox (latest and N-1)
- [ ] Edge (latest and N-1)
- [ ] Safari (latest and N-1)

### 5.2 Device Testing Checklist

- [ ] Desktop (1920x1080, 1440x900)
- [ ] Tablet Landscape (1024x768)
- [ ] Tablet Portrait (768x1024)
- [ ] iPad Pro (1366x1024)

### 5.3 Print Testing Checklist

- [ ] TOFE reports print correctly
- [ ] CBMT tables fit on page
- [ ] Charts render in print
- [ ] Page breaks occur at appropriate points
- [ ] Headers/footers appear on all pages

---

## 6. Known Limitations

1. **Safari**: Requires `-webkit-` prefixes for some flex properties
2. **Print Colors**: Some browsers require user to enable "Print backgrounds"
3. **Mobile**: Application is optimized for tablets; mobile support is basic

---

**Document Owner:** Frontend Team
**Approved By:** Tech Lead
**Next Review:** 2026-04-01
