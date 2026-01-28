# Website Optimisation Plan

This document outlines performance issues causing the "shake" on hard reload and provides safe, non-breaking fixes.

---

## Problem Summary

On hard reload in Chrome, the website experiences a visible "shake" or layout shift. This is caused by multiple factors working together:

1. **GSAP Animation Flash** - Elements render visible, then JavaScript hides them, then animations play
2. **100vw Scrollbar Issue** - `width: 100vw` includes scrollbar width, causing horizontal shifts
3. **Font Loading (FOUT)** - System fonts swap to web fonts causing text reflow
4. **Missing Image Dimensions** - Images without explicit dimensions cause reflow when loaded

---

## Detailed Analysis

### Issue 1: GSAP Animation Flash (HIGH PRIORITY)

**Affected Components:**
- `LandingHero.astro` (lines 211-214)
- `Header.astro` - scroll-triggered collapse
- `MobileHeader.astro` - scroll-triggered collapse
- `AboutSection.astro` - staggered fade-in

**Problem:**
```javascript
// Current: Elements are visible first, then JS hides them
gsap.set([topNav, bottomNav], { opacity: 0, y: -20 });
gsap.set(logo, { opacity: 0, scale: 0.95 });
```

The browser renders elements in their default visible state. Then JavaScript runs and suddenly hides them. This creates a visible flash before animations begin.

**Safe Fix:**
Hide elements via CSS first (before JS runs), then animate them in:

```css
/* Add to component styles - elements start hidden */
.landing-hero-top-nav,
.landing-hero-bottom-nav {
  opacity: 0;
  transform: translateY(-20px);
}

.landing-hero-logo {
  opacity: 0;
  transform: scale(0.95);
}
```

Then update JavaScript to animate FROM these CSS-defined states (no `gsap.set` needed for initial state).

**Risk Level:** LOW - Only changes when elements become visible, not their final appearance.

---

### Issue 2: 100vw Causing Horizontal Scrollbar (HIGH PRIORITY)

**Affected Components:**
- `LandingHero.astro` (line 58): `width: 100vw`
- `Header.astro` (line 74): `width: calc(100vw - 48px)`
- `ImageGallery.astro` (lines 100-178): Multiple `100vw` calculations

**Problem:**
`100vw` equals the full viewport width INCLUDING the scrollbar. When a vertical scrollbar appears, content using `100vw` extends beyond the visible area by ~15-17px, causing horizontal overflow.

**Safe Fixes (choose one per component):**

**Option A: Replace with 100% (Recommended)**
```css
/* Before */
.landing-hero {
  width: 100vw;
}

/* After */
.landing-hero {
  width: 100%;
}
```

**Option B: Use scrollbar-gutter (Modern browsers - Chrome 145+)**
```css
/* In global.css */
html {
  scrollbar-gutter: stable;
}
```
This makes `100vw` scrollbar-aware in modern browsers.

**Option C: CSS Custom Property (JavaScript fallback)**
```javascript
// Calculate actual scrollbar width
const scrollbarWidth = window.innerWidth - document.body.clientWidth;
document.documentElement.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);
```
```css
.element {
  width: calc(100vw - var(--scrollbar-width, 0px));
}
```

**Risk Level:** LOW - The site already uses `overflow-x: clip` on mobile which mitigates this.

---

### Issue 3: Font Loading FOUT (MEDIUM PRIORITY)

**Current Implementation (BaseLayout.astro lines 19-24):**
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Montserrat:wght@500;600;700&family=Roboto:wght@400;500&display=swap" rel="stylesheet" />
```

**Problem:**
`display=swap` shows system fonts immediately, then swaps to web fonts when loaded. This causes visible text reflow, especially noticeable with `letter-spacing: 2.4px` on navigation links.

**Safe Fixes:**

**Option A: Preload Critical Fonts**
```html
<link rel="preload" href="https://fonts.gstatic.com/s/montserrat/v29/JTUSjIg1_i6t8kCHKm459Wlhyw.woff2" as="font" type="font/woff2" crossorigin />
```

**Option B: Use font-display: optional for non-critical fonts**
Change URL parameter from `display=swap` to `display=optional` for fonts that aren't immediately visible.

**Option C: Self-host fonts (Best Performance)**
Download font files and serve from your domain to eliminate external requests.

**Risk Level:** LOW - Only affects font loading timing, not appearance.

---

### Issue 4: Images Without Explicit Dimensions (MEDIUM PRIORITY)

**Affected Components:**
- `LandingHero.astro` - hero background image
- `TESThero.astro` - hero image
- `ImageGallery.astro` - gallery images
- `FullBleedImage.astro` - full-bleed images

**Problem:**
Images without `width` and `height` attributes cause layout shifts when they load because the browser doesn't know how much space to reserve.

**Safe Fix:**
Add explicit dimensions or aspect-ratio to all images:

```html
<!-- Before -->
<img src="/images/hero.webp" alt="" loading="eager" />

<!-- After -->
<img src="/images/hero.webp" alt="" loading="eager" width="1920" height="1080" />
```

Or use CSS aspect-ratio:
```css
.hero-image {
  aspect-ratio: 16 / 9;
  width: 100%;
  height: auto;
}
```

**Risk Level:** LOW - Images will display identically, just reserve space earlier.

---

### Issue 5: Header/Spacer Height Animation (LOW PRIORITY)

**Affected Components:**
- `Header.astro` - animates header height on scroll
- `MobileHeader.astro` - animates header and spacer height
- `TESThero.astro` - spacer height 120vh/120svh

**Problem:**
GSAP-animated heights during scroll can cause layout recalculation, especially when `ScrollTrigger.refresh()` is called on resize/orientation change.

**Current Mitigations Already in Place:**
- `ignoreMobileResize: true` on ScrollTrigger
- Debounced resize handlers (100ms)
- `overflow-x: clip` on mobile

**Safe Enhancement:**
Use CSS `contain: layout` on animated containers to isolate repaints:

```css
.header-inner {
  contain: layout;
}
```

**Risk Level:** VERY LOW - This is already well-handled in the codebase.

---

## Implementation Order

### Phase 1: Quick Wins (No Risk)
1. Add CSS initial states for GSAP-animated elements in `LandingHero.astro`
2. Replace `width: 100vw` with `width: 100%` in `LandingHero.astro`
3. Add `scrollbar-gutter: stable` to `global.css`

### Phase 2: Image Optimisation
4. Add `width` and `height` attributes to hero images
5. Add `aspect-ratio` CSS to image containers

### Phase 3: Font Loading
6. Add font preload hints for Montserrat (used in hero navigation)
7. Consider self-hosting fonts for production

### Phase 4: Advanced (Optional)
8. Add `contain: layout` to animated containers
9. Implement CSS custom property for scrollbar width (fallback for older browsers)

---

## Files to Modify

| File | Changes | Priority |
|------|---------|----------|
| `src/components/LandingHero.astro` | CSS initial states, remove 100vw | HIGH |
| `src/styles/global.css` | Add scrollbar-gutter | HIGH |
| `src/layouts/BaseLayout.astro` | Font preload hints | MEDIUM |
| `src/components/TESThero.astro` | Image dimensions | MEDIUM |
| `src/components/Header.astro` | Replace 100vw calc | LOW |
| `src/components/ImageGallery.astro` | Review 100vw usage | LOW |

---

## Testing Checklist

After each change, verify:
- [ ] Hard reload in Chrome - no shake/flash
- [ ] Scroll animations work correctly
- [ ] Mobile header collapse works
- [ ] Desktop header collapse works
- [ ] Images load without layout shift
- [ ] Fonts render without visible swap
- [ ] No horizontal scrollbar on any viewport size

**Tools for Testing:**
- Chrome DevTools > Performance > Record reload
- Chrome DevTools > Lighthouse > Performance audit
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [CLS Debugger](https://webvitals.dev/cls)

---

## Sources & References

- [Cumulative Layout Shift (CLS) - web.dev](https://web.dev/articles/cls)
- [GSAP and Core Web Vitals - GreenSock Forums](https://gsap.com/community/forums/topic/24495-gsap-and-google-core-web-vitals/)
- [100vw Scrollbar Fix - Smashing Magazine](https://www.smashingmagazine.com/2023/12/new-css-viewport-units-not-solve-classic-scrollbar-problem/)
- [100vw Now Scrollbar-Aware in Chrome 145+ - Bram.us](https://www.bram.us/2026/01/15/100vw-horizontal-overflow-no-more/)
- [Preload Optional Fonts - web.dev](https://web.dev/articles/preload-optional-fonts)
- [FOUT - Google Fonts Knowledge](https://fonts.google.com/knowledge/glossary/fout)
- [Avoid width: 100vw](https://linkedlist.ch/avoid_width_100vw_47/)
- [Why 100vw Causes Horizontal Scrollbar - DEV Community](https://dev.to/tepythai/why-100vw-causes-horizontal-scrollbar-4nlm)
