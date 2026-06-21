import { motion } from 'framer-motion';
import Logo from './Logo';

export default function Header() {
  return (
    <motion.header
      className="app-header glass-pill"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ delay: 0.08, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
    >
      <span className="header-mark">
        <Logo size={17} />
      </span>
      <div style={{ lineHeight: 1.15 }}>
        <p className="t-mode">Orbis</p>
        <p className="t-body header-tagline" style={{ fontSize: '11px', marginTop: '1px' }}>
          Interactive Earth
        </p>
      </div>
    </motion.header>
  );
}
