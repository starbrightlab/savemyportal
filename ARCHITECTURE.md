# SaveMyPortal Architecture

## Overview
SaveMyPortal is a **Next.js 14 (App Router)** application designed to run on the embedded Chromium browser (v98) of Facebook Portal devices.

## 1. Core Concept: The "Heartbeat" (T17)
The central technical challenge is the Portal's aggressive power management, which sleeps the device after ~15 minutes.

**The Solution**:
1.  **Wake Lock Video**: A silent, looping `<video>` element (`src/assets/silent.mp4`) plays in the background (`/frame` route).
2.  **User Initiation**: The user MUST tap "Start Frame" to initiate playback. This registers a "trusted user gesture."
3.  **Result**: The browser keeps the device awake because it believes media is playing.

## 2. Technical Stack
- **Framework**: Next.js 14 (App Router).
- **Styling**: Tailwind CSS v4 (configured with PostCSS).
- **Database/Auth**: Supabase (PostgreSQL + GoTrue).
- **Hosting**: Netlify (Static Export / Edge Functions).

## 3. Project Structure
```
src/
├── app/                 # Next.js App Router Pages
│   ├── api/             # Server-side Route Handlers
│   │   ├── scrape-urls/ # On-demand photo URL scraping
│   │   └── delete-account/ # Account deletion
│   ├── frame/           # The "Appliance" view (Slideshow + WakeLock)
│   ├── dashboard/       # Management view (Sources, Settings)
│   ├── mission/         # Static content pages
│   ├── layout.jsx       # Root layout + Providers
│   └── page.jsx         # Smart Entry Point (Reduces click depth)
├── components/
│   ├── frame/           # Slideshow & Player components
│   ├── home/            # Landing page & ReadyState components
│   ├── dashboard/       # Feed editor & source cards
│   ├── layout/          # Navbar, Footer
│   └── Wizard/          # Onboarding flow
├── lib/                 # Supabase clients, scrapers, utilities
├── types/               # TypeScript type definitions
└── context/             # Global React Context (Auth)
```

## 4. Photo Source Architecture

### On-Demand Scraping
Photos are loaded fresh per device session — no URLs are stored in the database. This solves CDN token expiry and cross-device token issues.

**Flow**: `Slideshow loads` → `GET source IDs from feed_sources` → `POST /api/scrape-urls` → `fresh CDN URLs returned` → `held in React state`

**Key files**:
- `src/app/api/scrape-urls/route.ts` — Server-side scraper endpoint (cookie auth, parallel scraping)
- `src/lib/scrapers.ts` — Google Photos & iCloud parsers
- `src/components/frame/Slideshow.tsx` — Calls scrape-urls on mount, manages photo state

### Stale URL Recovery
The Slideshow tracks consecutive image load failures. After 3+ failures, it triggers a background re-scrape with exponential backoff (30s → 60s → 120s → 5min cap). Fresh URLs are swapped in seamlessly without user interaction.

### Database Tables
| Table | Purpose |
|-------|---------|
| `sources` | Album URLs (Google Photos / iCloud links) |
| `feeds` | Named collections with display config |
| `feed_sources` | Many-to-many: which sources belong to which feed |
| `source_items` | **Deprecated** — no longer read or written to |

### API Routes
| Route | Purpose |
|-------|---------|
| `POST /api/scrape-urls` | Scrape fresh CDN URLs for given source IDs (no DB storage) |
| `POST /api/delete-account` | Delete user account via Supabase admin API |

## 5. Key Decisions
*   **Next.js Migration**: Moved from Vite to Next.js to leverage file-based routing and server-side Route Handlers.
*   **On-Demand Scraping**: CDN URLs from Google Photos and iCloud are session/token-specific. Storing them in the DB caused cross-device failures. Each device now scrapes its own fresh URLs at load time.
*   **No Image Proxy**: Images load directly from source CDNs. `<img>` tags are not subject to CORS, so no proxy is needed. `referrerPolicy="no-referrer"` prevents hotlink blocking.
*   **Cookie-Based Auth**: Route Handlers use cookie-based auth via `@supabase/ssr`, eliminating the stale JWT token issues that plagued the old Supabase Edge Functions.
*   **"Ready State" Logic**: `src/app/page.jsx` acts as a controller. If the user is logged in, it bypasses the marketing Hero and renders `ReadyState`, removing friction from the primary user journey.

## 6. Design & UX
See [DESIGN.md](./DESIGN.md) for the "North Star" philosophy and Visual Identity guidelines.
