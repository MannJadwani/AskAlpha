# Dark Theme System Guide

## Overview
The application uses a centralized CSS variable system in `app/globals.css` with **dark theme as the default**. This allows you to instantly change themes by modifying color values in one place.

## Theme Structure

### Current Theme: Dark Emerald/Teal (Premium Dark Green)
The application uses a professional dark theme with emerald/teal accents:

- **Primary**: Emerald colors (main brand color) - optimized for dark backgrounds
- **Secondary**: Teal colors (accent color) - complementary to primary
- **Tertiary**: Blue-gray colors (text and neutral elements) - high contrast for readability
- **Background**: Dark blue-gray (`#0f172a`) for comfortable viewing

## How to Change Themes

### Method 1: Update CSS Variables in globals.css

Edit the color values in `/app/globals.css` under the `:root` selector:

```css
:root {
  /* Primary Color System - Change these for new primary color */
  --primary-50: #ecfdf5;   /* Lightest */
  --primary-100: #d1fae5;
  --primary-200: #a7f3d0;
  --primary-300: #6ee7b7;
  --primary-400: #34d399;
  --primary-500: #10b981;  /* Base color */
  --primary-600: #059669;  /* Main brand color */
  --primary-700: #047857;
  --primary-800: #065f46;
  --primary-900: #064e3b;  /* Darkest */
  --primary-950: #022c22;
  
  /* Secondary Color System - Change these for new accent color */
  --secondary-50: #f0fdfa;
  /* ... etc */
}
```

### Method 2: Quick Theme Presets

Here are some popular color combinations you can copy-paste:

#### Blue Theme
```css
/* Primary - Blue */
--primary-50: #eff6ff;
--primary-100: #dbeafe;
--primary-200: #bfdbfe;
--primary-300: #93c5fd;
--primary-400: #60a5fa;
--primary-500: #3b82f6;
--primary-600: #2563eb;
--primary-700: #1d4ed8;
--primary-800: #1e40af;
--primary-900: #1e3a8a;

/* Secondary - Indigo */
--secondary-50: #eef2ff;
--secondary-100: #e0e7ff;
--secondary-200: #c7d2fe;
--secondary-300: #a5b4fc;
--secondary-400: #818cf8;
--secondary-500: #6366f1;
--secondary-600: #4f46e5;
--secondary-700: #4338ca;
--secondary-800: #3730a3;
--secondary-900: #312e81;
```

#### Purple Theme
```css
/* Primary - Purple */
--primary-50: #faf5ff;
--primary-100: #f3e8ff;
--primary-200: #e9d5ff;
--primary-300: #d8b4fe;
--primary-400: #c084fc;
--primary-500: #a855f7;
--primary-600: #9333ea;
--primary-700: #7c3aed;
--primary-800: #6b21a8;
--primary-900: #581c87;

/* Secondary - Pink */
--secondary-50: #fdf2f8;
--secondary-100: #fce7f3;
--secondary-200: #fbcfe8;
--secondary-300: #f9a8d4;
--secondary-400: #f472b6;
--secondary-500: #ec4899;
--secondary-600: #db2777;
--secondary-700: #be185d;
--secondary-800: #9d174d;
--secondary-900: #831843;
```

#### Orange Theme
```css
/* Primary - Orange */
--primary-50: #fff7ed;
--primary-100: #ffedd5;
--primary-200: #fed7aa;
--primary-300: #fdba74;
--primary-400: #fb923c;
--primary-500: #f97316;
--primary-600: #ea580c;
--primary-700: #c2410c;
--primary-800: #9a3412;
--primary-900: #7c2d12;

/* Secondary - Red */
--secondary-50: #fef2f2;
--secondary-100: #fee2e2;
--secondary-200: #fecaca;
--secondary-300: #fca5a5;
--secondary-400: #f87171;
--secondary-500: #ef4444;
--secondary-600: #dc2626;
--secondary-700: #b91c1c;
--secondary-800: #991b1b;
--secondary-900: #7f1d1d;
```

## CSS Classes Available

The system provides these utility classes:

### Background Colors
- `.bg-primary` - Main brand color
- `.bg-primary-50` to `.bg-primary-950` - Full color scale
- `.bg-primary-gradient` - Primary to secondary gradient
- `.bg-primary-gradient-soft` - Soft background gradient

### Text Colors
- `.text-primary` - Primary color text
- `.text-secondary` - Secondary color text
- `.text-tertiary` - Neutral text colors

### Borders
- `.border-primary` - Primary color borders

### Interactive States
- `.hover:bg-primary-hover` - Hover backgrounds
- `.hover:text-primary-hover` - Hover text colors

## Components Using the Theme System

All major components now use the centralized theme:

1. **Sidebar** - Uses primary gradient backgrounds and borders
2. **Header** - Uses primary colors for buttons and accents
3. **Dashboard** - Uses gradient backgrounds and themed cards
4. **Layout** - Uses themed background gradients

## Dark Mode

The system automatically handles dark mode with CSS variables that change based on `prefers-color-scheme: dark` or the `.dark` class.

## Testing Your Theme

1. Change the CSS variables in `globals.css`
2. Save the file
3. The entire application will update instantly
4. Check all components: sidebar, header, dashboard, buttons, etc.

## Best Practices

- Keep contrast ratios accessible (WCAG guidelines)
- Test both light and dark modes
- Ensure primary and secondary colors work well together
- Test on different devices and screen sizes
- Consider your brand colors when choosing themes

---

**Note**: This centralized approach means you only need to edit `app/globals.css` to change the entire application theme. No component files need to be modified!
