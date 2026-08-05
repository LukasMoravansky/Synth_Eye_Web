import { gsap, prefersReducedMotion } from './motion.js';

export function initReveals(root = document, opts = {}) {
  const stagger = opts.stagger ?? 0.08;

  if (prefersReducedMotion()) {
    root.querySelectorAll('[data-reveal], [data-reveal-group] [data-reveal]').forEach((el) => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    return;
  }

  root.querySelectorAll('[data-reveal-group]').forEach((group) => {
    const items = group.querySelectorAll('[data-reveal]');
    if (!items.length) return; // prázdný NodeList = "GSAP target not found" warning
    gsap.from(items, {
      opacity: 0,
      y: 24,
      duration: 0.7,
      stagger,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: group,
        start: 'top 80%',
        toggleActions: 'play none none none',
      },
    });
  });

  root.querySelectorAll('[data-reveal]:not([data-reveal-group] [data-reveal])').forEach((el) => {
    if (el.closest('[data-reveal-group]')) return;
    gsap.from(el, {
      opacity: 0,
      y: 24,
      duration: 0.7,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        toggleActions: 'play none none none',
      },
    });
  });
}
