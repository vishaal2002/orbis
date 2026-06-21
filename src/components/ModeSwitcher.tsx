import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  Drill,
  Zap,
  Sun,
  Moon,
  Plane,
  Stamp,
  Thermometer,
  Shrink,
  GitCompareArrows,
  Route,
  Mountain,
  Rocket,
  LineChart,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { Mode } from '../types';
import { useTheme } from '../theme';

interface ModeMeta {
  id: Mode;
  icon: LucideIcon;
  label: string;
}

const MODE_MAP: Record<Mode, ModeMeta> = {
  dig: { id: 'dig', icon: Drill, label: 'Dig' },
  blast: { id: 'blast', icon: Zap, label: 'Blast' },
  scale: { id: 'scale', icon: Layers, label: 'Scale' },
  shrinkray: { id: 'shrinkray', icon: Shrink, label: 'Shrink' },
  flightradius: { id: 'flightradius', icon: Plane, label: 'Radius' },
  flightroute: { id: 'flightroute', icon: Route, label: 'Route' },
  compare: { id: 'compare', icon: GitCompareArrows, label: 'Compare' },
  timeline: { id: 'timeline', icon: LineChart, label: 'Timeline' },
  population: { id: 'population', icon: Users, label: 'Population' },
  climatetwin: { id: 'climatetwin', icon: Thermometer, label: 'Climate' },
  visa: { id: 'visa', icon: Stamp, label: 'Visa' },
  daynight: { id: 'daynight', icon: Sun, label: 'Day/Night' },
  wonders: { id: 'wonders', icon: Mountain, label: 'Wonders' },
  space: { id: 'space', icon: Rocket, label: 'Space' },
};

const GROUPS: { label: string; modes: Mode[] }[] = [
  { label: 'Explore', modes: ['dig', 'blast', 'scale', 'shrinkray', 'flightradius', 'flightroute'] },
  { label: 'Data', modes: ['compare', 'timeline', 'population', 'climatetwin', 'visa'] },
  { label: 'Sky', modes: ['daynight', 'wonders', 'space'] },
];

interface ModeSwitcherProps {
  mode: Mode;
  onChange: (m: Mode) => void;
}

export default function ModeSwitcher({ mode, onChange }: Readonly<ModeSwitcherProps>) {
  const { theme, toggle } = useTheme();
  const [activeGroup, setActiveGroup] = useState(() =>
    Math.max(0, GROUPS.findIndex(g => g.modes.includes(mode))),
  );
  const modesRef = useRef<HTMLDivElement>(null);
  const activeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const gi = GROUPS.findIndex(g => g.modes.includes(mode));
    if (gi >= 0) setActiveGroup(gi);
  }, [mode]);

  useEffect(() => {
    activeBtnRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [mode, activeGroup]);

  const group = GROUPS[activeGroup];

  return (
    <motion.div
      className="dock"
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="dock-bar">
        <div className="dock-tabs" role="tablist" aria-label="Mode categories">
          {GROUPS.map((g, i) => (
            <button
              key={g.label}
              type="button"
              role="tab"
              aria-selected={activeGroup === i}
              className={`dock-tab${activeGroup === i ? ' active' : ''}`}
              onClick={() => setActiveGroup(i)}
            >
              {g.label}
            </button>
          ))}
        </div>

        <span className="dock-divider" aria-hidden="true" />

        <div className="dock-modes" ref={modesRef} role="tabpanel">
          <AnimatePresence mode="popLayout">
            {group.modes.map(id => {
              const m = MODE_MAP[id];
              const Icon = m.icon;
              const active = mode === id;
              return (
                <motion.button
                  key={id}
                  ref={active ? activeBtnRef : undefined}
                  type="button"
                  layout
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: active ? 1.08 : 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                  className={`dock-mode${active ? ' active' : ''}`}
                  onClick={() => onChange(id)}
                  aria-pressed={active}
                  aria-label={m.label}
                  title={m.label}
                >
                  <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
                  <span>{m.label}</span>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>

        <span className="dock-divider" aria-hidden="true" />

        <button
          className="icon-btn dock-theme"
          onClick={toggle}
          title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
          aria-label="Toggle theme"
          type="button"
        >
          <motion.span
            key={theme}
            initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 320, damping: 18 }}
            style={{ display: 'inline-flex' }}
          >
            {theme === 'dark' ? <Moon size={17} strokeWidth={2} /> : <Sun size={17} strokeWidth={2} />}
          </motion.span>
        </button>
      </div>
    </motion.div>
  );
}
