import type { CSSProperties } from 'react';
import type { Mode } from '../types';

/** A small looping illustration that hints at what each mode does. */
export default function ModePreview({ mode }: Readonly<{ mode: Mode }>) {
  return (
    <div className="mode-prev" aria-hidden="true">
      <svg className="mp-svg" viewBox="0 0 120 72" preserveAspectRatio="xMidYMid meet">
        {MOTIFS[mode]}
      </svg>
    </div>
  );
}

const A = 'var(--accent)';
const A2 = 'var(--accent-2)';
const delay = (s: number): CSSProperties => ({ animationDelay: `${s}s` });

const popGrid = () => {
  const dots = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 6; c++) {
      const op = 0.25 + ((r + c) % 4) * 0.22;
      dots.push(
        <circle
          key={`${r}-${c}`}
          className="mp-pop"
          cx={26 + c * 14}
          cy={22 + r * 14}
          r={2.4}
          fill={A}
          opacity={op}
          style={delay((r + c) * 0.12)}
        />,
      );
    }
  }
  return dots;
};

const visaGrid = () => {
  const cells = [];
  for (let i = 0; i < 9; i++) {
    const x = 42 + (i % 3) * 14;
    const y = 18 + Math.floor(i / 3) * 14;
    cells.push(
      <rect key={i} className="mp-fill" x={x} y={y} width={11} height={11} rx={2} style={delay(i * 0.16)} />,
    );
  }
  return cells;
};

const MOTIFS: Record<Mode, React.ReactNode> = {
  dig: (
    <>
      <circle cx={60} cy={36} r={22} fill="none" stroke={A} strokeWidth={2} opacity={0.5} />
      <line x1={38} y1={36} x2={82} y2={36} stroke={A2} strokeWidth={2} strokeDasharray="3 3" opacity={0.7} />
      <circle className="mp-slide" cx={60} cy={36} r={3.6} fill={A2} />
    </>
  ),
  blast: (
    <>
      <circle className="mp-ping" cx={60} cy={36} r={18} fill="none" stroke={A} strokeWidth={2} />
      <circle className="mp-ping" cx={60} cy={36} r={18} fill="none" stroke={A2} strokeWidth={2} style={delay(0.9)} />
      <circle cx={60} cy={36} r={4.5} fill={A2} />
    </>
  ),
  truesize: (
    <>
      <rect x={48} y={30} width={20} height={16} fill={A} opacity={0.28} />
      <rect className="mp-grow" x={36} y={16} width={48} height={40} fill="none" stroke={A} strokeWidth={2} />
    </>
  ),
  flight: (
    <>
      <path d="M28,54 Q60,6 92,40" fill="none" stroke={A2} strokeWidth={2} strokeDasharray="3 3" opacity={0.6} />
      <circle cx={28} cy={54} r={3.5} fill={A} />
      <circle cx={92} cy={40} r={3.5} fill={A} />
      <circle className="mp-plane" r={3.2} fill={A2} style={{ offsetPath: "path('M28,54 Q60,6 92,40')" } as CSSProperties} />
    </>
  ),
  compare: (
    <>
      <rect className="mp-bar" x={44} y={18} width={12} height={36} rx={2} fill={A} style={{ transformOrigin: '50px 54px' }} />
      <rect className="mp-bar" x={64} y={30} width={12} height={24} rx={2} fill={A2} style={{ transformOrigin: '70px 54px', animationDelay: '0.4s' }} />
    </>
  ),
  timeline: (
    <polyline
      className="mp-draw"
      points="28,52 44,46 58,48 74,30 92,20"
      fill="none"
      stroke={A}
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  population: <>{popGrid()}</>,
  climatetwin: (
    <>
      <path d="M40,28 Q60,54 80,42" fill="none" stroke={A2} strokeWidth={2} strokeDasharray="3 3" opacity={0.6} />
      <circle cx={40} cy={28} r={4} fill={A} />
      <circle className="mp-pop" cx={80} cy={42} r={4} fill={A2} />
    </>
  ),
  visa: <>{visaGrid()}</>,
  daynight: (
    <>
      <circle cx={60} cy={36} r={20} fill={A} opacity={0.14} stroke={A} strokeWidth={2} />
      <path className="mp-spin" d="M60,16 A20,20 0 0 1 60,56 Z" fill="var(--bg)" opacity={0.55} style={{ transformOrigin: '60px 36px' }} />
      <circle cx={60} cy={36} r={20} fill="none" stroke={A} strokeWidth={2} opacity={0.5} />
    </>
  ),
  wonders: (
    <>
      <path d="M30,52 L52,24 L74,52 Z" fill={A} opacity={0.3} stroke={A} strokeWidth={2} />
      <path d="M74,52 L88,34 L98,52 Z" fill={A} opacity={0.2} stroke={A} strokeWidth={1.5} />
      <g className="mp-twinkle" style={{ transformOrigin: '84px 22px' }}>
        <path d="M84,16 L86,21 L91,22 L86,23 L84,28 L82,23 L77,22 L82,21 Z" fill={A2} />
      </g>
    </>
  ),
  space: (
    <>
      <circle cx={56} cy={40} r={13} fill={A} opacity={0.2} stroke={A} strokeWidth={2} />
      <circle cx={56} cy={40} r={26} fill="none" stroke={A2} strokeWidth={1.5} opacity={0.45} />
      <g className="mp-spin" style={{ transformOrigin: '56px 40px' }}>
        <circle cx={82} cy={40} r={3.2} fill={A2} />
      </g>
      <circle cx={96} cy={18} r={4} fill="#c2c7d0" />
    </>
  ),
};
