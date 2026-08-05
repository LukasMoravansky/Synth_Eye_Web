import { gsap, prefersReducedMotion } from './lib/motion.js';

/**
 * Spec bridge mezi reálným a renderovaným snímkem — linka se dokreslí na scroll.
 *
 * Výchozí stav v CSS je dokreslená linka (fallback bez JS), takže „skrytí" dělá
 * až tento skript přes fromTo. Při reduced motion nedělá nic a linka zůstane
 * tak, jak ji vykreslilo CSS.
 */
export default function init(root) {
  const line = root.querySelector('.ab-bridge__rule line');
  if (!line || prefersReducedMotion()) return;

  gsap.fromTo(line, { strokeDashoffset: 100 }, {
    strokeDashoffset: 0,
    duration: 0.9,
    ease: 'power2.out',
    scrollTrigger: { trigger: root.querySelector('.ab-pair'), start: 'top 75%', once: true },
  });
}
