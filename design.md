# The Scholarly Archive - Design System

## North Star
A premium editorial interface for the UTI ticketing system: high-clarity hierarchy, asymmetrical composition, and architectural whitespace. The product must feel institutional and trustworthy, not startup-generic.

## Product Scope
This system must scale to:
- Auth screens
- Ticket list and ticket detail
- Ticket create/edit forms
- Dashboard and metrics views
- Shared shell: header, sidebar, utility nav

## Brand Assets
Institutional logo source of truth:
- `public/LogoFCE.webp`

Usage rules:
- Header: always show the institutional mark on the left.
- Login: logo must appear in the welcome block and stay visible above fold on mobile.
- Favicon/app icon: replace default Vite icon with institutional asset derivative.

Current asset availability:
- Only one logo variant exists in repository.
- If dark-theme contrast is insufficient, use a subtle neutral backing plate (`--surface-lowest`) behind the logo instead of recoloring the logo itself.

## Design Principles
1. Editorial hierarchy first: typography and spacing before decoration.
2. No-line rule: no 1px separators/dividers for section grouping.
3. Separation by surface layering, whitespace, and subtle elevation.
4. No gradients.
5. Rounded corners are restrained:
   - Global max radius: `0.375rem`
   - Buttons ideal radius: `0.125rem`
6. Icons are functional only; no decorative icon clutter.
7. Token-first styling: never hardcode component colors.

## Typography
Font family:
- Primary and UI: Public Sans
- Fallback: `system-ui, -apple-system, Segoe UI, sans-serif`

Type rules:
- Display titles: stronger weight, tracking `-0.02em`
- Section titles: semibold with tighter line-height
- Labels: uppercase with tracking `+0.05em`
- Body text: neutral, high legibility

Proposed scale:
- Display: `clamp(2rem, 3.5vw, 3.25rem)` / 700 / -0.02em
- H1: `2rem` / 700
- H2: `1.5rem` / 650
- H3: `1.125rem` / 600
- Body: `1rem` / 400
- Small: `0.875rem` / 400
- Label: `0.75rem` / 600 / +0.05em / uppercase

## Color System (Token Source of Truth)
The palette follows the requested Red & Navy editorial direction.

### Light Tokens
```css
:root {
  --surface: #f9f9f9;
  --surface-lowest: #ffffff;
  --surface-low: #f3f3f3;
  --secondary-container: #d3e1f6;

  --primary: #7c0320;
  --primary-container: #9d2235;
  --on-primary: #ffffff;

  --on-secondary-fixed: #0f1c2c;

  --text-primary: #141414;
  --text-secondary: #3c3c3c;
  --text-muted: #5e5e5e;

  --focus-ring: #9d2235;
  --success: #24613a;
  --warning: #8a5a00;
  --danger: #9a1f2d;

  --shadow-1: 0 2px 10px color-mix(in srgb, #0f1c2c 10%, transparent);
  --shadow-2: 0 8px 28px color-mix(in srgb, #0f1c2c 14%, transparent);

  --radius: 0.375rem;
  --radius-button: 0.125rem;
}
```

### Dark Tokens
```css
.dark {
  --surface: #141a22;
  --surface-lowest: #1a2230;
  --surface-low: #222c3b;
  --secondary-container: #2a3f5a;

  --primary: #b53a4f;
  --primary-container: #d14a62;
  --on-primary: #ffffff;

  --on-secondary-fixed: #dce6f7;

  --text-primary: #f2f5fa;
  --text-secondary: #ccd4e2;
  --text-muted: #a7b3c7;

  --focus-ring: #d14a62;
  --success: #69b184;
  --warning: #dbb163;
  --danger: #e47f8c;

  --shadow-1: 0 2px 10px color-mix(in srgb, #000000 30%, transparent);
  --shadow-2: 0 12px 36px color-mix(in srgb, #000000 42%, transparent);
}
```

## Shadcn Mapping (Required)
All component classes must consume semantic tokens only.

```css
:root {
  --background: var(--surface);
  --foreground: var(--text-primary);
  --card: var(--surface-lowest);
  --card-foreground: var(--text-primary);
  --popover: var(--surface-lowest);
  --popover-foreground: var(--text-primary);
  --primary: var(--primary);
  --primary-foreground: var(--on-primary);
  --secondary: var(--surface-low);
  --secondary-foreground: var(--text-primary);
  --muted: var(--surface-low);
  --muted-foreground: var(--text-muted);
  --accent: var(--secondary-container);
  --accent-foreground: var(--on-secondary-fixed);
  --border: transparent;
  --input: var(--surface-lowest);
  --ring: var(--focus-ring);
}
```

## Layout Patterns
### App Shell
- Header height: 64px desktop, 56px mobile
- Left brand cluster: logo + institutional text
- Utility actions on right: theme toggle, profile, quick actions
- Sidebar for desktop flows uses `--on-secondary-fixed` background

### Content Rhythm
- Main page padding: 24px mobile, 40px desktop
- Section spacing: 24-40px
- Cards separated by spacing and surface contrast, not borders
- Asymmetry: feature blocks can use 7/5 or 8/4 layout splits

## Base Components
### Header
- Must include institutional logo from `public/LogoFCE.webp`
- Sticky only if needed by page behavior
- No bottom border line

### Button
- Radius uses `--radius-button`
- Primary button: `--primary` background
- Secondary button: `--surface-low`
- Ghost: transparent with surface hover

### Input
- Background: `--surface-lowest`
- No hard border lines; use soft shadow/focus ring for affordance
- Labels uppercase small style per typography rules

### Card
- Surface layering only (`--surface-lowest` over `--surface`)
- Use `--shadow-1` for default, `--shadow-2` for elevated states
- No border separators inside card sections

### Ticket List Item
- Grouping by spacing + hover surface shift
- Metadata lanes (status, priority, updated time) are aligned and quiet
- Status emphasis by tokenized badge backgrounds, not raw colors

## Accessibility Baseline
- Color contrast target: WCAG AA minimum, AAA for key text where practical
- Visible focus ring on all interactive controls
- Do not remove native semantics from form controls
- Touch targets >= 40px
- Keyboard-first navigation for auth and ticket flows

## Do / Do Not
Do:
- Use tokenized semantic classes (`bg-background`, `text-foreground`, etc.)
- Build composable primitives with shadcn + CVA variants
- Keep iconography minimal and meaningful

Do not:
- Add section separators with `border`, `divide-*`, or 1px lines
- Use gradients for backgrounds or buttons
- Exceed `0.375rem` corner radius globally
- Hardcode hex colors in component files

## Incremental Refactor Plan
### Phase 1 - Foundation
- Add Public Sans font import and token overhaul in global CSS
- Add real theme provider and system-aware dark mode
- Replace Vite favicon with institutional icon asset

### Phase 2 - Shell and Core Primitives
- Implement header with institutional logo
- Update button/input/card variants to consume new tokens
- Add shared page container and section primitives

### Phase 3 - First Vertical Slice
- Implement login page using final design language
- Validate mobile and desktop spacing rhythm
- Validate keyboard flow and focus states

### Phase 4 - Ticket Surfaces
- Build ticket list and ticket detail layout patterns
- Add tokenized badge/status system
- Add form patterns for create/edit ticket

### Phase 5 - Dashboard
- Implement metrics and activity surfaces
- Keep no-line rule using layered surfaces and spacing only

## Library Recommendations
Only add libraries when needed by feature scope:
- `react-hook-form` + `zod`: yes, for scalable and accessible form validation.
- `@tanstack/react-query`: yes, once API integration starts for caching and async state.
- `react-router-dom`: yes, if multi-screen routing is not yet present.
- `next-themes`: optional; use only if you prefer not to maintain a custom ThemeProvider.

Not needed now:
- Animation-heavy libs (no current requirement)
- Additional icon packs (lucide already configured)

## Changelog
- 2026-04-23: Initial `design.md` created from scratch (no prior design document existed).
