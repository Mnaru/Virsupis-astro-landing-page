# Mobile Scroll Bug Fix

## Problem Description

On mobile devices, when scrolling down the page and reaching the footer area, the website suddenly scrolls up on its own. This creates a jarring user experience where the page "jumps" back.

---

## Root Cause Analysis

The bug is caused by a combination of factors working together:

### 1. SVH Unit Height Changes (PRIMARY CAUSE)

**Affected Files:**
- `TESThero.astro` (lines 57-58, 64-66)
- `Hero.astro` (lines 55-68)
- `LandingHero.astro` (line 172)

**The Problem:**
```css
/* TESThero.astro */
@media (max-width: 768px) {
  .test-hero {
    height: 100svh;  /* Changes when browser toolbar shows/hides */
  }
  .test-hero-spacer {
    height: 120svh;  /* Changes when browser toolbar shows/hides */
  }
}
```

The `svh` (small viewport height) unit dynamically changes when the mobile browser toolbar appears or disappears during scrolling. This causes:
1. The spacer height to change mid-scroll
2. ScrollTrigger to recalculate positions
3. Content below to shift, triggering an auto-scroll correction

### 2. ScrollTrigger Refresh on Viewport Resize

**Affected Files:**
- `TESThero.astro` - ScrollTrigger with `ignoreMobileResize: true`
- `Header.astro` - Debounced resize listener
- `MobileHeader.astro` - Debounced resize listener
- `ImageGallery.astro` - Resize listener for parallax

While `ignoreMobileResize: true` is set, it only prevents ScrollTrigger from refreshing on resize - it doesn't prevent the DOM elements from physically changing size when `svh` units recalculate.

### 3. Multiple Fixed Elements with Spacers

The page uses a pattern of fixed elements with corresponding spacers:
- `.test-hero` (fixed) + `.test-hero-spacer`
- `.header` / `.mobile-header` (fixed) + spacers

When viewport height changes, these spacers resize, causing the scroll position relative to the footer to change.

### 4. Content Wrapper Negative Margin

**File:** `preview.astro` (lines 86-89)
```css
@media (max-width: 768px) {
  .content-wrapper {
    margin-top: -200px;
  }
}
```

This negative margin combined with dynamic spacer heights creates unpredictable scroll behavior.

---

## Why It Happens at the Footer

1. By the time you reach the footer, you've scrolled through the maximum amount of content
2. The scroll position is at its most "sensitive" - small height changes have big effects
3. Multiple ScrollTrigger animations have completed, but their calculations are based on the original viewport height
4. When the mobile toolbar reappears (common at page bottom), `svh` recalculates, spacers shrink, and the browser "corrects" the scroll position

---

## Safe Fixes

### Fix 1: Replace SVH with Fixed Heights for Spacers (RECOMMENDED)

**File: `TESThero.astro`**

Replace dynamic viewport units with fixed pixel values for spacers:

```css
/* Before */
.test-hero-spacer {
  height: 120vh;
}

@media (max-width: 768px) {
  .test-hero-spacer {
    height: 120svh;
  }
}

/* After */
.test-hero-spacer {
  height: 120vh;
}

@media (max-width: 768px) {
  .test-hero-spacer {
    /* Use vh (not svh) - more stable during toolbar changes */
    height: 120vh;
    /* Or use a fixed calculation */
    min-height: calc(100vh + 100px);
  }
}
```

**Risk Level:** LOW - Only affects spacing, not visible content

---

### Fix 2: Use CSS `position: sticky` Instead of Fixed + Spacer

For the hero, consider using `position: sticky` which doesn't require a spacer:

```css
.test-hero {
  position: sticky;
  top: 0;
  height: 100vh;
  height: 100dvh; /* Dynamic viewport height - updates smoothly */
}
```

**Risk Level:** MEDIUM - Requires testing animations still work

---

### Fix 3: Disable ScrollTrigger Refresh Entirely on Mobile

**Add to any component with ScrollTrigger:**

```javascript
ScrollTrigger.config({
  ignoreMobileResize: true,
  autoRefreshEvents: "visibilitychange,DOMContentLoaded,load" // Remove "resize"
});
```

This prevents ScrollTrigger from recalculating on any resize, including toolbar changes.

**Risk Level:** LOW - May cause minor animation timing differences on orientation change

---

### Fix 4: Lock Scroll Position During Viewport Changes

**Add to `BaseLayout.astro` or a global script:**

```javascript
// Prevent scroll jump on mobile viewport resize
let lastScrollY = 0;
let ticking = false;

window.addEventListener('scroll', () => {
  lastScrollY = window.scrollY;
});

// On resize, restore scroll position
window.addEventListener('resize', () => {
  if (!ticking) {
    window.requestAnimationFrame(() => {
      window.scrollTo(0, lastScrollY);
      ticking = false;
    });
    ticking = true;
  }
});
```

**Risk Level:** LOW - Non-invasive scroll position preservation

---

### Fix 5: Remove Negative Margin on Content Wrapper

**File: `preview.astro`**

```css
/* Before */
@media (max-width: 768px) {
  .content-wrapper {
    margin-top: -200px;
  }
}

/* After - use padding on previous element instead */
@media (max-width: 768px) {
  .content-wrapper {
    margin-top: 0;
    /* Adjust hero spacer height to compensate */
  }
}
```

Then adjust `.test-hero-spacer` height to account for the removed negative margin.

**Risk Level:** MEDIUM - Requires visual testing to ensure layout is preserved

---

## Implementation Order

### Phase 1: Quick Fix (Minimal Risk)
1. Change `120svh` to `120vh` in TESThero spacer
2. Add global ScrollTrigger config to remove resize from autoRefreshEvents

### Phase 2: Structural Fix (If Phase 1 Insufficient)
3. Remove negative margin from content-wrapper
4. Adjust spacer heights accordingly
5. Add scroll position preservation script

### Phase 3: Architecture Improvement (Optional)
6. Consider refactoring to use `position: sticky` for heroes
7. Consolidate all ScrollTrigger configs into a single global setup

---

## Files to Modify

| File | Change | Priority |
|------|--------|----------|
| `src/components/TESThero.astro` | Change `120svh` to `120vh` | HIGH |
| `src/components/TESThero.astro` | Update ScrollTrigger config | HIGH |
| `src/pages/preview.astro` | Remove/adjust negative margin | MEDIUM |
| `src/layouts/BaseLayout.astro` | Add scroll preservation script | LOW |

---

## Testing Checklist

After implementing fixes:

- [ ] Scroll to footer on iOS Safari - no jump
- [ ] Scroll to footer on Android Chrome - no jump
- [ ] Pull down to show address bar at footer - no jump
- [ ] Rotate device at various scroll positions - no jump
- [ ] Hero animations still work correctly
- [ ] Header collapse animation works
- [ ] Parallax images work smoothly
- [ ] No horizontal scrollbar appears

---

## References

- [GSAP ScrollTrigger Mobile Resize Issue](https://github.com/greensock/GSAP/issues/477)
- [ScrollTrigger Tips & Mistakes](https://gsap.com/resources/st-mistakes/)
- [Page Jump After Pinned Section](https://gsap.com/community/forums/topic/37244-page-jump-on-mobile-after-scrolling-past-scrolltrigger-pinned-section/)
- [ScrollTrigger 100vh Calculation Change](https://gsap.com/community/forums/topic/37591-scrolltrigger-100vh-calculation-change-in-3122/)
- [GSAP Resize Bug Case Study](https://sdust.dev/posts/2024-06-24_we-spent-six-days-on-this-gsap-resize-bug)
