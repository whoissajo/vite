import { useRef, useState } from 'react';

/** Image comparison slider. before/after are URLs. */
export default function BeforeAfter({ before, after, beforeLabel = 'Original', afterLabel = 'Result', checker = false }) {
  const [pos, setPos] = useState(50);
  const ref = useRef(null);
  const set = (clientX) => {
    const r = ref.current.getBoundingClientRect();
    setPos(Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100)));
  };
  return (
    <div
      ref={ref}
      className={`ba${checker ? ' checker' : ''}`}
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); set(e.clientX); }}
      onPointerMove={(e) => { if (e.buttons) set(e.clientX); }}
    >
      <img src={after} alt={afterLabel} draggable="false" />
      <div className="ba-clip" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <img src={before} alt={beforeLabel} draggable="false" />
      </div>
      <span className="ba-tag ba-tag-l">{beforeLabel}</span>
      <span className="ba-tag ba-tag-r">{afterLabel}</span>
      <div className="ba-handle" style={{ left: `${pos}%` }}>
        <input
          type="range" min="0" max="100" value={pos} aria-label="Comparison position"
          onChange={(e) => setPos(+e.target.value)} onPointerDown={(e) => e.stopPropagation()}
        />
        <i />
      </div>
    </div>
  );
}
