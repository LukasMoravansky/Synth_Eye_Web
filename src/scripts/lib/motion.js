import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');

export { gsap, ScrollTrigger };

export function prefersReducedMotion() {
  return motionQuery.matches;
}

export function isFinePointer() {
  return finePointerQuery.matches;
}

export function onMotionChange(cb) {
  motionQuery.addEventListener('change', cb);
  return () => motionQuery.removeEventListener('change', cb);
}
