# TESThero Desktop Animation Plan

## Current State
- Desktop: Zoom animation (scale 1.05 → 1.0) + fade (opacity 1 → 0.3)
- Mobile: Same zoom/fade animation
- Initial CSS has `transform: scale(1.05)` to prevent flash

## Desired State (Desktop Only)
- **Slide left to right** as user scrolls
- **Fade to dark** (black background already exists)
- **No zoom animation**
- Mobile stays unchanged

---

## Implementation

### 1. CSS Changes

**Remove zoom transform on desktop, add slide setup:**

```css
.test-hero-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  /* Remove scale(1.05) - will be set via JS for mobile only */
}

/* Desktop: wider image for slide effect */
@media (min-width: 769px) {
  .test-hero-image {
    width: 115%;
    transform: translateX(-7.5%); /* Start position - centered, will slide right */
  }
}

/* Mobile: keep existing behavior */
@media (max-width: 768px) {
  .test-hero-image {
    object-fit: contain;
    object-position: center center;
    transform: scale(1.05); /* Initial state for mobile zoom animation */
  }
}
```

**Add overflow hidden to container:**
```css
.test-hero {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  z-index: 1;
  background-color: black;
  overflow: hidden; /* Clip the wider image */
}
```

### 2. JavaScript Changes

**Desktop animation (min-width: 769px):**
```javascript
// Slide left to right + fade to dark
gsap.fromTo(
  heroImage,
  { xPercent: -7.5, opacity: 1 },  // Start: image shifted left
  {
    xPercent: 7.5,                  // End: image shifted right (total 15% movement)
    opacity: 0,                     // Fade to black (container bg)
    ease: 'none',
    scrollTrigger: {
      trigger: heroSpacer,
      start: '10% top',
      end: '60% top',
      scrub: 0.5,
    }
  }
);
```

**Mobile animation (max-width: 768px) - unchanged:**
```javascript
// Keep existing zoom + fade
gsap.fromTo(
  heroImage,
  { scale: 1.05, opacity: 1 },
  {
    scale: 1.0,
    opacity: 0.3,
    ease: 'none',
    scrollTrigger: {
      trigger: heroSpacer,
      start: '10% top',
      end: '60% top',
      scrub: 0.5,
    }
  }
);
```

---

## Summary of Changes in TESThero.astro

### CSS section:
1. Add `overflow: hidden` to `.test-hero`
2. Remove `transform: scale(1.05)` from base `.test-hero-image`
3. Add desktop media query with `width: 115%` and `translateX(-7.5%)`
4. Move `transform: scale(1.05)` to mobile media query only

### Script section:
1. Desktop: Change `scale` to `xPercent` animation (-7.5 → 7.5)
2. Desktop: Change final opacity from 0.3 to 0 (full fade to black)
3. Mobile: Keep existing zoom animation unchanged

---

## Animation Parameters (Adjustable)

| Parameter | Value | Description |
|-----------|-------|-------------|
| Image width | 115% | Extra width for slide room |
| Slide distance | 15% total | From -7.5% to +7.5% |
| Fade end | opacity: 0 | Full fade to black |
| Scroll start | 10% top | When animation begins |
| Scroll end | 60% top | When animation completes |
| Scrub | 0.5 | Smoothing factor |

These can be adjusted after implementation based on visual preference.
