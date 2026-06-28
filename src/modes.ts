import {
  Layers,
  Drill,
  Zap,
  Sun,
  Plane,
  Stamp,
  Thermometer,
  GitCompareArrows,
  Mountain,
  Rocket,
  LineChart,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { Mode } from './types';

export type ModeGroup = 'Explore' | 'Data' | 'Sky';

export interface ModeMeta {
  id: Mode;
  icon: LucideIcon;
  /** Short label for the dock. */
  label: string;
  group: ModeGroup;
  /** One-line description of what the mode does. */
  blurb: string;
  /** Concrete example to spark curiosity. */
  example: string;
  /** Highlighted as a great starting point for new users. */
  recommended?: boolean;
}

/** Single source of truth for every mode — used by the dock and the gallery. */
export const MODE_META: Record<Mode, ModeMeta> = {
  dig: {
    id: 'dig', icon: Drill, label: 'Dig', group: 'Explore',
    blurb: 'Tunnel straight through the planet',
    example: 'Where do you surface from Delhi?',
    recommended: true,
  },
  blast: {
    id: 'blast', icon: Zap, label: 'Blast', group: 'Explore',
    blurb: 'Simulate an asteroid impact',
    example: 'Drop a city-killer on London',
  },
  truesize: {
    id: 'truesize', icon: Layers, label: 'True Size', group: 'Explore',
    blurb: 'Real country size vs the flat map',
    example: 'India is 3× bigger than it looks',
    recommended: true,
  },
  flight: {
    id: 'flight', icon: Plane, label: 'Flight', group: 'Explore',
    blurb: 'How far you can fly, and routes',
    example: '6 hours out of Dubai',
  },
  compare: {
    id: 'compare', icon: GitCompareArrows, label: 'Compare', group: 'Data',
    blurb: 'Two countries, side by side',
    example: 'India vs China, by the numbers',
  },
  timeline: {
    id: 'timeline', icon: LineChart, label: 'Timeline', group: 'Data',
    blurb: "A country's history in data",
    example: "India's population since 1990",
  },
  population: {
    id: 'population', icon: Users, label: 'Population', group: 'Data',
    blurb: 'Where people are packed in',
    example: 'Find the densest countries',
  },
  climatetwin: {
    id: 'climatetwin', icon: Thermometer, label: 'Climate', group: 'Data',
    blurb: 'Cities that feel like home',
    example: "London's climate twins",
  },
  visa: {
    id: 'visa', icon: Stamp, label: 'Visa', group: 'Data',
    blurb: 'Where your passport goes visa-free',
    example: 'See your passport’s reach',
    recommended: true,
  },
  daynight: {
    id: 'daynight', icon: Sun, label: 'Day/Night', group: 'Sky',
    blurb: 'Watch the sun move in real time',
    example: 'Where is it night right now?',
    recommended: true,
  },
  wonders: {
    id: 'wonders', icon: Mountain, label: 'Wonders', group: 'Sky',
    blurb: "Tour Earth's natural wonders",
    example: 'Fly to Mount Everest',
    recommended: true,
  },
  space: {
    id: 'space', icon: Rocket, label: 'Space', group: 'Sky',
    blurb: 'Earth from orbit, with the live ISS',
    example: 'Track the ISS right now',
  },
};

export const MODE_GROUPS: { label: ModeGroup; modes: Mode[] }[] = [
  { label: 'Explore', modes: ['dig', 'blast', 'truesize', 'flight'] },
  { label: 'Data', modes: ['compare', 'timeline', 'population', 'climatetwin', 'visa'] },
  { label: 'Sky', modes: ['daynight', 'wonders', 'space'] },
];

export const MODE_LIST: ModeMeta[] = Object.values(MODE_META);
