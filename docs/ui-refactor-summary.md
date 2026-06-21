# UI Refactor Summary

## What changed
- Audited the frontend stack, routes, components, and repeated UI patterns.
- Initialized `shadcn/ui` in the existing Next.js frontend instead of faking a local setup.
- Replaced the dark/glassy token layer with a light Bauhaus / Neo-Brutalist theme.
- Switched font loading to `Space Grotesk` for display and `Inter` for body via `next/font`.
- Added shared layout primitives for page shells, headers, sections, and app shell structure.
- Added shared common-state components for empty, error, loading, action-bar, and status-badge states.
- Reworked the shadcn primitives to match the new design system:
  - `Button`
  - `Card`
  - `Badge`
  - `Input`
  - `Label`
  - `Select`
  - `Table`
  - `Tabs`
  - `Accordion`
  - `Alert`
  - `Sheet`
- Migrated the active shell and primary routes onto the new visual system.
- Added app-level `loading.tsx` and `error.tsx`.

## shadcn Components Added
- `button`
- `badge`
- `card`
- `input`
- `label`
- `select`
- `separator`
- `skeleton`
- `table`
- `tabs`
- `accordion`
- `alert`
- `sheet`

## Design System Changes
- Global theme now uses:
  - warm off-white paper background
  - near-black foreground and borders
  - yellow accent
  - red destructive tone
  - blue focus/link signal
- Added brutalist utility conventions in `globals.css`:
  - `brutal-border`
  - `brutal-offset`
  - `brutal-surface`
  - `brutal-focus`
- Removed the active dependence on gradients/glass/soft elevation in the app shell and migrated pages.

## Pages Migrated
- `/`
- `/fixtures`
- `/leaderboards`
- `/owners`
- `/offline`
- global app shell
- global loading / error surfaces

## Components Replaced
- Custom layout wrappers replaced with reusable `components/layout/*`
- Ad hoc state blocks replaced with `components/common/*`
- Owner selector migrated onto shadcn `Tabs`
- Collapsible owner sections migrated onto shadcn `Accordion`
- Leaderboard tables migrated onto shadcn `Table`

## Old UI Removed
- Removed the old all-in-one global CSS styling system as the primary source of component styling.
- Removed direct dependence on the dark dashboard token set in the active pages and shell.
- Replaced external font loading for display/body fonts with `next/font`.

## Remaining TODOs
- Convert the remaining lower-priority/legacy components that still carry old class names:
  - `AppNav`
  - `DashboardHero`
  - `LeaderboardTable`
  - `MatchCard`
  - `OwnerCard`
  - `TeamBadge`
- Convert the fixtures owner filter from a native `<select>` to a full shadcn form control if we want complete consistency there.
- Add route-specific loading/error states for the highest-traffic child routes if finer-grained fallback UX is needed.
- Clean up any now-unused legacy components after one more usage sweep.
- Revisit whether `/owners/page.tsx` and `/owners/[owner]/page.tsx` should remain `null` wrappers long-term, or whether the route architecture should be made more explicit while preserving compatibility.

## Risks / Manual Checks
- `npm run lint` is currently broken because the repo still points to `next lint`, which is not valid in this Next.js 16 setup.
- Final production build verification required running outside the sandbox because font assets are fetched from Google.
- The visual migration is strong on the active routes, but some non-active/legacy components still need cleanup before the old styling vocabulary is fully gone from the codebase.

## Commands Run
| Command | Result | Notes |
|---|---|---|
| `npx shadcn@latest init -y --template next --base radix --css-variables` | Passed | Needed unrestricted run to complete the official shadcn setup |
| `npx shadcn@latest add badge card input label select separator skeleton table tabs accordion alert sheet -y` | Passed | Needed unrestricted run for registry fetch |
| `npm install` | Passed | Frontend dependencies are up to date |
| `npm run lint` | Failed | Existing script uses `next lint`, which is invalid in this Next.js 16 setup |
| `npx tsc --noEmit` | Passed | Run after the build-generated `.next` type artifacts existed |
| `npx next build --webpack` | Passed | Needed unrestricted run so Next could resolve external font assets |
