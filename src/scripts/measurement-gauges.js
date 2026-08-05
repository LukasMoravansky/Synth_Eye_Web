import { gsap, ScrollTrigger, prefersReducedMotion } from './lib/motion.js';

export default function init(root) {
  const tabs = root.querySelectorAll('[data-side]');
  const frontImg = root.querySelector('.measure-front');
  const backImg = root.querySelector('.measure-back');
  const methodLabel = root.querySelector('[data-method-label]');
  const gauges = root.querySelectorAll('.gauge');
  const dims = root.querySelectorAll('.dim-mark');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => { t.classList.remove('is-active'); t.setAttribute('aria-selected', 'false'); });
      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');
      const side = tab.dataset.side;
      if (frontImg) frontImg.hidden = side !== 'front';
      if (backImg) backImg.hidden = side !== 'back';
      if (methodLabel) {
        methodLabel.textContent = side === 'front' ? 'method: hough_circles' : 'method: contour_analysis';
      }
    });
  });

  function linkDim(id) {
    gauges.forEach((g) => g.classList.toggle('is-active', g.dataset.dim === id));
    dims.forEach((d) => d.classList.toggle('is-active', d.dataset.dim === id));
  }

  gauges.forEach((g) => {
    g.addEventListener('click', () => linkDim(g.dataset.dim));
    const needle = g.querySelector('[data-gauge-needle]');
    const val = parseFloat(g.dataset.value);
    const ref = parseFloat(g.dataset.ref);
    const tol = parseFloat(g.dataset.tol);
    const min = ref - tol;
    const max = ref + tol;
    const pct = ((val - min) / (max - min)) * 100;
    if (prefersReducedMotion()) {
      if (needle) needle.style.left = `${Math.min(100, Math.max(0, pct))}%`;
    } else {
      gsap.fromTo(needle, { left: '0%' }, {
        left: `${Math.min(100, Math.max(0, pct))}%`,
        duration: 0.9,
        ease: 'elastic.out(1, 0.5)',
        scrollTrigger: { trigger: g, start: 'top 85%' },
        delay: [...gauges].indexOf(g) * 0.12,
      });
    }
  });

  dims.forEach((d) => {
    d.style.pointerEvents = 'all';
    d.addEventListener('click', () => linkDim(d.dataset.dim));
  });
}
