
# SaveMyPortal

**SaveMyPortal** is an open-source initiative to repurpose Facebook Portal Plus (Gen 2) devices as premium, always-on smart home displays. It leverages a specific browser quirk (T17 Wake Lock Strategy) to prevent the device from sleeping, allowing it to function as a 24/7 photo frame or dashboard.

## Features
- **Always On**: Uses a hidden "Heartbeat Video" to defeat the aggressive power management.
- **Photo Frame**: (Coming Soon) High-quality slideshow with support for local and cloud sources.
- **Dashboard**: (Coming Soon) Weather, Clock, and Home Assistant integrations.

## ⚠️ Hardware Compatibility (Critical)
This project is built specifically for the **Facebook Portal Plus (Gen 2)**, which runs a modified Android version with **Chrome 98 System WebView**.
**Do not upgrade dependencies** (Next.js, React, Tailwind) beyond versions compatible with Chrome 98.
- **Next.js**: Keep at v14 (v15+ may break)
- **React**: Keep at v18 (v19 is untested)
- **Tailwind**: Keep at v3.4 (v4 uses `@layer` which requires Chrome 99+)


## Getting Started

**Live Demo**: [savemyportal.netlify.app](https://savemyportal.netlify.app) (Run on your Portal!)

1.  **Clone**: `git clone https://github.com/starbrightlab/savemyportal.git`
2.  **Install**: `npm install`
3.  **Run**: `npm run dev`


## The Wake Lock Magic
This project relies on a specific technical implementation to keep the Portal awake. See [ARCHITECTURE.md](./ARCHITECTURE.md) for details on the "Heartbeat Video" strategy.

## Contributing
We welcome contributions to help keep these devices useful! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for important constraints regarding the target hardware (Chrome 98 WebView).
