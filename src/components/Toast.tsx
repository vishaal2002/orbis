import { AnimatePresence, motion } from 'framer-motion';

interface ToastProps {
  message: string | null;
}

export default function Toast({ message }: Readonly<ToastProps>) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          className="toast glass-pill"
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
