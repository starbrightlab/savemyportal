# SaveMyPortal Design & Experience Guidelines

> **"Premium. Cinematic. Essential."**
> Our goal is to create an experience that feels like high-end appliance firmware (e.g., Apple TV, Tesla UI), not a typical website. The interface should disappear when not needed, leaving only the content.

## 1. The "North Star" Philosophy
We are building a dedicated OS-like experience for a specific piece of hardware (Meta Portal). 
- **Simplicity is P0**: Users should not have to "figure out" the UI. 
- **Content First**: The frame's job is to show photos. Everything else is secondary.
- **Touch First**: Targets must be large (48px+) and easy to hit on a 10-15" screen.

## 2. User Journey: "The Path to Frame" (P0)
Our primary metric for UX success is **Time to Content**. We minimize friction to get the user looking at their photos.

### Ideal Flow
1.  **Launch**: Webapp opens (Auto-login check).
2.  **Ready State**: 
    *   **If Logged In**: Land directly on a simplified "Ready to Start" view.
        *   *Primary Action*: A massive, centered "Start Frame" button.
        *   *Secondary Actions*: Small, discreet "Settings" or "Mission" links.
    *   **If Guest**: Show the Marketing Hero page.
3.  **Frame Mode**: 
    *   Fullscreen, no UI chrome.
    *   Wake Lock (T17 Video Strategy) active.
    *   *Interaction*: Tapping the screen reveals the "Exit" button.
4.  **Exit**:
    *   Returns to **Dashboard/Settings** for configuration (Feed management, WiFi, etc).

## 3. Visual Identity

### Theme: "Deep Space"
Designed for OLED/LCD displays in dark rooms. Not pure black, but a rich, deep charcoal/black mix.

| Role | Color Name | Hex | Usage |
| :--- | :--- | :--- | :--- |
| **Background** | `Deep Space` | `#050505` | Main app background. |
| **Surface** | `Glass` | `rgba(255, 255, 255, 0.05)` | Card backgrounds, overlays (with `backdrop-blur`). |
| **Primary** | `Electric Blue` | `#3B82F6` | Primary CTAs, active states, focus rings. |
| **Accent** | `Soft Gold` | `#FBBF24` | Premium accents, "Pro" features. |
| **Text** | `Starlight` | `#F3F4F6` | Primary text. |
| **Muted** | `Space Gray` | `#9CA3AF` | Secondary text, captions. |
| **Error** | `Red Dwarf` | `#EF4444` | Destructive actions, errors. |

### Typography
- **Headings**: `Outfit` (Modern, Geometric).
- **Body**: `Inter` (Clean, Neutral).

### Iconography
- **Library**: Heroicons (Outline).
- **Style**: Thin stroke (1.5px - 2px).
- **Usage**: Sparse. Use icons to replace text where meaning is obvious.

## 4. UI Patterns

### Glassmorphism
Use `backdrop-blur-xl` + `bg-white/5` + `border-white/10` for panels. This creates depth without visual heaviness.

### Motion & Feedback
- **Hover**: `scale-105` (Subtle grow) on interactive elements.
- **Transitions**: `duration-300 ease-out` (Smooth, luxurious feel).
- **Page Load**: `animate-fade-in` (Gentle reveal, no jarring pops).

### "Appliance" Feel
- **Hidden Chrome**: Scrollbars are hidden (`scrollbar-hide`) to maintain the illusion of a native app.
- **No Scroll**: The main Frame view must never scroll.
