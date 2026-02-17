
# Next Sprint Prompt: Photo Slideshow Implementation

I am working on **SaveMyPortal**, a React application designed to repurpose Facebook Portal devices as smart displays. We have already established the core foundation (`HeartbeatVideo` component) to prevent the device from sleeping.

**Current State**:
- Repo: `starbrightlab/starbrightlab/savemyportal`
- Tech: React 18, Vite
- Core Feature: `src/components/HeartbeatVideo.jsx` (Keeps device awake via T17 strategy)
- Documentation: `ARCHITECTURE.md` (Read this first!)

**Objective**:
Implement the **Photo Slideshow** component, which is the primary feature of the product.

**Requirements**:
1.  **Component**: Create `src/components/Slideshow.jsx`.
2.  **Data Source**: For MVP, fetch a list of images from a public API (e.g., Unsplash/Picsum) or a local JSON file.
3.  **Transitions**: Smooth cross-fade effect between images.
4.  **Hardware Constraints** (Critical):
    - Target: Chrome 98 WebView on low-memory Android hardware.
    - **Memory Management**: Do NOT load all images at once. Use a "sliding window" approach (keep only current, previous, and next image in DOM).
    - **Formats**: Prefer WebP/JPEG. Avoid AVIF.
5.  **Integration**: Add the Slideshow to `src/App.jsx` inside the `Layout` component, layered *above* the HeartbeatVideo (`z-index: 10`).

**References**:
- See `ARCHITECTURE.md` for proper layering.
- See `CONTRIBUTING.md` for detailed hardware constraints.
