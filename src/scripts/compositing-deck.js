import { gsap, isFinePointer, prefersReducedMotion } from './lib/motion.js';

export default function init(root) {
  const layers = [...root.querySelectorAll('.deck-layer')];
  const status = root.querySelector('[data-deck-status]');
  let dragging = null;
  let startX = 0;
  let startY = 0;
  let offsetX = 0;
  let offsetY = 0;

  function resetLayer(el) {
    const i = parseInt(el.dataset.layer, 10);
    gsap.to(el, {
      x: 0,
      y: 0,
      duration: prefersReducedMotion() ? 0 : 0.7,
      ease: 'elastic.out(1, 0.6)',
      onComplete: () => { el.style.zIndex = i + 1; if (status) status.textContent = ''; },
    });
  }

  layers.forEach((layer) => {
    layer.addEventListener('pointerdown', (e) => {
      dragging = layer;
      startX = e.clientX;
      startY = e.clientY;
      layer.classList.add('is-dragging');
      layer.style.zIndex = 10;
      layer.setPointerCapture(e.pointerId);
      if (status) status.textContent = layer.getAttribute('aria-label');
    });

    layer.addEventListener('pointermove', (e) => {
      if (dragging !== layer) return;
      offsetX = e.clientX - startX;
      offsetY = e.clientY - startY;
      layer.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    });

    layer.addEventListener('pointerup', () => {
      if (dragging !== layer) return;
      layer.classList.remove('is-dragging');
      resetLayer(layer);
      dragging = null;
    });

    if (!isFinePointer()) {
      layer.addEventListener('click', () => {
        gsap.to(layer, { x: 40, y: -20, duration: 0.3, yoyo: true, repeat: 1 });
      });
    }

    layer.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') resetLayer(layer);
      if (e.key === 'Enter' || e.key === ' ') {
        gsap.to(layer, { x: 60, duration: 0.3, onComplete: () => resetLayer(layer) });
        e.preventDefault();
      }
    });
  });
}
