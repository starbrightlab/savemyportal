
# Contributing to SaveMyPortal

Thank you for helping keep these devices out of the landfill!

## Target Hardware Constraints
**Device**: Facebook Portal Plus (Gen 2)
**OS**: Portal OS (Android-based Kiosk)
**Browser**: Chrome 98 (WebView) - **DO NOT UPGRADE DEPENDENCIES WITHOUT VERIFICATION**

### Critical Compatibility Notes
Because we are targeting a specific, older browser version (early 2022), you must adhere to the following constraints. **Failure to do so will brick the app on the target hardware.**

1.  **Image Formats**:
    - ✅ JPEG, PNG, WebP
    - ⚠️ AVIF (Supported in Chrome 85+, but some Android WebViews strip support. Test on device!)

2.  **CSS Layout**:
    - ✅ Flexbox, Grid
    - ❌ Container Queries (Not supported until Chrome 105)
    - ❌ `:has()` selector (Not supported until Chrome 105)
    - ❌ Nesting (Not supported until Chrome 112) -> Use standard CSS or PostCSS nesting plugin.

3.  **Performance**:
    - The device has limited RAM. Aggressive garbage collection will kill the tab if memory usage spikes.
    - **Avoid**: Loading 50+ high-res images into the DOM at once.
    - **Use**: Virtualization or aggressive cleanup of old image nodes in the slideshow.

4.  **Touch Interaction**:
    - The touchscreen is capacitive but can be finicky near edges.
    - Avoid swipe gestures if possible (conflicts with OS navigation).
    - Use click/tap events rather than complex pointer events.

## Development Workflow

1.  **Install**: `npm install`
2.  **Start**: `npm run dev`
3.  **Test**: Open `http://localhost:5173` in your browser.
4.  **Verify**: If possible, deploy to a preview URL and test on an actual Portal device. The simulator cannot replicate the Power Management logic.
