import { ScrollTrigger } from './motion.js';

const observers = new Map();

/**
 * Lazy-init when element is ~15% visible (rootMargin 200px).
 * @param {string} selector
 * @param {() => Promise<{ default?: (el: Element) => void }>} loader
 * @param {{ onExit?: () => void }} [opts]
 */
export function whenVisible(selector, loader, opts = {}) {
  const handles = [];

  const initOne = async (el) => {
    if (el.dataset.lazyInit === 'true') return;
    el.dataset.lazyInit = 'true';
    try {
      const mod = await loader();
      if (typeof mod.default === 'function') {
        mod.default(el);
        requestAnimationFrame(() => ScrollTrigger.refresh());
      }
    } catch (err) {
      console.error(`lazy-init failed for ${selector}`, err);
    }
  };

  const observe = (el) => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            initOne(entry.target);
          } else if (opts.onExit) {
            opts.onExit();
          }
        });
      },
      { threshold: 0.15, rootMargin: '200px' }
    );
    observer.observe(el);
    observers.set(el, observer);
    handles.push({
      destroy() {
        observer.disconnect();
        observers.delete(el);
        delete el.dataset.lazyInit;
      },
    });
  };

  document.querySelectorAll(selector).forEach(observe);

  const mo = new MutationObserver(() => {
    document.querySelectorAll(selector).forEach((el) => {
      if (!observers.has(el)) observe(el);
    });
  });
  mo.observe(document.body, { childList: true, subtree: true });

  return {
    destroy() {
      handles.forEach((h) => h.destroy());
      mo.disconnect();
    },
  };
}
