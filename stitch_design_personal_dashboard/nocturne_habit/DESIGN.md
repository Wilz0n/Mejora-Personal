---
name: Nocturne Habit
colors:
  surface: '#131315'
  surface-dim: '#131315'
  surface-bright: '#39393b'
  surface-container-lowest: '#0e0e10'
  surface-container-low: '#1c1b1d'
  surface-container: '#201f22'
  surface-container-high: '#2a2a2c'
  surface-container-highest: '#353437'
  on-surface: '#e5e1e4'
  on-surface-variant: '#c7c4d7'
  inverse-surface: '#e5e1e4'
  inverse-on-surface: '#313032'
  outline: '#908fa0'
  outline-variant: '#464554'
  surface-tint: '#c0c1ff'
  primary: '#c0c1ff'
  on-primary: '#1000a9'
  primary-container: '#8083ff'
  on-primary-container: '#0d0096'
  inverse-primary: '#494bd6'
  secondary: '#d0bcff'
  on-secondary: '#3c0091'
  secondary-container: '#571bc1'
  on-secondary-container: '#c4abff'
  tertiary: '#ffb783'
  on-tertiary: '#4f2500'
  tertiary-container: '#d97721'
  on-tertiary-container: '#452000'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c0c1ff'
  on-primary-fixed: '#07006c'
  on-primary-fixed-variant: '#2f2ebe'
  secondary-fixed: '#e9ddff'
  secondary-fixed-dim: '#d0bcff'
  on-secondary-fixed: '#23005c'
  on-secondary-fixed-variant: '#5516be'
  tertiary-fixed: '#ffdcc5'
  tertiary-fixed-dim: '#ffb783'
  on-tertiary-fixed: '#301400'
  on-tertiary-fixed-variant: '#703700'
  background: '#131315'
  on-background: '#e5e1e4'
  surface-variant: '#353437'
typography:
  display:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.0'
    letterSpacing: 0.05em
  stats-lg:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: '1.0'
    letterSpacing: -0.03em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-max: 1280px
  gutter: 1.5rem
  margin-mobile: 1rem
  stack-sm: 0.5rem
  stack-md: 1rem
  stack-lg: 2rem
---

## Brand & Style

This design system is built for focus, clarity, and the quiet ritual of self-improvement. The aesthetic is a refined **Corporate Modern** style with a leaning toward **Minimalism**, optimized specifically for high-performance dark mode environments. It prioritizes data density without clutter, using deep atmospheric layers to create a sense of focus.

The target audience consists of high-achievers and professionals who value discretion and precision. The emotional response should be one of calm control and "flow state" productivity. Visually, the design system relies on high-quality typography, generous whitespace within components, and subtle tonal shifts rather than aggressive color blocks.

## Colors

The palette is anchored in a deep monochromatic scale to reduce eye strain and maximize the pop of functional accents.

- **Backgrounds:** The base layer uses `zinc-950` (#09090b). Secondary surfaces like cards and modals use `zinc-900` at varying opacities to create a sense of depth.
- **Accents:** `indigo-500` (#6366f1) serves as the primary interactive color, used for primary actions, progress bars, and active states. `violet-500` (#8b5cf6) is reserved for secondary highlights or categorized habit tracking.
- **Borders:** Subtle `zinc-800` (#27272a) borders define structure without creating visual noise.
- **Functional Colors:** Use standard semantic colors for feedback (Success: Emerald-500, Error: Rose-500) but muted through reduced saturation to fit the dark aesthetic.

## Typography

This design system utilizes **Inter** for all primary interface elements due to its exceptional legibility in dark mode and its neutral, professional character. For data-heavy elements, habit streaks, and technical timestamps, **JetBrains Mono** is introduced to provide a functional, "quantified self" feel.

- **Hierarchy:** Use weight (Bold/SemiBold) rather than color shifts to denote hierarchy where possible.
- **Contrast:** High-emphasis text should be `zinc-50`. Secondary text should be `zinc-400`. Disabled or tertiary text should be `zinc-500`.
- **Spacing:** Tighten letter spacing on larger headlines to maintain a modern, "compact" editorial look.

## Layout & Spacing

The layout follows a **Fluid Grid** philosophy with a focus on logical grouping. It employs a 12-column grid for desktop and a single-column stack for mobile.

- **Rhythm:** A base-8 scale is used for all spacing. Component internals use 12px or 16px padding, while section layouts use 32px or 48px to allow the design to breathe.
- **Responsive Behavior:** On mobile, margins reduce to 16px. Cards typically transition to full-width with a slight bottom margin to maintain the "stack" metaphor.
- **Sidebar:** For desktop apps, a fixed 240px left-hand navigation sidebar is recommended, using a slightly lighter background (`zinc-900/50`) with a right-hand border to separate global navigation from the workspace.

## Elevation & Depth

This design system avoids traditional heavy shadows in favor of **Tonal Layers** and **Low-Contrast Outlines**.

- **Level 0 (Base):** `zinc-950` - The main canvas.
- **Level 1 (Cards):** `zinc-900/50` background with a 1px solid border of `zinc-800`.
- **Level 2 (Popovers/Modals):** `zinc-900` background with a slightly more pronounced border (`zinc-700`) and a very soft, large-radius ambient shadow (0px 20px 50px rgba(0,0,0,0.5)).
- **Glassmorphism:** Use `backdrop-blur-md` on sticky headers and navigation bars to maintain context of the scroll position while ensuring text readability.

## Shapes

The shape language is contemporary and approachable, utilizing a **Rounded** philosophy.

- **Core Components:** Buttons, inputs, and small widgets use `rounded-xl` (0.75rem).
- **Containers:** Habit cards, charts, and main content areas use `rounded-2xl` (1rem).
- **Interactive States:** Hover states on list items should use a `rounded-md` (0.375rem) background highlight to indicate focus.

## Components

### Buttons
- **Primary:** Solid `indigo-600` background, `white` text. Subtle inner-glow top border for a tactile feel.
- **Secondary:** `zinc-800` background with a `zinc-700` border.
- **Ghost:** No background, `zinc-400` text, transitions to `zinc-800` background on hover.

### Habit Trackers
- **Progress Rings:** Use a 4px stroke width. Background track is `zinc-800`, active track is `indigo-500`.
- **Heatmaps:** Daily squares should be 12x12px with 2px rounding. Empty states are `zinc-900`, active states are shades of `indigo`.

### Input Fields
- **Default:** `zinc-950` background, `zinc-800` border.
- **Focus:** `border-indigo-500` with a subtle `indigo-500/20` outer glow (ring).

### Cards
- Standard cards use `zinc-900/50` with a `zinc-800` border. Headers within cards should be separated by a subtle horizontal rule or a change in typography weight.

### Chips/Badges
- Small, uppercase `label-caps` typography. Backgrounds should be low-opacity versions of the accent color (e.g., `indigo-500/10`) with a matching text color.