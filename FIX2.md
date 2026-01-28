# Mobile Footer White Square Bug Fix

## Problem Description

On mobile devices (especially iOS), when scrolling down to the footer, a white square/gap appears at the bottom of the footer. This creates an unpolished appearance where the page's light background (#f8f4ee) bleeds through at the bottom.

---

## Root Cause Analysis

The issue is caused by two factors working together:

### 1. Background Color Mismatch During Overscroll

**Current colors:**
- Footer background: `#161514` (dark)
- Body background: `#f8f4ee` (off-white/cream)
- HTML background: not explicitly set

When iOS Safari performs its "bounce" effect at the bottom of the page, it reveals what's behind the content. Since the body background is light (#f8f4ee) and the footer is dark (#161514), the light background shows through as a white square.

### 2. Missing Safe Area Inset Bottom

Modern iOS devices (iPhone X and later) have a home indicator bar at the bottom. The CSS environment variable `env(safe-area-inset-bottom)` provides the height of this safe area.

**Current footer padding:**
```css
.footer {
  padding: 80px 24px 24px;  /* Only 24px at bottom */
}

@media (max-width: 768px) {
  .footer {
    padding: 60px 16px 24px;  /* Only 24px at bottom on mobile */
  }
}
```

The footer doesn't account for the safe area, leaving a gap between the footer content and the actual bottom of the viewport on notched iPhones.

---

## Why It Appears as a "White Square"

1. User scrolls to the bottom of the page
2. iOS Safari allows "overscroll bounce" - the page bounces past its bounds
3. The area below the footer becomes visible during this bounce
4. This area shows the `<body>` background color (#f8f4ee - light/white)
5. Against the dark footer (#161514), this appears as a white square

---

## Safe Fixes

### Fix 1: Add Safe Area Inset Bottom to Footer (RECOMMENDED)

**File: `Footer.astro`**

Extend the footer's padding to include the safe area:

```css
.footer {
  background-color: #161514;
  padding: 80px 24px 24px;
  padding-bottom: calc(24px + env(safe-area-inset-bottom, 0px));
}

@media (max-width: 768px) {
  .footer {
    padding: 60px 16px 24px;
    padding-bottom: calc(24px + env(safe-area-inset-bottom, 0px));
  }
}
```

This ensures the footer extends to cover the home indicator area on notched iPhones.

**Risk Level:** LOW - Only adds padding, no visual change on non-notched devices

---

### Fix 2: Set HTML Background to Match Footer (RECOMMENDED)

**File: `global.css`**

Set the HTML element's background color to match the footer, so overscroll reveals dark instead of light:

```css
html {
  background-color: #161514;  /* Match footer background */
}
```

On Safari, when the page bounces at the bottom, the `<html>` background is what shows through. By making it dark (matching the footer), the bounce will be seamless.

**Risk Level:** LOW - Only affects overscroll appearance

---

### Fix 3: Disable Overscroll Bounce (ALTERNATIVE)

**File: `global.css`**

Completely disable the bounce effect:

```css
body {
  overscroll-behavior-y: none;
}
```

**Caveats:**
- This also disables pull-to-refresh on mobile
- Safari has inconsistent support
- May feel less "native" to iOS users

**Risk Level:** MEDIUM - Changes expected mobile behavior

---

### Fix 4: Extend Footer with Pseudo-Element (ALTERNATIVE)

**File: `Footer.astro`**

Add a pseudo-element that extends the footer's background infinitely downward:

```css
.footer {
  position: relative;
}

.footer::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 100vh;
  background-color: inherit;
  transform: translateY(100%);
  z-index: -1;
}
```

This creates an invisible extension of the footer that covers any gap during overscroll.

**Risk Level:** LOW - Invisible to users, only covers overscroll area

---

## Recommended Implementation

Apply **Fix 1 + Fix 2** together for the best result:

1. **Footer padding** - handles safe area on notched devices
2. **HTML background** - handles overscroll bounce appearance

This combination ensures:
- No white gap on notched iPhones (safe area covered)
- No white flash during overscroll bounce (backgrounds match)
- Pull-to-refresh still works (no overscroll-behavior changes)

---

## Files to Modify

| File | Change | Priority |
|------|--------|----------|
| `src/components/Footer.astro` | Add `env(safe-area-inset-bottom)` to padding | HIGH |
| `src/styles/global.css` | Set `html { background-color: #161514 }` | HIGH |

---

## Code Changes

### Footer.astro (lines 59-67)

```css
/* Before */
.footer {
  background-color: #161514;
  color: var(--color-white, #f8f4ee);
  padding: 80px 24px 24px;
  /* ... */
}

/* After */
.footer {
  background-color: #161514;
  color: var(--color-white, #f8f4ee);
  padding: 80px 24px calc(24px + env(safe-area-inset-bottom, 0px));
  /* ... */
}
```

### Footer.astro mobile (lines 208-213)

```css
/* Before */
@media (max-width: 768px) {
  .footer {
    padding: 60px 16px 24px;
    /* ... */
  }
}

/* After */
@media (max-width: 768px) {
  .footer {
    padding: 60px 16px calc(24px + env(safe-area-inset-bottom, 0px));
    /* ... */
  }
}
```

### global.css (add to html rule)

```css
html {
  scroll-behavior: smooth;
  /* ... existing styles ... */
  background-color: #161514;  /* Match footer for overscroll */
}
```

---

## Testing Checklist

After implementing fixes:

- [ ] Scroll to bottom on iPhone with notch - no white gap
- [ ] Overscroll bounce at bottom - shows dark, not white
- [ ] Footer content not cut off by home indicator
- [ ] Pull-to-refresh still works (if desired)
- [ ] Android Chrome - no visual regression
- [ ] Desktop browsers - no visual regression

---

## References

- [env() CSS Function - MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/env)
- [Mobile-Friendly Footers - Ian J MacIntosh](https://www.ianjmacintosh.com/articles/mobile-friendly-footers/)
- [Adding iOS Safe Areas - Jip Frijlink](https://jipfr.nl/blog/supporting-ios-web/)
- [HTML Background Color and Overscroll - Peter Ramsing](https://peter.coffee/htmls-background-color)
- [Scroll-bounce Background Colour - tempertemper](https://www.tempertemper.net/blog/scroll-bounce-page-background-colour)
- [Scroll Bouncing on Websites - Smashing Magazine](https://www.smashingmagazine.com/2018/08/scroll-bouncing-websites/)
- [overscroll-behavior - MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/overscroll-behavior)
