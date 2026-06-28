import { Fragment, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence, useSpring, type Variants } from 'framer-motion';
import { ArrowUpRight, Moon, Sun } from 'lucide-react';
import Logo from './Logo';
import { useTheme } from '../theme';

interface LandingProps {
  ready: boolean;
  onStart: () => void;
}

// Rotating personality line — one clear phrase at a time.
const PHRASES = [
  'Dig a tunnel through the planet',
  'Compare the true size of countries',
  'Watch day turn to night, live',
  'See where your passport can take you',
  'Trace flight paths across the globe',
  'Track the ISS in real time',
];

const TITLE_WORDS = ['One', 'planet.', 'Infinite', 'perspectives.'];
const ACCENT_FROM = 2;

const EASE = [0.16, 1, 0.3, 1] as const;

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.16, delayChildren: 0.15 } },
};
const titleGroup: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};
const rise: Variants = {
  hidden: { opacity: 0, y: 18, filter: 'blur(8px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.75, ease: EASE } },
};

export default function Landing({ ready, onStart }: Readonly<LandingProps>) {
  const { theme, toggle } = useTheme();
  const [phrase, setPhrase] = useState(0);
  const handleStart = useCallback(() => onStart(), [onStart]);

  // magnetic CTA
  const mx = useSpring(0, { stiffness: 220, damping: 18, mass: 0.4 });
  const my = useSpring(0, { stiffness: 220, damping: 18, mass: 0.4 });
  const onCtaMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - (r.left + r.width / 2)) * 0.4);
    my.set((e.clientY - (r.top + r.height / 2)) * 0.5);
  };
  const onCtaLeave = () => {
    mx.set(0);
    my.set(0);
  };

  useEffect(() => {
    const id = setInterval(() => setPhrase(p => (p + 1) % PHRASES.length), 3600);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleStart();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleStart]);

  return (
    <motion.div
      className="landing"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 1, ease: EASE } }}
      transition={{ duration: 0.8 }}
      role="dialog"
      aria-label="Welcome to Orbis"
    >
      <div className="landing-atmosphere" aria-hidden="true" />
      <div className="landing-scrim" aria-hidden="true" />
      <div className="landing-rings" aria-hidden="true">
        <span className="landing-ring landing-ring--outer" />
        <span className="landing-ring landing-ring--mid" />
        <span className="landing-ring landing-ring--inner" />
        <span className="landing-orbit landing-orbit--a">
          <span className="landing-orbit-path">
            <span className="landing-orbit-sat" />
          </span>
        </span>
        <span className="landing-orbit landing-orbit--b">
          <span className="landing-orbit-path">
            <span className="landing-orbit-sat" />
          </span>
        </span>
      </div>

      <div className="landing-content">
        <motion.header
          className="landing-top"
          initial={{ opacity: 0, y: -12 }}
          animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: -12 }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <div className="landing-brand">
            <span className="landing-brand-mark">
              <Logo size={20} />
            </span>
            <span className="landing-wordmark">Orbis</span>
          </div>

          <button
            type="button"
            className="landing-theme icon-btn"
            onClick={toggle}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Moon size={17} strokeWidth={2} /> : <Sun size={17} strokeWidth={2} />}
          </button>
        </motion.header>

        {/* Staggered launch reveal — plays only once ready */}
        <motion.div
          className="landing-hero"
          variants={container}
          initial="hidden"
          animate={ready ? 'show' : 'hidden'}
        >
          <motion.h1 className="landing-title" variants={titleGroup} aria-label="One planet. Infinite perspectives.">
            {TITLE_WORDS.map((word, i) => (
              <Fragment key={word}>
                <motion.span
                  className={`landing-title-word${i >= ACCENT_FROM ? ' is-accent' : ''}`}
                  variants={rise}
                >
                  {word}
                </motion.span>
                {i === 1 && <span className="landing-title-break" />}
              </Fragment>
            ))}
          </motion.h1>

          <motion.div className="landing-sub" variants={rise} aria-live="polite">
            <AnimatePresence mode="wait">
              <motion.span
                key={phrase}
                className="landing-sub-text"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.45, ease: EASE }}
              >
                {PHRASES[phrase]}
              </motion.span>
            </AnimatePresence>
          </motion.div>

          <motion.div className="landing-cta-wrap" variants={rise}>
            <motion.button
              type="button"
              className="landing-enter"
              onClick={handleStart}
              onMouseMove={onCtaMove}
              onMouseLeave={onCtaLeave}
              style={{ x: mx, y: my }}
              aria-label="Enter Orbis"
            >
              <span className="landing-enter-label">Enter Orbis</span>
              <span className="landing-enter-arrow">
                <ArrowUpRight size={17} strokeWidth={2.4} aria-hidden="true" />
              </span>
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}
