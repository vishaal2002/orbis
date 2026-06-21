import { useEffect, useMemo, useRef } from 'react';

interface Star {
  cx: number;
  cy: number;
  r: number;
  op: number;
  dur: number;
}

export default function StarField() {
  const svgRef = useRef<SVGSVGElement>(null);

  // subtle parallax — stars drift opposite the pointer for depth
  useEffect(() => {
    if (globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    const onMove = (e: PointerEvent) => {
      tx = -((e.clientX / globalThis.innerWidth) * 2 - 1) * 14;
      ty = -((e.clientY / globalThis.innerHeight) * 2 - 1) * 14;
    };
    const tick = () => {
      cx += (tx - cx) * 0.05;
      cy += (ty - cy) * 0.05;
      if (svgRef.current) svgRef.current.style.transform = `translate3d(${cx}px, ${cy}px, 0) scale(1.06)`;
      raf = requestAnimationFrame(tick);
    };
    globalThis.addEventListener('pointermove', onMove);
    tick();
    return () => {
      globalThis.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  const stars = useMemo<Star[]>(() => {
    const count = 190;
    const arr: Star[] = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        cx: Math.random() * 100,
        cy: Math.random() * 100,
        // tiny radii — the viewBox scales these up, so keep them small
        r: Math.random() * 0.09 + 0.03,
        op: Math.random() * 0.32 + 0.12,
        dur: Math.random() * 4 + 3,
      });
    }
    return arr;
  }, []);

  return (
    <svg ref={svgRef} className="starfield" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      {stars.map((s, i) => (
        <circle
          key={i}
          className="star"
          cx={s.cx}
          cy={s.cy}
          r={s.r}
          style={{
            // @ts-expect-error CSS custom property
            '--base-op': s.op,
            opacity: s.op,
            animation: `twinkle ${s.dur}s ease-in-out ${(-s.dur * Math.random()).toFixed(2)}s infinite`,
          }}
        />
      ))}
    </svg>
  );
}
