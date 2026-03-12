# BGFI Design Expert Memory

## Project: Bard Global Finance Institute
- African financial journalism platform (Next.js 14 + Django)
- Deployed on Render.com

## Design System Summary
- **Brand Color**: Burgundy #9b2335 (HSL 355 70% 38%)
- **Corners**: Sharp (--radius: 0) - Swiss International Style
- **Fonts**: Fraunces (headlines), Newsreader (body), Inter (UI), JetBrains Mono (data)
- **Theme**: Light/dark via CSS variables in globals.css
- **Container**: max-w-[1400px] with px-4 md:px-6

## Key File Paths
- Homepage: `frontend/src/app/page.tsx` (~1638 lines)
- CSS: `frontend/src/app/globals.css` (715 lines)
- Tailwind: `frontend/tailwind.config.ts`
- Layout: `frontend/src/components/layout/MainLayout.tsx`
- Navigation: `frontend/src/components/layout/Navigation.tsx`
- Badge: `frontend/src/components/ui/badge.tsx`
- Card: `frontend/src/components/ui/card.tsx`
- Layout: `frontend/src/app/layout.tsx`

## Current Design Observations
- Homepage has ~20 section components, many using OverlayCard pattern
- Tags are uppercase, small, burgundy text (no background pills in feed)
- .topic-tag class uses rounded-full pills (defined in globals.css)
- Badge component uses CVA with rounded-full border
- Cards use bg-terminal-bg-secondary with border-terminal-border
- Section headers are font-serif text-2xl font-bold
- Industry nav uses colored Lucide icons with text labels
- Multiple dark sections use bg-slate-900 (hardcoded, not theme-aware)

## Email Templates (backend/templates/emails/)
- 4 HTML templates + 4 plain-text variants created
- `verify_email.html` - subscription verification CTA
- `breaking_news.html` - urgent Bloomberg-style alert
- `morning_brief.html` - daily AM market data (indices, gainers, losers)
- `evening_wrap.html` - daily PM close data + top stories (dark header)
- All use inline CSS, table layout, 600px max-width
- Email-safe fonts: Georgia (headlines), Helvetica Neue/Arial (UI), Courier New (data)
- Burgundy #9b2335 accent throughout, sharp corners (no border-radius)
- SVG grid pattern in headers (data URI, email-safe)
- Dark mode support via @media (prefers-color-scheme: dark)
- Outlook VML fallback for CTA buttons
- Tasks.py updated to use render_to_string with templates
- Django template variables: verify_url, unsubscribe_url, article, indices, etc.

## Design Aspirations
- User wants "cute and sweet" + world-class
- Inspired by Finimize (clean, tag-rich, fresh) and HBR (editorial gravitas)
- Goal: "Financial Times of Africa"
- Finimize patterns: lowercase colored tags with dot separators, compact text cards, bold serif headlines, generous whitespace
