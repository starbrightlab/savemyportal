# SaveMyPortal Architecture

## Overview
SaveMyPortal is a **Next.js 16 (App Router)** application designed to run on the embedded Chromium browser (v98) of Facebook Portal devices.

## 1. Core Concept: The "Heartbeat" (T17)
The central technical challenge is the Portal's aggressive power management, which sleeps the device after ~15 minutes.

**The Solution**:
1.  **Wake Lock Video**: A silent, looping `<video>` element (`src/assets/silent.mp4`) plays in the background (`/frame` route).
2.  **User Initiation**: The user MUST tap "Start Frame" to initiate playback. This registers a "trusted user gesture."
3.  **Result**: The browser keeps the device awake because it believes media is playing.

## 2. Technical Stack
- **Framework**: Next.js 16 (App Router).
- **Styling**: Tailwind CSS v4 (configured with PostCSS).
- **Database/Auth**: Supabase (PostgreSQL + GoTrue).
- **Hosting**: Netlify (Static Export / Edge Functions).

## 3. Project Structure
```
src/
├── app/                 # Next.js App Router Pages
│   ├── frame/           # The "Appliance" view (Slideshow + WakeLock)
│   ├── dashboard/       # Management view (Sources, Settings)
│   ├── mission/         # Static content pages
│   ├── layout.jsx       # Root layout + Providers
│   └── page.jsx         # Smart Entry Point (Reduces click depth)
├── components/
│   ├── frame/           # Slideshow & Player components
│   ├── home/            # Landing page & ReadyState components
│   ├── layout/          # Navbar, Footer
│   └── Wizard/          # Onboarding flow
├── lib/                 # Supabase client & utilities
└── context/             # Global React Context (Auth)
```

## 4. Key Decisions
*   **Next.js Migration**: Moved from Vite to Next.js to leverage file-based routing and better image optimization features in the future.
*   **"Ready State" Logic**: `src/app/page.jsx` acts as a controller. If the user is logged in, it bypasses the marketing Hero and renders `ReadyState`, removing friction from the primary user journey.
*   **Referrer Policy**: To load images from Google Photos without CORS errors, we explicitly set `referrerPolicy="no-referrer"` on `<img>` tags.

## 5. Design & UX
See [DESIGN.md](./DESIGN.md) for the "North Star" philosophy and Visual Identity guidelines.
