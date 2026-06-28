import { useEffect } from 'react';
import { motion, type Variants } from 'framer-motion';
import { X, Star } from 'lucide-react';
import type { Mode } from '../types';
import { MODE_GROUPS, MODE_META } from '../modes';
import ModePreview from './ModePreview';

interface ModeGalleryProps {
  mode: Mode;
  onSelect: (m: Mode) => void;
  onClose: () => void;
}

const EASE = [0.16, 1, 0.3, 1] as const;
const grid: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
};
const card: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
};

export default function ModeGallery({ mode, onSelect, onClose }: Readonly<ModeGalleryProps>) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <motion.div
      className="gallery"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: EASE }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Choose a mode"
    >
      <motion.div
        className="gallery-panel glass"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: 0.5, ease: EASE }}
        onClick={e => e.stopPropagation()}
      >
        <header className="gallery-head">
          <div>
            <h2 className="gallery-title">Choose your <em>lens</em></h2>
            <p className="gallery-sub">Twelve ways to explore Earth — pick one to begin.</p>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close" type="button">
            <X size={18} strokeWidth={2} />
          </button>
        </header>

        <div className="gallery-scroll">
          {MODE_GROUPS.map(group => (
            <section key={group.label} className="gallery-group">
              <p className="gallery-group-label">{group.label}</p>
              <motion.div className="gallery-grid" variants={grid} initial="hidden" animate="show">
                {group.modes.map(id => {
                  const m = MODE_META[id];
                  const Icon = m.icon;
                  const active = mode === id;
                  return (
                    <motion.button
                      key={id}
                      type="button"
                      variants={card}
                      className={`gallery-card${active ? ' active' : ''}`}
                      onClick={() => onSelect(id)}
                      aria-label={`${m.label} — ${m.blurb}`}
                    >
                      {m.recommended && (
                        <span className="gallery-badge">
                          <Star size={9} strokeWidth={0} fill="currentColor" /> Popular
                        </span>
                      )}
                      <ModePreview mode={id} />
                      <div className="gallery-card-body">
                        <div className="gallery-card-head">
                          <Icon size={16} strokeWidth={2} />
                          <span className="gallery-card-name">{m.label}</span>
                        </div>
                        <p className="gallery-card-blurb">{m.blurb}</p>
                        <p className="gallery-card-eg">Try: {m.example}</p>
                      </div>
                    </motion.button>
                  );
                })}
              </motion.div>
            </section>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
