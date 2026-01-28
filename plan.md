# TESThero Camera Pan Effect

## Problem
Create a "camera panning left to right" effect on the hero image where:
- The image element stays stationary
- The visible portion of the image changes as user scrolls
- No black background ever visible
- Effect feels like a camera dollying across the scene

## Why Previous Attempts Failed

| Attempt | Why It Failed |
|---------|---------------|
| `xPercent` animation | Physically moves the image element → looks like "image sliding" |
| CSS variable `--pan-x` with `object-position` | GSAP cannot interpolate CSS variables inside `calc()` |
| Direct `objectPosition` string | GSAP can't tween between string values like "30% center" |

## Solution: Background Image with `backgroundPosition`

**GSAP can directly animate `backgroundPosition`** - this is the key insight. Use a `<div>` with `background-image` instead of an `<img>` element.

### File: `src/components/TESThero.astro`

#### HTML Structure
```astro
<section class="test-hero">
  <div class="test-hero-bg"></div>
</section>
<div class="test-hero-spacer"></div>
```

#### CSS
```css
.test-hero {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  z-index: 1;
  background-color: black;
  overflow: hidden;
}

.test-hero-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('/images/Hero%20image.webp');
  background-size: cover;
  background-position: 30% center;
}

@media (max-width: 768px) {
  .test-hero {
    height: 95vh;
  }
  .test-hero-bg {
    background-image: url('/images/Hero%20image%20mobile.webp');
    background-position: center center;
    /* Keep scale transform for mobile zoom effect */
    transform: scale(1.05);
  }
  .test-hero-spacer {
    height: 95vh;
  }
}
```

#### JavaScript
```javascript
ScrollTrigger.matchMedia({
  "(min-width: 769px)": function() {
    // Camera pan: animate backgroundPosition from left to right
    gsap.fromTo(
      heroBg,
      { backgroundPosition: '30% center' },
      {
        backgroundPosition: '70% center',
        ease: 'none',
        scrollTrigger: {
          trigger: document.body,
          start: 'top top',
          end: '+=100vh',
          scrub: 0.5,
        }
      }
    );
  },

  "(max-width: 768px)": function() {
    // Mobile: zoom/fade effect (unchanged)
    gsap.fromTo(heroBg,
      { scale: 1.05, opacity: 1 },
      { scale: 1.0, opacity: 0.3, ... }
    );
  }
});
```

## Why This Works

1. **GSAP's CSSPlugin can interpolate `backgroundPosition`** between percentage values
2. **No element movement** - the div stays in place, background shifts within it
3. **`background-size: cover`** ensures image always fills container
4. **Pan range 30% → 70%** = camera moves across 40% of the horizontal image

## Verification

1. Page load: Shows left portion of image (~30% from left)
2. Scrolling: View smoothly pans rightward across image
3. Full scroll: Shows right portion (~70% from left)
4. No black visible at any point
5. Feels like camera moving, not image sliding

---

# Header Animation Layout Shift Fix

## Problem

When the header collapses at the trigger point, the **about section jumps up**. This creates a jarring experience and can cause a feedback loop where:

1. About section reaches trigger → header collapses
2. Spacer height decreases → content shifts up
3. About section may cross back over trigger → header expands
4. Spacer height increases → content shifts down
5. Repeat...

## Root Cause

The current implementation animates **both** the header AND the spacer:

```javascript
// Header.astro - collapseHeader()
gsap.to(spacer, {
  height: getCollapsedSpacerHeight(),  // 79px
  duration: 0.4,
  ease: "power2.out"
});

// expandHeader()
gsap.to(spacer, {
  height: getSpacerHeight(),  // ~265px (expanded)
  duration: 0.4,
  ease: "power2.out"
});
```

**The spacer is in the document flow**, so when its height changes:
- Content below shifts up/down
- This affects scroll position relative to elements
- Creates unwanted layout shifts

## Solution

**Keep the spacer height FIXED at the expanded size.** Only animate the visual header elements (logo, header inner height), not the spacer.

### Why this works:
- The header is `position: fixed` - it doesn't affect layout
- The spacer's only job is to reserve space so content doesn't hide behind the fixed header
- When header collapses, content should stay in place - the header just becomes smaller visually
- The extra space at top (between collapsed header and content) is acceptable

### Changes Required

#### Header.astro

**Remove spacer animation from `collapseHeader()`:**
```javascript
const collapseHeader = () => {
  gsap.to(logo, {
    width: getCollapsedLogoWidth(),
    marginTop: getCollapsedMarginTop(),
    duration: 0.4,
    ease: "power2.out"
  });
  gsap.to(headerInner, {
    height: getCollapsedHeight(),
    duration: 0.4,
    ease: "power2.out"
  });
  // REMOVE: gsap.to(spacer, {...});
};
```

**Remove spacer animation from `expandHeader()`:**
```javascript
const expandHeader = () => {
  gsap.to(logo, {
    width: getExpandedLogoWidth(),
    marginTop: 37,
    duration: 0.4,
    ease: "power2.out"
  });
  gsap.to(headerInner, {
    height: getExpandedHeight(),
    duration: 0.4,
    ease: "power2.out"
  });
  // REMOVE: gsap.to(spacer, {...});
};
```

**Remove spacer from initial state check:**
```javascript
if (rect.top < window.innerHeight * 0.4) {
  isCollapsed = true;
  gsap.set(logo, { width: getCollapsedLogoWidth(), marginTop: getCollapsedMarginTop() });
  gsap.set(headerInner, { height: getCollapsedHeight() });
  // REMOVE: gsap.set(spacer, {...});
}
```

#### MobileHeader.astro

Same changes - remove all `gsap.to(spacer, ...)` and `gsap.set(spacer, ...)` calls from:
- `collapseHeader()`
- `expandHeader()`
- Initial state check

## Visual Result

**Before (current - problematic):**
```
┌─────────────────┐
│  Collapsed HDR  │  63px
├─────────────────┤
│                 │  ← Content jumps up to fill gap
│  About Section  │
```

**After (fixed):**
```
┌─────────────────┐
│  Collapsed HDR  │  63px
│                 │  ← Empty space (original spacer height preserved)
├─────────────────┤
│  About Section  │  ← Content stays in place
```

The empty space between collapsed header and content is visually acceptable because:
- Users are scrolling down when this happens
- The focus is on content, not the header
- No jarring layout shift

## Files to Modify

1. `src/components/Header.astro` - Remove spacer animations
2. `src/components/MobileHeader.astro` - Remove spacer animations

## After Implementation

1. Remove `markers: true` from both headers
2. Test scroll behavior - content should not jump
3. Verify header collapses/expands smoothly
4. Test on both desktop and mobile
