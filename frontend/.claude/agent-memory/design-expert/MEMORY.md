# BGFI Design Expert Memory

## Design System Conventions
- **Sharp corners**: `--radius: 0` means NO `rounded-lg`, `rounded-full` anywhere. Remove all rounded utilities.
- **Typography**: Fraunces (headlines), Newsreader (body), Inter (UI). Mono for financial data.
- **Financial data**: Always use `font-mono tabular-nums tracking-tight` for numbers.
- **Label style**: `text-2xs font-medium uppercase tracking-wider text-muted-foreground` (Bloomberg-style micro-labels)
- **Spacing scale**: Use mb-10 between major sections, mb-6 between sub-sections, gap-4 for card grids, gap-5 for panel grids.

## Existing Utility Classes (globals.css) Often Underused
- `label-uppercase` -- micro-label style
- `data-value` -- font-mono tabular-nums font-medium tracking-tight
- `stat-value` -- text-2xl font-mono font-bold tabular-nums mt-1
- `stat-label` -- text-xs text-muted-foreground uppercase tracking-wider
- `card-terminal` -- bg + border combo
- `table-terminal` -- full table styling with uppercase headers
- `shadow-theme-sm/md/lg` -- theme-aware shadows

## Color Assignments by Section (Analytics)
- Users: brand-orange (primary)
- Content: blue-400
- Engagement: market-up (green)
- Newsletters: purple-400
- Revenue: amber-400

## Key File Paths
- Analytics page: `frontend/src/app/admin/analytics/page.tsx`
- Admin layout: `frontend/src/app/admin/layout.tsx`
- Loading components: `frontend/src/components/ui/loading.tsx`
- CSS variables: `frontend/src/app/globals.css`
- Tailwind config: `frontend/tailwind.config.ts`
- Font size `text-2xs` defined in tailwind config: 0.625rem / 0.875rem line-height

## Common Design Issues Found
- rounded-full/rounded-lg used despite --radius:0 system
- Numeric data rendered in proportional font instead of mono
- Table headers not using uppercase tracking pattern
- Existing CSS utility classes in globals.css underutilized
- TrendBar component too short (h-24), needs h-32 minimum with axis labels
