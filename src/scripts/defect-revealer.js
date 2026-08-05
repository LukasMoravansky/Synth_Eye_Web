import { gsap, isFinePointer, prefersReducedMotion } from './lib/motion.js';

export default function init(root) {
  const wrap = root.querySelector('[data-defect-revealer]');
  const clean = root.querySelector('[data-revealer-clean]');
  const ring = root.querySelector('[data-revealer-ring]');
  if (!wrap || !clean) return;

  let cx = 50;
  let cy = 50;
  let tx = 50;
  let ty = 50;
  let radius = 0;
  let targetR = 180;
  let raf = 0;
  let active = false;

  const reduced = prefersReducedMotion();
  const fine = isFinePointer();

  if (reduced) {
    clean.style.clipPath = 'circle(80px at 50% 50%)';
    return;
  }

  function render() {
    cx += (tx - cx) * 0.15;
    cy += (ty - cy) * 0.15;
    radius += (targetR - radius) * 0.12;
    clean.style.clipPath = `circle(${radius}px at ${cx}% ${cy}%)`;
    if (ring) {
      ring.style.left = `${cx}%`;
      ring.style.top = `${cy}%`;
      ring.style.opacity = active ? '1' : '0';
    }
    if (active) raf = requestAnimationFrame(render);
  }

  function setPos(x, y) {
    const rect = wrap.getBoundingClientRect();
    tx = ((x - rect.left) / rect.width) * 100;
    ty = ((y - rect.top) / rect.height) * 100;
  }

  if (fine) {
    wrap.addEventListener('pointerenter', () => {
      active = true;
      gsap.to({}, { duration: 0.3, onUpdate: () => { targetR = 180; } });
      if (!raf) raf = requestAnimationFrame(render);
    });
    wrap.addEventListener('pointerleave', () => {
      active = false;
      targetR = 0;
      cancelAnimationFrame(raf);
      raf = 0;
    });
    wrap.addEventListener('pointermove', (e) => setPos(e.clientX, e.clientY));
  } else {
    wrap.addEventListener('click', (e) => {
      setPos(e.clientX, e.clientY);
      active = true;
      targetR = 180;
      if (!raf) raf = requestAnimationFrame(render);
    });
  }

  wrap.addEventListener('keydown', (e) => {
    const step = 2;
    if (e.key === 'ArrowLeft') tx = Math.max(0, tx - step);
    if (e.key === 'ArrowRight') tx = Math.min(100, tx + step);
    if (e.key === 'ArrowUp') ty = Math.max(0, ty - step);
    if (e.key === 'ArrowDown') ty = Math.min(100, ty + step);
    if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) {
      active = true;
      targetR = 180;
      if (!raf) raf = requestAnimationFrame(render);
      e.preventDefault();
    }
  });

  const obs = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) {
      active = false;
      cancelAnimationFrame(raf);
      raf = 0;
    }
  });
  obs.observe(wrap);

  return () => { cancelAnimationFrame(raf); obs.disconnect(); };
}
