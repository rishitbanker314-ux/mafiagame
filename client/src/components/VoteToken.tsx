import { motion } from 'framer-motion';

interface VoteTokenProps {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  onComplete: (id: string) => void;
}

export default function VoteToken({ id, startX, startY, endX, endY, onComplete }: VoteTokenProps) {
  return (
    <motion.div
      initial={{ x: startX, y: startY, scale: 0, opacity: 0 }}
      animate={{ x: endX, y: endY, scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ duration: 0.4, ease: "backOut" }}
      onAnimationComplete={() => onComplete(id)}
      className="fixed z-[100] w-4 h-4 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(192,132,252,0.8)] pointer-events-none"
      style={{ top: 0, left: 0 }}
    />
  );
}
