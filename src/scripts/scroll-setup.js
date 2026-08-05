import Lenis from 'lenis';
import { gsap, ScrollTrigger, prefersReducedMotion } from './lib/motion.js';
import { initReveals } from './lib/reveal.js';
import { initCounters } from './lib/counter.js';

/** @type {import('lenis').default | null} */
let lenisInstance = null;

/**
 * Scroll to a section element via Lenis (prod) or native fallback.
 * @param {Element | null | undefined} el
 * @param {number} [offset=0]
 */
export function scrollToSection(el, offset = 0) {
  if (!el) return;
  const behavior = prefersReducedMotion() ? 'auto' : 'smooth';
  if (lenisInstance) {
    lenisInstance.scrollTo(el, { offset });
  } else {
    el.scrollIntoView({ behavior });
  }
}

function initScroll() {
  if (prefersReducedMotion()) {
    initReveals(document);
    initCounters(document);
    return;
  }

  const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1 });
  lenisInstance = lenis;

  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  ScrollTrigger.scrollerProxy(document.body, {
    scrollTop(value) {
      if (arguments.length) {
        lenis.scrollTo(value, { immediate: true });
      }
      return lenis.scroll;
    },
    getBoundingClientRect() {
      return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
    },
  });

  ScrollTrigger.config({ ignoreMobileResize: true });

  initReveals(document);
  initCounters(document);

  if (import.meta.env.DEV) {
    window.__lenis = lenis;
  }
}

initScroll();

// A11 integration — inspection cursor
import('./inspection-cursor.js');
