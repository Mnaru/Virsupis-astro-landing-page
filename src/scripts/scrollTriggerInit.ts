/**
 * Global ScrollTrigger configuration
 * This script should run ONCE before any components initialize their triggers
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Configure ScrollTrigger globally - ONLY ONCE
ScrollTrigger.config({
  // Prevents scroll position recalculation when mobile browser toolbar shows/hides
  ignoreMobileResize: true,
});

// Set up CSS custom property for stable viewport height
function setViewportHeight() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

// Set initial value
setViewportHeight();

// Single global resize handler with proper debouncing
let globalResizeTimeout: ReturnType<typeof setTimeout>;

function handleResize() {
  clearTimeout(globalResizeTimeout);
  globalResizeTimeout = setTimeout(() => {
    setViewportHeight();
    ScrollTrigger.refresh();
  }, 200);
}

// Only refresh on orientation change (not every resize)
// This prevents scroll jumps from address bar show/hide
window.addEventListener("orientationchange", () => {
  setTimeout(handleResize, 150);
});

// Resize handler for desktop/actual resizes only
let lastWidth = window.innerWidth;
window.addEventListener("resize", () => {
  // Only refresh if width actually changed (not just height from mobile toolbar)
  if (window.innerWidth !== lastWidth) {
    lastWidth = window.innerWidth;
    handleResize();
  }
});

export { gsap, ScrollTrigger };
