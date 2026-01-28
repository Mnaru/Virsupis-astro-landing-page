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

---

# Mobile Menu Implementation

## Design Reference
Based on Figma node 809:17

- Background: cream (#f8f4ee)
- Logo: 189px width, left aligned
- Close icon: 32x32, right aligned
- Menu items: right aligned, stacked vertically
- Font: General Sans Medium, 21px, letter-spacing 4.2px
- Gap between menu items: 32px

## Implementation Steps

### 1. Create Close Icon SVG
**File:** `public/images/Close icon.svg`

Simple X icon, 32x32, stroke color #161514

### 2. Add Mobile Menu Overlay HTML
**File:** `src/components/MobileHeader.astro`

Add after the existing header:
```html
<!-- Mobile Menu Overlay -->
<div class="mobile-menu-overlay" aria-hidden="true">
  <div class="mobile-menu-header">
    <div class="mobile-menu-logo-wrapper">
      <img src="/images/logo.svg" alt="Viršupis" />
    </div>
    <button class="mobile-menu-close" aria-label="Close menu">
      <img src="/images/Close icon.svg" alt="" />
    </button>
  </div>

  <nav class="mobile-menu-nav">
    <a href="#apie-nav" class="mobile-menu-item">APIE</a>
    <a href="https://maps.app.goo.gl/VrLXHLc5Ni44R8rA6" class="mobile-menu-item" target="_blank">ADRESAS</a>
    <a href="https://www.instagram.com/virsupis_vilnius/" class="mobile-menu-item" target="_blank">SEKTI</a>
    <a href="mailto:mindaugas@virsupis.com" class="mobile-menu-item">SUSISIEKTI</a>
  </nav>
</div>
```

### 3. Add Menu Overlay Styles

```css
.mobile-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 0;
  z-index: 200;
  background-color: #f8f4ee;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.mobile-menu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: calc(24px + env(safe-area-inset-top, 0px)) 16px 16px;
}

.mobile-menu-logo-wrapper {
  width: 189px;
}

.mobile-menu-close {
  width: 32px;
  height: 32px;
  background: none;
  border: none;
  cursor: pointer;
}

.mobile-menu-nav {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 32px;
  padding: 42px 16px;
}

.mobile-menu-item {
  font-family: "General Sans", sans-serif;
  font-weight: 500;
  font-size: 21px;
  line-height: 1.1;
  letter-spacing: 4.2px;
  color: #161514;
  text-decoration: none;
  opacity: 0;
  transform: translateY(20px);
}
```

### 4. GSAP Animations

**Open menu:**
```javascript
function openMenu() {
  document.body.style.overflow = 'hidden';

  gsap.to(menuOverlay, {
    height: '100dvh',
    duration: 0.4,
    ease: 'power2.out'
  });

  gsap.to(menuItems, {
    opacity: 1,
    y: 0,
    duration: 0.3,
    stagger: 0.1,
    delay: 0.2,
    ease: 'power2.out'
  });
}
```

**Close menu:**
```javascript
function closeMenu() {
  gsap.to(menuItems, {
    opacity: 0,
    duration: 0.15,
    ease: 'power2.in'
  });

  gsap.to(menuOverlay, {
    height: 0,
    duration: 0.3,
    delay: 0.1,
    ease: 'power2.in',
    onComplete: () => {
      document.body.style.overflow = '';
      gsap.set(menuItems, { opacity: 0, y: 20 });
    }
  });
}
```

### 5. Event Listeners
- Menu button click → openMenu()
- Close button click → closeMenu()
- Menu item click → closeMenu() then navigate
- Escape key → closeMenu()

## Animation Timeline

**Open:**
- 0.0s - Overlay expands (0.4s)
- 0.2s - First menu item fades in
- 0.3s - Second menu item
- 0.4s - Third menu item
- 0.5s - Fourth menu item

**Close:**
- 0.0s - All items fade out (0.15s)
- 0.1s - Overlay contracts (0.3s)

## Verification
- [ ] Menu button opens menu
- [ ] Overlay expands from top
- [ ] Items fade in with stagger
- [ ] Close button closes menu
- [ ] Overlay contracts to top
- [ ] Body scroll locked when open
- [ ] Escape closes menu
- [ ] Item click closes and navigates
