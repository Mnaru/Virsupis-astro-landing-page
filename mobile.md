# Mobile Scroll Jump Issue - Investigation & Fix Plan

## Problem
On real mobile devices, the page suddenly scrolls up while scrolling down.

---

## Root Causes Identified

### 1. Multiple Conflicting ScrollTrigger.config() Calls
**Files affected:** TESThero.astro, MobileHeader.astro

Both components call `ScrollTrigger.config({ ignoreMobileResize: true })` independently. This should be configured **once globally** before any triggers are created.

```javascript
// TESThero.astro:78-80
ScrollTrigger.config({
  ignoreMobileResize: true,
});

// MobileHeader.astro:90-92
ScrollTrigger.config({
  ignoreMobileResize: true,
});
```

**Problem:** When called multiple times, later calls can reset or conflict with earlier configurations.

---

### 2. Negative Margin on Content Wrapper (Mobile)
**File:** preview.astro:104-107

```css
@media (max-width: 768px) {
  .content-wrapper {
    margin-top: -200px;
  }
}
```

**Problem:** This negative margin pulls content up over the hero spacer, creating a mismatch between:
- What the user sees (content appears at position X)
- What ScrollTrigger calculates (content is at position X - 200px)

When ScrollTrigger recalculates positions (on any refresh), this discrepancy can cause scroll jumps.

---

### 3. MobileHeader Height Animation Without Fixed Spacer
**File:** MobileHeader.astro

The header animates between expanded (~120px) and collapsed (~63px) heights. While the spacer is set initially, the **header element itself** changes height, which can trigger layout recalculations.

```javascript
// Header height changes from ~120px to ~63px
gsap.to(header, {
  height: collapsedHeight + getSafeAreaTop(),
  ...
});
```

**Problem:** iOS Safari can interpret header height changes as layout shifts, triggering scroll position recalculations.

---

### 4. Multiple ScrollTrigger.refresh() Calls
**Files:** MobileHeader.astro, ImageGallery.astro, Header.astro

Each component has its own resize/orientationchange handlers:

```javascript
// MobileHeader.astro:252-260
window.addEventListener("resize", () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => ScrollTrigger.refresh(), 100);
});

// ImageGallery.astro:355-363
window.addEventListener("resize", () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    initParallax();
    ScrollTrigger.refresh();
  }, 100);
});
```

**Problem:** Multiple refresh calls with different timeouts (100ms each) can fire in cascade, causing scroll position to jump as each recalculates.

---

### 5. VH Units on iOS Safari
**File:** TESThero.astro

```css
@media (max-width: 768px) {
  .test-hero {
    height: 95vh;
  }
  .test-hero-spacer {
    height: 95vh;
  }
}
```

**Problem:** Even with `ignoreMobileResize: true`, the initial render uses `vh` which equals the **large viewport height** on iOS. When content starts scrolling and the address bar minimizes, the visual relationship between fixed hero and scrolling content can shift.

---

### 6. Fixed Positioning Stack Complexity
Multiple fixed elements with different z-indices:

| Element | Position | Z-Index |
|---------|----------|---------|
| Footer | fixed | 0 |
| TESThero | fixed | 1 |
| Content-wrapper | relative | 10 |
| MobileHeader | fixed | 100 |

**Problem:** iOS Safari has known issues with multiple fixed elements, especially when combined with scroll-triggered animations.

---

## Recommended Fixes

### Fix 1: Global ScrollTrigger Configuration (Priority: HIGH)
Create a single initialization script that runs before all components.

**Create:** `src/scripts/scrollTriggerConfig.ts`
```typescript
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Configure ONCE globally
ScrollTrigger.config({
  ignoreMobileResize: true,
  // Prevent scroll position changes during refresh
  autoRefreshEvents: "visibilitychange,DOMContentLoaded,load"
});

// Single global refresh handler with debouncing
let globalResizeTimeout: ReturnType<typeof setTimeout>;
const debouncedRefresh = () => {
  clearTimeout(globalResizeTimeout);
  globalResizeTimeout = setTimeout(() => {
    ScrollTrigger.refresh();
  }, 200); // Longer debounce
};

window.addEventListener("resize", debouncedRefresh);
window.addEventListener("orientationchange", () => {
  setTimeout(debouncedRefresh, 150);
});

export { gsap, ScrollTrigger };
```

**Then update all components** to import from this file instead of gsap directly, and **remove** their individual `ScrollTrigger.config()` and resize handlers.

---

### Fix 2: Remove Negative Margin, Use Proper Overlap (Priority: HIGH)
**File:** preview.astro

Replace the negative margin with a proper structure:

```css
@media (max-width: 768px) {
  .content-wrapper {
    /* Remove: margin-top: -200px; */
    /* Content naturally follows hero spacer */
  }

  /* If overlap effect is needed, use the hero spacer height instead */
  .test-hero-spacer {
    height: calc(95vh - 200px); /* Reduce spacer instead of negative margin */
  }
}
```

Or better - handle the overlap in TESThero.astro mobile styles.

---

### Fix 3: Stabilize MobileHeader Height (Priority: MEDIUM)
**File:** MobileHeader.astro

Instead of animating the actual header height, use a fixed height container with content that scales:

```css
.mobile-header {
  /* Fixed height - never changes */
  height: calc(120px + env(safe-area-inset-top, 0px));
  /* Content aligns to top, extra space hidden */
  overflow: hidden;
}

.mobile-header.collapsed {
  /* Visual collapse without actual height change */
  /* Use transform/opacity on inner elements instead */
}
```

**Or** use `transform: translateY()` to visually collapse while maintaining layout height.

---

### Fix 4: Use CSS Custom Properties for Viewport Height (Priority: MEDIUM)
**File:** BaseLayout.astro or global.css

```javascript
// In a script that runs early
function setViewportHeight() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}
setViewportHeight();
// Only update on orientation change, not scroll
window.addEventListener('orientationchange', () => {
  setTimeout(setViewportHeight, 100);
});
```

Then in CSS:
```css
.test-hero {
  height: calc(var(--vh, 1vh) * 95);
}
```

This locks the viewport height at initial load and only updates on orientation change.

---

### Fix 5: Add will-change and Isolation (Priority: LOW)
**File:** preview.astro, MobileHeader.astro

```css
.content-wrapper {
  /* Create stacking context, improve compositing */
  isolation: isolate;
  will-change: transform;
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
}

.mobile-header {
  /* Already has transform: translate3d(0,0,0) - good */
  will-change: transform;
}
```

---

### Fix 6: Disable Parallax on Mobile (Priority: MEDIUM)
**Files:** ImageGallery.astro, FullBleedImage.astro

ImageGallery already checks `window.innerWidth < 1024`, but verify FullBleedImage also disables parallax scrub animations on mobile.

---

## Implementation Order

1. **Fix 1** - Create global ScrollTrigger config (eliminates multiple config conflicts)
2. **Fix 2** - Remove negative margin (most likely cause of scroll jump)
3. **Fix 4** - CSS custom property for viewport height
4. **Fix 3** - Stabilize MobileHeader (if issues persist)
5. **Fix 5 & 6** - Performance optimizations

---

## Testing Checklist

After each fix, test on real iOS device (Safari):

- [ ] Load page, scroll slowly down through hero
- [ ] Scroll past AboutSection (header collapse trigger point)
- [ ] Continue scrolling to footer
- [ ] Scroll back up to top
- [ ] Pull-to-refresh works without issues
- [ ] Rotate device, scroll behavior still works
- [ ] No scroll jumps at any point

---

## Quick Debug Steps

To identify which fix is most critical, add this debug code temporarily:

```javascript
// In browser console on mobile
let lastScroll = 0;
window.addEventListener('scroll', () => {
  const current = window.scrollY;
  const diff = current - lastScroll;
  if (Math.abs(diff) > 100) {
    console.log(`JUMP: ${diff}px at ${current}`);
  }
  lastScroll = current;
});
```

This will log when scroll jumps more than 100px, helping identify where/when the issue occurs.
