# UI Audit

## Stack
- Framework: Next.js 16 App Router frontend in `frontend/`
- Router: File-based App Router via `frontend/app`
- Package manager: `npm` in `frontend/` (`package-lock.json` present)
- Styling: Tailwind CSS v4 via `@import "tailwindcss"` in `frontend/app/globals.css`, plus direct utility classes in route/components
- UI libraries: No `shadcn/ui` installed yet, no Radix primitives, no form library
- Fonts: Google Fonts loaded with `<link>` tags in `frontend/app/layout.tsx` using `Archivo Narrow`, `Inter`, `JetBrains Mono`, plus Material Symbols

## Routes / Pages
| Route | Purpose | Current UX issues | Priority |
|---|---|---|---|
| `/` | Dashboard / home summary | Strong visual density but still uses gradients, rounded cards, soft shadow offsets, and many nested bordered panels; lacks explicit loading/error treatment; section hierarchy is better than before but not aligned with the requested flat brutalist system | High |
| `/fixtures` | Matchday fixture browser with date/owner filters | Heavy card treatment, gradient/live surfaces, dense controls, mobile swipe shell depends on CSS class hook, no explicit loading/error states, filter form is custom and not reusable | High |
| `/leaderboards` | Table-heavy standings and punishments view | Multiple custom table/card patterns, still layered, no shared table primitive, no explicit loading/error state, mobile table remains compact but not yet on a reusable component system | High |
| `/owners` | Owner overview and detail shell | Route shell is unconventional because `/owners/page.tsx` returns `null` and the UI lives in `owners/layout.tsx`; current tabbed owner switcher is functional but tightly custom | High |
| `/owners/[owner]` | Owner detail permalink | Page file returns `null`; detail rendering is driven by `OwnersClientShell`, which preserves state well but couples route/view behaviour to custom history handling | Medium |
| `/offline` | Offline fallback page | Minimal page, currently custom-styled, no shared empty/error primitive | Low |
| `/apple-icon`, `/icon-192`, `/icon-512`, `/manifest.webmanifest` | PWA assets | Not part of core UI, but they are part of build/runtime correctness | Low |

## Existing Components
| Component | Location | Purpose | Keep / Replace / Refactor |
|---|---|---|---|
| `SiteNav` | `frontend/components/SiteNav.tsx` | Primary side nav and mobile bottom nav | Refactor |
| `OwnersClientShell` | `frontend/components/OwnersClientShell.tsx` | Client-side owner selection, URL sync, tab behaviour | Keep + Refactor |
| `OwnerProfilePanel` | `frontend/components/OwnerProfilePanel.tsx` | Owner detail dashboard | Refactor |
| `CollapsibleSection` | `frontend/components/CollapsibleSection.tsx` | Mobile-friendly accordion section | Keep + Replace internals with shadcn Accordion/Collapsible patterns |
| `FixturesSwipeShell` | `frontend/components/FixturesSwipeShell.tsx` | Swipe navigation wrapper for fixture dates | Keep + Refactor |
| `OwnerAvatar` | `frontend/components/OwnerAvatar.tsx` | Avatar with image/fallback initials | Keep + Refactor |
| `TeamLogo` | `frontend/components/TeamLogo.tsx` | Team crest / fallback mark | Keep + Refactor |
| `TeamBadge` | `frontend/components/TeamBadge.tsx` | Compact team label badge | Refactor |
| `MatchCard` | `frontend/components/MatchCard.tsx` | Generic fixture card | Refactor |
| `OwnerCard` | `frontend/components/OwnerCard.tsx` | Compact owner summary card | Refactor |
| `LeaderboardTable` | `frontend/components/LeaderboardTable.tsx` | Generic leaderboard tables | Replace with shadcn Table-based primitives |
| `DashboardHero` | `frontend/components/DashboardHero.tsx` | Older hero pattern | Replace or fold into page shell |
| `AppNav` | `frontend/components/AppNav.tsx` | Alternate nav implementation, likely legacy/unused | Remove or replace after usage audit |
| `LiveRefresher` | `frontend/components/LiveRefresher.tsx` | Periodic `router.refresh()` for live data | Keep |
| `PwaRegistration` | `frontend/components/PwaRegistration.tsx` | Service worker registration | Keep |

## Repeated UI Patterns
- Buttons: Hand-built Tailwind links/buttons with repeated uppercase mono text, rounded corners, custom borders, and custom hover states
- Cards: Repeated custom bordered containers with gradients, rounded corners, and soft/diffuse shadows
- Tables: Custom page-local tables on leaderboard pages; a separate legacy generic table component exists
- Forms: Plain HTML `form`, `select`, `input[type=date]`, and submit buttons on fixtures page
- Modals: None detected
- Navigation: Custom side nav + bottom nav in `SiteNav`, alternate nav implementation in `AppNav`
- Badges: Repeated custom pill badges for pot, status, state, owner/team metadata
- Alerts: None as a shared primitive
- Loading states: No route-level `loading.tsx`; no skeleton system
- Empty states: Ad hoc per page/component
- Error states: Data requests usually use `safe()` with empty fallbacks, so user-facing error states are mostly absent

## Main UX Problems
- The current frontend is already mid-migration to Tailwind, but it is not using a design system. Styling is page-local and repetitive.
- The active theme directly conflicts with the new brief: dark palette, gradients, soft box shadows, rounded surfaces, and semi-glass treatments are still present across all major routes.
- There is no `shadcn/ui` foundation, no `components/ui` layer, and no `lib/utils` helper expected by shadcn.
- Layout primitives are missing. Page headers, sections, badges, buttons, empty states, and action bars are duplicated instead of composed.
- Loading and error handling are weak. Most routes swallow fetch failures into empty arrays/objects, which prevents meaningful UI feedback.
- `/owners` and `/owners/[owner]` rely on `layout.tsx` plus client-side `history.pushState`, which works but is non-obvious and makes the information architecture harder to reason about.
- Mobile navigation is usable, but the current bottom nav and sticky header still look like a polished dark dashboard rather than a clear brutalist app shell.
- Tables and filters are not standardised. The fixtures filter form and leaderboard tables should become reusable, accessible primitives.
- Fonts are loaded via external `<link>` tags rather than a clear app-level font system. The requested `Space Grotesk` is not in use.
- There is no `docs/` documentation for the UI architecture or migration path yet.

## Migration Order
- 1. Create audit docs and migration map.
- 2. Install and initialise `shadcn/ui` using the existing `npm` + Tailwind v4 setup.
- 3. Replace font loading with `Space Grotesk` + `Inter`, and redefine theme tokens in `globals.css` using shadcn-compatible CSS variables.
- 4. Build shared `components/ui` primitives and app-level layout wrappers (`app-shell`, `page-shell`, `page-header`, `empty-state`, `status-badge`, etc.).
- 5. Refactor navigation and global shell first, because every page depends on it.
- 6. Migrate `/` and `/fixtures`, since they are the most visible routes and contain reusable filters, cards, and status patterns.
- 7. Migrate `/leaderboards` with shared `Table`, `Badge`, and section primitives.
- 8. Migrate `/owners` owner tabs, profile panels, and collapsible sections using shadcn composition.
- 9. Add loading, empty, and error states consistently.
- 10. Remove or consolidate legacy/duplicate UI components after active routes are migrated.
