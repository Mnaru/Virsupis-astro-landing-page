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
