# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # start dev server at http://localhost:3000
npm run build    # production build
npm run start    # serve production build
npm run lint     # ESLint check
```

There are no tests in this project.

## Architecture

This is a Next.js 14 App Router project (TypeScript + Tailwind CSS + Framer Motion) that visualizes vLLM internals as interactive step-through animations.

**Layout shell** (`src/app/layout.tsx`): wraps everything in two React context providers — `ThemeProvider` (light/dark, persisted in `localStorage`) and `SpeedProvider` (animation playback speed: 0.5×–2×) — then renders a fixed `Sidebar` (240 px) alongside `<main>`.

**Pages** (`src/app/*/page.tsx`): each page is a self-contained `"use client"` component that owns its own step counter, `isPlaying` flag, and `useEffect`-based `setInterval` timer. The timer calls `interval(baseMs)` from `useSpeed()` to scale delays by the global speed setting.

**Shared UI** (`src/components/ui.tsx`): reusable building blocks used by every page:
- `SectionHeader` — page title / subtitle / badge
- `PlaybackControls` — Play / Pause / Reset buttons + speed selector (reads/writes `SpeedProvider`) + step progress bar
- `InfoCard` — labelled card panel for explanatory text
- `StatGrid` — row of stat-card tiles

**Theming**: CSS custom properties defined in `globals.css` under `:root` (light, GitHub Primer palette) and `.dark` (GitHub Dark palette). Tailwind is used for layout/spacing; colors are always applied via `style={{ color: "var(--...)" }}` rather than Tailwind color classes, so both themes stay consistent.

**Navigation**: `Sidebar.tsx` contains the full `navItems` array — adding a new page requires adding an entry there and creating `src/app/<route>/page.tsx`.

## Adding a New Visualization Page

1. Create `src/app/<slug>/page.tsx` as a `"use client"` component.
2. Import and use `SectionHeader`, `PlaybackControls`, `InfoCard` from `@/components/ui`.
3. Call `useSpeed()` from `@/components/SpeedProvider` to get `interval(ms)` for your animation timer.
4. Add a nav entry to the `navItems` array in `src/components/Sidebar.tsx`.
5. Apply all colors via CSS variables (`var(--accent)`, `var(--text)`, etc.) — never hardcode colors.
