# UI Component Migration Map

| Existing pattern/component | Location | Replace with | Notes |
|---|---|---|---|
| Ad hoc page CTA links/buttons | `frontend/app/page.tsx`, `frontend/app/fixtures/page.tsx`, `frontend/app/leaderboards/page.tsx`, `frontend/app/offline/page.tsx` | `components/ui/button` + custom brutalist variants | Preserve link vs button semantics |
| Custom bordered sections with gradients/shadows | Most route pages and `OwnerProfilePanel` | `components/ui/card` sparingly + layout shells (`page-shell`, `section-shell`) | Avoid nested cards; prefer bordered sections |
| Custom nav links | `frontend/components/SiteNav.tsx`, `frontend/components/AppNav.tsx` | `Button` variants and layout nav primitives | Make active state structural, not cosmetic-only |
| Custom badge pills | Pot/status/team labels across pages | `components/ui/badge` + `StatusBadge` wrapper | Needs neutral, yellow, red, blue, and live variants |
| Plain select/date filter form | `frontend/app/fixtures/page.tsx` | `Select`, `Input`, `Label`, `Button`, optional `FormField` wrappers | Preserve query-string behaviour |
| Custom fixtures date scroller | `frontend/app/fixtures/page.tsx` | Shared `Button`/`Badge`-style pills in a dedicated horizontal nav primitive | Preserve swipe + date navigation |
| Manual owner tab strip | `frontend/components/OwnersClientShell.tsx` | `Tabs` composition or retained custom tabs on top of shadcn buttons | Preserve URL/history behaviour |
| Custom collapsible cards | `frontend/components/CollapsibleSection.tsx` | shadcn `Accordion` or `Collapsible` | Keep mobile-collapse behaviour |
| Custom leaderboard tables | `frontend/app/leaderboards/page.tsx`, `frontend/components/LeaderboardTable.tsx` | `components/ui/table` | Preserve current compact mobile handling |
| Custom empty states | `/owners`, `/fixtures`, `/offline`, owner journey, leaderboard fallbacks | `components/common/empty-state` | Should support icon, title, copy, CTA |
| Missing explicit error state | All routes using `safe()` fallback | `components/common/error-state` | Keep fetch behaviour but surface recoverable failures |
| Missing loading system | Entire app | `components/ui/skeleton` + `components/common/loading-state` + route `loading.tsx` where useful | Start with high-traffic pages |
| Owner/team media blocks | `OwnerAvatar`, `TeamLogo`, `TeamBadge` | Keep existing components but standardise around design tokens | Avoid rewriting asset logic |
| Hero/header blocks | `page.tsx`, `owners/layout.tsx`, `leaderboards/page.tsx`, `fixtures/page.tsx` | `components/layout/page-header` | Introduce consistent hierarchy and actions |
