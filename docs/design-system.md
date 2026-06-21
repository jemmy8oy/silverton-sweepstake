# Design System

## Design Philosophy
- North star: Bauhaus / Neo-Brutalist, "form follows function"
- The UI should feel graphic, flat, bold, and content-first
- Structure comes from borders, spacing, and typography, not soft elevation
- Primary interactions must be obvious at a glance
- Every surface should justify its existence; avoid unnecessary wrappers

## Colour Tokens
- `background`: warm paper off-white `#f5f0e8`
- `foreground`: near-black `#1a1a1a`
- `card`: warm off-white or flat white-paper block
- `card-foreground`: near-black
- `popover`: warm off-white
- `popover-foreground`: near-black
- `primary`: near-black
- `primary-foreground`: warm off-white
- `secondary`: muted paper or accent yellow depending on context
- `secondary-foreground`: near-black
- `muted`: paper-adjacent neutral
- `muted-foreground`: subdued charcoal/grey
- `accent`: yellow `#ffcc00`
- `accent-foreground`: near-black
- `destructive`: red `#e63b2e`
- `destructive-foreground`: warm off-white
- `ring`: blue `#0055ff` for focus, yellow allowed for special emphasis
- `border`: near-black
- `input`: near-black
- `link`: blue `#0055ff`

## Typography
- `font-display`: `Space Grotesk`
- `font-sans`: `Inter`
- Headings should be oversized, geometric, and decisive
- Body text should stay restrained and readable
- Mono/uppercase labels are allowed for metadata, buttons, and section markers
- Avoid friendly rounded text treatments and low-contrast text blocks

## Spacing
- Use fewer wrappers and larger spacing jumps
- Default section rhythm: `gap-4`, `gap-6`, `gap-8`
- Page-level spacing should create strong grouping, not card stacks
- Inner padding should stay dense enough for data-heavy views

## Borders
- Standard border weight: `2px` solid near-black
- Important blocks may use `3px` borders
- Borders define hierarchy more than shadows
- Split regions with visible horizontal/vertical rules where helpful

## Radius
- Default radius: `0`
- Acceptable exceptions: very small radius (`2px` to `4px`) only when needed for usability
- Do not use `rounded-xl`, `rounded-2xl`, or pill-heavy styling as the base language

## Elevation Rules
- Default: no soft shadows
- No glassmorphism
- No translucent panels as a theme device
- No blur-based depth
- Optional hard offset shadow may be used for:
  - primary CTAs
  - highlighted feature blocks
  - key stateful panels
- If used, keep it hard-edged and black, typically `4px` to `6px` down-right

## Component Usage Rules
- Buttons:
  - uppercase
  - bold
  - thick border
  - minimal radius
  - strong hover inversion or obvious colour flip
- Cards:
  - flat bordered sections
  - avoid nesting card inside card
  - dense content
- Badges:
  - solid colour
  - compact uppercase text
  - black border when helpful
- Inputs:
  - prefer bottom-border or sharp boxed forms
  - clear labels
  - strong focus state
  - red error treatment
- Tables:
  - strong header row
  - high contrast
  - compact scan-friendly spacing
  - avoid wrapping tables in decorative cards unless the section needs a frame
- Dialogs / sheets:
  - functional panels
  - hard borders
  - no floating glass aesthetic

## Layout Rules
- Page structure should usually be:
  - page shell
  - large page header
  - 1 to 3 functional content sections
- Use one accent colour per section unless a functional state requires more
- Prefer bordered sections over heavily decorated cards
- Asymmetry is allowed if it improves hierarchy or scanability
- Mobile layouts should preserve the graphic identity without causing overflow

## Accessibility Rules
- Active states must not be colour-only
- Focus rings must be visible and high-contrast
- Buttons stay buttons, links stay links
- Inputs need labels and clear error copy
- Tables must remain readable on mobile, even if layout changes
- Touch targets should remain comfortably tappable
- Decorative motion should be minimal and respect reduced motion

## Reusable Utility Direction
- `brutal-border`: 2px black border
- `brutal-offset`: hard offset shadow for emphasis
- `brutal-surface`: flat off-white panel with black border
- `brutal-focus`: explicit focus ring using accent blue/yellow

## Page Structure Examples
- Dashboard:
  - oversized page title
  - one high-priority live section
  - adjacent stats/actions
  - one or two supporting sections
- List / table page:
  - page header
  - action/filter bar
  - primary data section
  - explicit empty/error state
- Detail page:
  - identity block
  - key stats row
  - two-column content split where useful
  - collapsible secondary detail on mobile
