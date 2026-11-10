import { useEffect, useRef, useState } from 'react';

/** Cursor-following spotlight: lightweight no-op to prevent pointer-move reflows on low-end hardware. */
export function useSpotlight() {
  return {};
}

/** Adds `.in` once the element scrolls into view (CSS handles the animation). */
export function useReveal(options = { threshold: 0.08, rootMargin: '0px 0px -4% 0px' }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (!('IntersectionObserver' in window)) { el.classList.add('in'); return undefined; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add('in'); io.disconnect(); } }, options);
    io.observe(el);
    return () => io.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return ref;
}

/** Animates 0 → value when scrolled into view. */
export function useCountUp(target, { duration = 1200 } = {}) {
  const ref = useRef(null);
  const [val, setVal] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { setVal(target); return undefined; }
    let raf;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const step = (t) => {
        const p = Math.min(1, (t - t0) / duration);
        setVal(Math.round(target * (1 - (1 - p) ** 3)));
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, { threshold: 0.3 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [target, duration]);
  return [ref, val];
}
