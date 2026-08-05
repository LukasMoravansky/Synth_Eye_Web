import { gsap, ScrollTrigger, prefersReducedMotion } from './motion.js';

/**
 * @param {HTMLElement} el
 * @param {{ to: number, from?: number, decimals?: number, duration?: number, prefix?: string, suffix?: string }} opts
 */
export function animateCounter(el, opts) {
  const {
    to,
    from = 0,
    decimals = 0,
    duration = 1.8,
    prefix = '',
    suffix = '',
  } = opts;

  const format = (v) => {
    const fixed = v.toFixed(decimals);
    const parts = fixed.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `${prefix}${parts.join('.')}${suffix}`;
  };

  if (prefersReducedMotion()) {
    el.textContent = format(to);
    return;
  }

  const obj = { val: from };
  gsap.to(obj, {
    val: to,
    duration,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: el,
      start: 'top 85%',
      toggleActions: 'play none none none',
    },
    onUpdate() {
      el.textContent = format(obj.val);
    },
  });
}

export function initCounters(root = document) {
  root.querySelectorAll('[data-counter]').forEach((el) => {
    const target = parseFloat(el.dataset.counter || '0');
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    animateCounter(el, { to: target, decimals, prefix, suffix });
  });
}
