import { motion } from 'framer-motion';
import { Plus, Minus, LocateFixed, Loader2 } from 'lucide-react';
import type { RefObject } from 'react';
import type { GlobeHandle } from './Globe';

interface ZoomControlsProps {
  globe: RefObject<GlobeHandle | null>;
  onLocate: () => void;
  locating: boolean;
}

export default function ZoomControls({ globe, onLocate, locating }: Readonly<ZoomControlsProps>) {
  return (
    <motion.div
      className="zoom-cluster glass-pill"
      initial={{ opacity: 0, x: -20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ delay: 0.25, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.button
        className="zoom-btn"
        aria-label="Zoom in"
        title="Zoom in"
        onClick={() => globe.current?.zoomIn()}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.88 }}
      >
        <Plus size={17} strokeWidth={2.2} />
      </motion.button>
      <span className="zoom-div" />
      <motion.button
        className="zoom-btn"
        aria-label="Zoom out"
        title="Zoom out"
        onClick={() => globe.current?.zoomOut()}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.88 }}
      >
        <Minus size={17} strokeWidth={2.2} />
      </motion.button>
      <span className="zoom-div" />
      <motion.button
        className="zoom-btn zoom-locate"
        aria-label="Fly to my location"
        title="My location"
        onClick={onLocate}
        disabled={locating}
        whileHover={{ scale: locating ? 1 : 1.08 }}
        whileTap={{ scale: locating ? 1 : 0.88 }}
      >
        {locating ? (
          <Loader2 size={16} strokeWidth={2.2} className="spin" />
        ) : (
          <LocateFixed size={16} strokeWidth={2.2} />
        )}
      </motion.button>
    </motion.div>
  );
}
