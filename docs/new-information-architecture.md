# New Information Architecture

## Existing Structure
- `/`: dashboard and live summary
- `/fixtures`: fixture browser with date and owner filtering
- `/leaderboards`: standings, underdog watch, punishment tracker
- `/owners`: owner overview shell that immediately pivots into an owner detail view
- `/owners/[owner]`: permalinked owner detail state
- `/offline`: offline fallback

## Proposed Structure
- Keep the same public routes for compatibility
- Clarify the top-level sections as:
  - Dashboard
  - Fixtures
  - Leaderboard
  - Owners
- Treat `/owners` as an owner index + default detail route
- Preserve `/owners/[owner]` as the canonical deep link for a selected owner
- Keep PWA/offline routes outside the main nav

## Navigation Model
- Top-level nav:
  - Dashboard
  - Fixtures
  - Leaderboard
  - Owners
- Desktop nav:
  - fixed bordered rail
  - explicit active marker
  - direct labels first, icon second
- Mobile nav:
  - fixed bottom nav or sheet-driven nav if scanability improves
  - active item must be structurally distinct, not just recoloured
- Secondary nav:
  - fixtures date strip
  - owners selection tabs
  - local section anchors only if needed after migration

## Page Templates
- Home / landing:
  - strong identity block
  - current live content
  - 1 to 2 supporting overview sections
- Dashboard:
  - page marker
  - large title
  - primary live/status section
  - supporting analytics/list sections
- List / table page:
  - title + summary
  - actions/filter bar
  - main table/list
  - explicit empty/loading/error state
- Detail page:
  - identity header
  - key stats
  - main content split
  - secondary details in accordion/collapsible layout on smaller screens
- Form / admin page:
  - clear heading
  - grouped labeled fields
  - visible submit state
  - clear success/error feedback
- Empty / error / loading state:
  - strong title
  - short explanatory copy
  - optional recovery action

## Route-Level UX Intent
- `/`:
  - Purpose: immediate scan of the tournament state
  - Primary action: jump to live fixtures / standings
- `/fixtures`:
  - Purpose: browse what is happening on a given day
  - Primary action: filter by date or owner
- `/leaderboards`:
  - Purpose: compare standings and consequences
  - Primary action: scan table and supporting punishments/watchlists
- `/owners` and `/owners/[owner]`:
  - Purpose: inspect one owner deeply without losing context of the rest of the draw
  - Primary action: switch owner and scan teams/journey/head-to-heads
