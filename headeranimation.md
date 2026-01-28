# Header Animation Implementation Guide

## Current Implementation Analysis

### How it works now
The header currently uses GSAP ScrollTrigger with `scrub` mode, which ties the animation progress directly to scroll position:

- **Desktop (Header.astro)**: Animates from 0px to 100px scroll
- **Mobile (MobileHeader.astro)**: Animates from 50px to 150px scroll

The `scrub` property causes the animation to progress incrementally as you scroll, creating a "morphing" effect that follows your scroll position exactly.

### Key files
- `src/components/Header.astro` - Desktop header (lines 157-209)
- `src/components/MobileHeader.astro` - Mobile header (lines 142-192)

---

## Desired Behavior

**Trigger**: When the about section (`#apie`) reaches 20% of the viewport height from the top

**States**:
1. **Expanded** (default): Full-width logo, tall header
2. **Collapsed**: Small logo (318px desktop, 200px mobile), compact header (63px)

**Transitions**:
- **Expand → Collapse**: When about section top enters 80% viewport position (20% from top)
- **Collapse → Expand**: When about section top leaves 80% viewport position (scrolling up)

---

## Best Practices for State-Change Animations

### 1. Use `toggleActions` instead of `scrub`

For state-based animations (vs continuous scroll-linked), use `toggleActions`:

```javascript
scrollTrigger: {
  trigger: "#apie",
  start: "top 80%",  // Top of #apie hits 80% down viewport (20% from top)
  toggleActions: "play none none reverse"
  // Format: onEnter, onLeave, onEnterBack, onLeaveBack
}
```

**toggleActions values:**
- `"play"` - Play animation forward
- `"reverse"` - Play animation backward
- `"none"` - Do nothing
- `"restart"` - Restart from beginning
- `"reset"` - Jump to start state immediately
- `"complete"` - Jump to end state immediately
- `"pause"` - Pause the animation

### 2. Alternative: Use callbacks for more control

For complex logic, use callbacks:

```javascript
scrollTrigger: {
  trigger: "#apie",
  start: "top 80%",
  onEnter: () => collapseHeader(),
  onLeaveBack: () => expandHeader()
}
```

### 3. Add smooth easing for state transitions

Unlike `scrub` which follows scroll exactly, state changes should have easing:

```javascript
gsap.to(logo, {
  width: 318,
  duration: 0.4,
  ease: "power2.out"
});
```

### 4. Track animation state to prevent re-triggers

```javascript
let isCollapsed = false;

function collapseHeader() {
  if (isCollapsed) return;
  isCollapsed = true;
  // animation code...
}
```

---

## Recommended Implementation

### Desktop Header (Header.astro)

Replace lines 157-209 with:

```javascript
// Get the about section as trigger
const aboutSection = document.getElementById("apie");

if (!aboutSection) {
  console.warn("About section #apie not found");
  return;
}

// Track state
let isCollapsed = false;

// Create collapse animation (paused)
const collapseAnim = gsap.timeline({ paused: true })
  .to(logo, {
    width: () => getCollapsedLogoWidth(),
    marginTop: () => getCollapsedMarginTop(),
    duration: 0.4,
    ease: "power2.out"
  }, 0)
  .to(headerInner, {
    height: () => getCollapsedHeight(),
    duration: 0.4,
    ease: "power2.out"
  }, 0)
  .to(spacer, {
    height: () => getCollapsedSpacerHeight(),
    duration: 0.4,
    ease: "power2.out"
  }, 0);

// Create ScrollTrigger for state change
ScrollTrigger.create({
  trigger: aboutSection,
  start: "top 80%",  // When top of #apie is at 80% of viewport (20% from top)
  onEnter: () => {
    if (!isCollapsed) {
      isCollapsed = true;
      collapseAnim.play();
    }
  },
  onLeaveBack: () => {
    if (isCollapsed) {
      isCollapsed = false;
      collapseAnim.reverse();
    }
  },
  invalidateOnRefresh: true
});
```

### Mobile Header (MobileHeader.astro)

Similar approach but within the `matchMedia` block:

```javascript
const aboutSection = document.getElementById("apie");
if (!aboutSection) return;

let isCollapsed = false;

const collapseAnim = gsap.timeline({ paused: true })
  .to(logoWrapper, {
    width: collapsedLogoWidth,
    duration: 0.4,
    ease: "power2.out"
  }, 0)
  .to(menuBtn, {
    autoAlpha: 1,
    duration: 0.3,
    ease: "power2.out"
  }, 0)
  .to(header, {
    height: collapsedHeight + getSafeAreaTop(),
    paddingTop: getCollapsedPadding() + getSafeAreaTop(),
    paddingBottom: getCollapsedPadding(),
    duration: 0.4,
    ease: "power2.out"
  }, 0)
  .to(spacer, {
    height: collapsedHeight + getSafeAreaTop(),
    duration: 0.4,
    ease: "power2.out"
  }, 0);

ScrollTrigger.create({
  trigger: aboutSection,
  start: "top 80%",
  onEnter: () => {
    if (!isCollapsed) {
      isCollapsed = true;
      collapseAnim.play();
    }
  },
  onLeaveBack: () => {
    if (isCollapsed) {
      isCollapsed = false;
      collapseAnim.reverse();
    }
  },
  invalidateOnRefresh: true
});
```

---

## Key Differences from Current Implementation

| Aspect | Current (scrub) | New (state-change) |
|--------|-----------------|-------------------|
| Animation progress | Tied to scroll position | Plays in full once triggered |
| Trigger | Scroll distance from top | About section position |
| Easing | `ease: "none"` | `ease: "power2.out"` |
| Direction reversal | Automatic with scroll | Explicit via `onLeaveBack` |
| User experience | Morphing effect | Snap/toggle effect |

---

## Testing Checklist

- [ ] Header stays expanded on initial load
- [ ] Header collapses when about section reaches 20% viewport
- [ ] Header expands when scrolling back up (about section below 20%)
- [ ] Animation is smooth (not jerky)
- [ ] Works on desktop (md+ breakpoint)
- [ ] Works on mobile (< 768px)
- [ ] Menu button fades in correctly on mobile
- [ ] No layout shifts during animation
- [ ] Refresh/resize doesn't break animation state
- [ ] Back navigation maintains correct state

---

## Potential Edge Cases

1. **Page load mid-scroll**: Check initial position and set correct state
2. **Fast scrolling**: Ensure animation completes before state flip
3. **Resize during animation**: Use `invalidateOnRefresh`
4. **Mobile keyboard**: May affect viewport height calculations

### Initial state check

Add this after creating the ScrollTrigger:

```javascript
// Check if already scrolled past trigger on page load
if (aboutSection.getBoundingClientRect().top < window.innerHeight * 0.8) {
  isCollapsed = true;
  collapseAnim.progress(1); // Jump to collapsed state
}
```

---

## Alternative: Using Intersection Observer (vanilla JS)

If you prefer not to rely on GSAP for the trigger logic:

```javascript
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        collapseHeader();
      } else if (entry.boundingClientRect.top > 0) {
        // Section is below viewport
        expandHeader();
      }
    });
  },
  {
    rootMargin: "-20% 0px -80% 0px",  // Triggers at 20% from top
    threshold: 0
  }
);

observer.observe(document.getElementById("apie"));
```

However, GSAP ScrollTrigger is recommended because:
- Already used in the project
- Better performance optimizations
- Handles edge cases automatically
- Easier to sync with GSAP animations

---

## Summary

The main change is replacing `scrub: 0.5` with `onEnter`/`onLeaveBack` callbacks, which creates a discrete state-change animation instead of a scroll-linked one. This gives users a cleaner "snap" effect when the about section enters the viewport threshold.
