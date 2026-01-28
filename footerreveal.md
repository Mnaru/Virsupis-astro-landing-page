# Footer Reveal Effect Plan

## Goal
Make the footer appear to be "revealed" from underneath the CTA section as the user scrolls down, similar to how the hero works at the top of the page.

## Current Structure

```
<main>
  <TESThero />              ← position: fixed, z-index: 1

  <div class="content-wrapper">   ← z-index: 10, scrolls over hero
    <AboutSection />
    <FullBleedImage />
    <TextSection />
    ...
    <CTA />                 ← position: relative, bg: cream
    <Footer />              ← position: relative, bg: dark
  </div>
</main>
```

**Current behavior:** Footer scrolls normally with the page as part of content-wrapper.

**Desired behavior:** Footer is fixed at bottom, CTA scrolls up to reveal it.

---

## Research: Best Practices for Footer Reveal

### Pattern 1: Fixed Footer + Spacer (Recommended)
This mirrors the TESThero implementation:

1. **Footer**: `position: fixed; bottom: 0; z-index: 1`
2. **CTA**: Gets a spacer element equal to footer height
3. **Content wrapper**: Ends at CTA, doesn't include footer

**Pros:**
- Consistent with existing hero pattern
- Simple CSS, minimal JS
- Smooth performance
- Natural scrolling feel

**Cons:**
- Footer height must be known/calculated
- Need to handle dynamic footer height on mobile

### Pattern 2: Sticky Footer with Negative Margin
Footer uses `position: sticky; bottom: 0` with negative margin-top on CTA.

**Pros:**
- No JS required for basic effect
- Footer height auto-adjusts

**Cons:**
- Browser support quirks with sticky
- Harder to control reveal timing
- Can cause layout shifts

### Pattern 3: GSAP ScrollTrigger Pin
Pin the footer in place and animate CTA sliding up.

**Pros:**
- Fine-grained control over timing
- Can add parallax effects

**Cons:**
- More complex
- Can conflict with other ScrollTrigger instances
- Performance overhead

---

## Recommended Approach: Pattern 1 (Fixed Footer + Spacer)

This mirrors the TESThero pattern for consistency:

### Changes Required

#### 1. Move Footer Outside content-wrapper (preview.astro)

```astro
<main>
  <TESThero />

  <div class="content-wrapper">
    ...
    <CTA />
    <!-- Footer spacer - creates scroll room -->
    <div class="footer-spacer"></div>
  </div>

  <!-- Footer now outside, fixed at bottom -->
  <Footer />
</main>
```

#### 2. Add Footer Spacer Styles (preview.astro)

```css
.footer-spacer {
  height: var(--footer-height, 500px);
  position: relative;
  z-index: 1;
}

@media (max-width: 768px) {
  .footer-spacer {
    height: var(--footer-height-mobile, 600px);
  }
}
```

#### 3. Update Footer Styles (Footer.astro)

```css
.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1;  /* Below content-wrapper (z-index: 10) */
  /* ... existing styles ... */
}
```

#### 4. Add Bottom Padding/Rounding to CTA (optional)

To create a clean visual separation, CTA could have:
- Bottom border-radius for a "card lifting" effect
- Or stay flat for a "curtain rising" effect

---

## Footer Height Calculation

The footer height varies by viewport:

| Viewport | Approximate Footer Height |
|----------|---------------------------|
| Desktop (>1023px) | ~450px |
| Tablet (768-1023px) | ~500px |
| Mobile (<768px) | ~550-600px |

### Option A: Fixed Values (Simpler)
Use CSS custom properties with breakpoint values.

### Option B: Dynamic JS Calculation
Calculate footer height on load/resize and set CSS variable:

```javascript
function updateFooterHeight() {
  const footer = document.querySelector('.footer');
  if (footer) {
    const height = footer.offsetHeight;
    document.documentElement.style.setProperty('--footer-height', `${height}px`);
  }
}

window.addEventListener('load', updateFooterHeight);
window.addEventListener('resize', debounce(updateFooterHeight, 100));
```

---

## Animation Considerations

### Current Footer Animation
The footer has a fade-in animation triggered at `top 90%`. This needs adjustment:

**Problem:** With fixed positioning, the footer is always "in view" at the bottom.

**Solution:** Change ScrollTrigger to use the footer-spacer as trigger:

```javascript
const tl = gsap.timeline({
  scrollTrigger: {
    trigger: '.footer-spacer',  // Changed from '.footer'
    start: 'top 90%',
    toggleActions: 'play none none none',
  }
});
```

### Optional: CTA Shadow/Lift Effect
Add subtle shadow to CTA bottom as it "lifts" off footer:

```javascript
gsap.to('.cta-section', {
  boxShadow: '0 -20px 60px rgba(0,0,0,0.15)',
  scrollTrigger: {
    trigger: '.footer-spacer',
    start: 'top bottom',
    end: 'top 50%',
    scrub: true,
  }
});
```

---

## Implementation Steps

### Step 1: Update preview.astro Structure
- Move `<Footer />` outside content-wrapper
- Add `.footer-spacer` div after CTA

### Step 2: Update preview.astro Styles
- Add footer-spacer styles with height values
- Ensure content-wrapper still has proper z-index

### Step 3: Update Footer.astro Styles
- Add `position: fixed; bottom: 0; left: 0; right: 0;`
- Change z-index to 1 (below content-wrapper)
- Ensure width: 100%

### Step 4: Update Footer.astro Animation
- Change trigger from `.footer` to `.footer-spacer`
- Test animation timing

### Step 5: (Optional) Add CTA Enhancements
- Consider bottom shadow as it lifts
- Consider subtle border-radius on bottom

### Step 6: Test All Viewports
- Desktop: Verify reveal timing and footer height
- Tablet: Check responsive layout
- Mobile: Test with dynamic toolbar (iOS Safari)

---

## Edge Cases to Handle

1. **iOS Safari Dynamic Toolbar**: Use `100dvh` or fixed pixel values for footer-spacer
2. **Footer Height Changes**: Content inside footer might wrap differently
3. **Page Without CTA**: If CTA is conditional, spacer logic needs adjustment
4. **Print Styles**: Footer should be position: static for printing

---

## Files to Modify

1. `src/pages/preview.astro` - Structure and spacer styles
2. `src/components/Footer.astro` - Fixed positioning and animation trigger
3. (Optional) `src/components/CTA.astro` - Shadow/lift effects

---

## Verification Checklist

- [ ] Footer is fixed at viewport bottom
- [ ] CTA scrolls up and reveals footer underneath
- [ ] Footer content fade-in animation still works
- [ ] No layout jump when reaching footer
- [ ] Works on desktop (>1023px)
- [ ] Works on tablet (768-1023px)
- [ ] Works on mobile (<768px)
- [ ] Works with iOS Safari dynamic toolbar
- [ ] Scroll position doesn't jump unexpectedly
- [ ] Page total scroll height is correct
