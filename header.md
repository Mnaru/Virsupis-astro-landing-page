# Mobile Header Fixed Position Issue

## Problem
On mobile devices, when scrolling up, the header hides underneath the top of the browser instead of staying fixed at the top.

## Constraints
- **MUST NOT** break existing header collapse/expand animations
- **MUST NOT** break pull-to-refresh functionality
- **MUST** work with iOS Safari's dynamic toolbar (address bar show/hide)

---

## Current Implementation Analysis

### MobileHeader.astro
```css
.mobile-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  /* GPU compositing for iOS */
  -webkit-transform: translate3d(0, 0, 0);
  transform: translate3d(0, 0, 0);
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  /* Safe area for notch */
  padding-top: calc(24px + env(safe-area-inset-top, 0px));
}
```

### BaseLayout.astro
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
<!-- iOS fix helper element -->
<div style="position: fixed; top: 0; ..." aria-hidden="true"></div>
```

### global.css
```css
html {
  overscroll-behavior-y: auto; /* Preserves pull-to-refresh */
  background-color: #161514; /* Prevents white flash */
}
```

---

## Root Cause Investigation

### Possible Causes

#### 1. iOS Elastic Overscroll (Rubber-banding)
When pulling down at top of page, iOS shifts the entire viewport including fixed elements. This is **by design** and cannot be disabled without breaking pull-to-refresh.

**Symptoms:** Header moves with page during overscroll, snaps back when released.

#### 2. Dynamic Toolbar Height Not Accounted For
iOS Safari's address bar shows/hides based on scroll direction. When it appears, it may push content down.

**Symptoms:** Header appears to shift when address bar shows.

#### 3. Safe Area Inset Timing
`env(safe-area-inset-top)` might not update immediately during certain scroll states.

**Symptoms:** Brief flicker or misalignment during scroll.

#### 4. GSAP Height Animation Interference
The header's height is animated by GSAP. If the animation sets `height` instead of letting it be `auto`, iOS might calculate positions differently.

**Symptoms:** Header position issues only when collapsed/expanded.

---

## Diagnostic Questions

Before implementing fixes, determine which issue is occurring:

1. **Does it happen during elastic overscroll (pull-to-refresh gesture)?**
   - If yes → This is expected iOS behavior, limited fix options

2. **Does it happen when address bar shows/hides?**
   - If yes → Need viewport unit fix

3. **Does it happen only in collapsed/expanded state?**
   - If yes → GSAP animation issue

4. **Is there a gap between header and browser chrome?**
   - If yes → Safe area calculation issue

---

## Proposed Solutions

### Solution 1: Add `will-change` Property (Low Risk)
Hint to browser that this element needs optimized rendering.

```css
.mobile-header {
  will-change: transform;
}
```

**Pros:** Simple, no behavior change
**Cons:** May not fix the issue

---

### Solution 2: Use `position: sticky` with Top Constraint (Medium Risk)

Change from `fixed` to `sticky` with a wrapper approach.

```html
<div class="header-sticky-wrapper">
  <header class="mobile-header">...</header>
</div>
```

```css
.header-sticky-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  height: 0; /* Wrapper has no height */
  overflow: visible;
}

.mobile-header {
  position: relative; /* Changed from fixed */
  /* ... rest of styles */
}
```

**Pros:** Sticky elements handle elastic scroll better
**Cons:** Requires structural change, needs animation testing

---

### Solution 3: JavaScript Scroll Compensation (Medium Risk)

Detect negative scroll (overscroll) and compensate header position.

```javascript
let lastScrollY = 0;

window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;
  const header = document.querySelector('.mobile-header');

  if (scrollY < 0) {
    // Overscroll - compensate header position
    header.style.transform = `translate3d(0, ${-scrollY}px, 0)`;
  } else {
    header.style.transform = 'translate3d(0, 0, 0)';
  }

  lastScrollY = scrollY;
}, { passive: true });
```

**Pros:** Direct control over position during overscroll
**Cons:**
- May conflict with GSAP animations
- Requires careful integration
- Performance considerations

---

### Solution 4: Use `dvh` Units for Safe Area (Low Risk)

Ensure viewport calculations use dynamic viewport units.

```css
.mobile-header {
  /* Use min() to handle both notch and dynamic toolbar */
  padding-top: calc(24px + max(env(safe-area-inset-top, 0px), 0px));
}
```

Also add to global CSS:
```css
@supports (height: 100dvh) {
  :root {
    --safe-top: env(safe-area-inset-top, 0px);
  }
}
```

**Pros:** Modern approach, handles dynamic viewport
**Cons:** Limited browser support (modern browsers only)

---

### Solution 5: Disable Overscroll on Body, Keep on Document (Medium Risk)

```css
body {
  overscroll-behavior-y: contain;
  /* But allow pull-to-refresh via touch handling */
}
```

Combined with JavaScript to re-enable pull-to-refresh:
```javascript
// Allow pull-to-refresh only at top of page
document.addEventListener('touchstart', (e) => {
  if (window.scrollY === 0) {
    document.body.style.overscrollBehaviorY = 'auto';
  } else {
    document.body.style.overscrollBehaviorY = 'contain';
  }
}, { passive: true });
```

**Pros:** Prevents rubber-banding while preserving refresh
**Cons:** Complex, may have edge cases

---

## Recommended Approach

### Step 1: Diagnose (Before Any Changes)
Test on actual iOS device to determine exact behavior:
- [ ] Does header move during pull-to-refresh gesture?
- [ ] Does header move when address bar shows/hides?
- [ ] Is there a visible gap at top?
- [ ] Does it happen in both expanded and collapsed states?

### Step 2: Apply Solution 1 (Low Risk)
Add `will-change: transform` to `.mobile-header`. Test.

### Step 3: If Still Broken, Apply Solution 4
Add dynamic viewport unit support. Test.

### Step 4: If Still Broken, Apply Solution 3
Add JavaScript scroll compensation. Requires careful GSAP integration:

```javascript
// In MobileHeader.astro script section
// After existing code

// Overscroll compensation (preserves animations)
let compensating = false;

const handleScroll = () => {
  const header = document.querySelector('.mobile-header') as HTMLElement;
  if (!header) return;

  const scrollY = window.scrollY;

  if (scrollY < 0 && !compensating) {
    compensating = true;
    // Apply compensation transform on top of any existing GSAP transforms
    gsap.set(header, { y: -scrollY });
  } else if (scrollY >= 0 && compensating) {
    compensating = false;
    gsap.set(header, { y: 0 });
  } else if (scrollY < 0 && compensating) {
    gsap.set(header, { y: -scrollY });
  }
};

window.addEventListener('scroll', handleScroll, { passive: true });
```

---

## Files to Modify

1. `src/components/MobileHeader.astro` - CSS and potentially JS changes
2. `src/styles/global.css` - If viewport unit changes needed

---

## Testing Checklist

After each change:
- [ ] Header stays at top during normal scroll
- [ ] Header stays at top during overscroll (pull down at top)
- [ ] Pull-to-refresh still works
- [ ] Header collapse animation still works
- [ ] Header expand animation still works
- [ ] Menu button appears/disappears correctly
- [ ] Safe area (notch) spacing is correct
- [ ] Works when address bar shows/hides
- [ ] No flickering or jank
- [ ] Works on iOS Safari
- [ ] Works on Chrome Android
- [ ] Works on desktop (no regressions)

---

## Important Notes

### What NOT to Do
- **Don't** set `overscroll-behavior: none` globally (breaks pull-to-refresh)
- **Don't** use `position: absolute` (breaks fixed behavior)
- **Don't** remove the existing GSAP animations
- **Don't** modify the ScrollTrigger configuration without testing

### GSAP Compatibility
Any transform changes must work with GSAP's transform handling. GSAP manages transforms via inline styles, so:
- Use `gsap.set()` for any positional compensation
- Don't mix CSS transforms with GSAP transforms on same element
- The existing `translate3d(0,0,0)` for GPU compositing is set via CSS and should remain
