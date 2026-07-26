import { motion } from 'framer-motion';

interface ProgressBarProps {
  timeLeft: number;
  maxTime?: number;
}

export default function ProgressBar({ timeLeft, maxTime = 60 }: ProgressBarProps) {
  const percentage = Math.max(0, Math.min(100, (timeLeft / maxTime) * 100));
  const isDanger = timeLeft <= 10;

  return (
    <div className="fixed top-0 left-0 w-full z-50">
      {/* Progress bar */}
      <div className="h-1.5 bg-slate-900/50">
        <motion.div
          className={`h-full ${isDanger ? 'bg-red-500' : 'bg-cyan-400'}`}
          initial={{ width: '100%' }}
          animate={{
            width: `${percentage}%`,
            boxShadow: isDanger ? '0 0 15px rgba(239, 68, 68, 0.8)' : '0 0 10px rgba(34, 211, 238, 0.5)',
          }}
          transition={{ duration: 1, ease: 'linear' }}
        />
      </div>
      {isDanger && (
        <motion.div
          className="absolute top-0 left-0 h-1.5 w-full bg-red-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.3, 0] }}
          transition={{ duration: 1, repeat: Infinity }}
          style={{ width: `${percentage}%` }}
        />
      )}
    </div>
  );
}
