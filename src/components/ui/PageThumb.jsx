import { useEffect, useRef } from 'react';
import { renderPage } from '../../lib/pdf/core.js';

/** Lazy PDF page thumbnail: renders only when scrolled into view, cancels on unmount. */
export default function PageThumb({ pdf, pageNo, width = 160, rotate = 0 }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    if (!c || !pdf) return undefined;
    let dead = false;
    const io = new IntersectionObserver(async ([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      try {
        const page = await pdf.getPage(pageNo);
        const base = page.getViewport({ scale: 1 });
        if (dead) return;
        await renderPage(pdf, pageNo, (width * (window.devicePixelRatio > 1 ? 1.5 : 1)) / base.width, c);
      } catch { /* destroyed while rendering */ }
    }, { rootMargin: '300px' });
    io.observe(c);
    return () => { dead = true; io.disconnect(); };
  }, [pdf, pageNo, width]);
  return <canvas ref={ref} className="page-thumb" style={{ transform: rotate ? `rotate(${rotate}deg)` : undefined, aspectRatio: '3/4' }} />;
}
