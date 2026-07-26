import { motion } from 'framer-motion';

interface BackgroundProps {
  phase: string;
  winner?: string | null;
}

export default function Background({ phase, winner }: BackgroundProps) {
  // Determine background color based on phase and winner
  let bgColor = 'bg-surface-900'; // Default dark
  let particleColor = 'bg-accent-500/10';

  if (phase === 'night') {
    bgColor = 'bg-slate-950';
    particleColor = 'bg-red-500/10';
  } else if (phase === 'day') {
    bgColor = 'bg-slate-900';
    particleColor = 'bg-slate-500/10';
  } else if (phase === 'game_over') {
    if (winner === 'village') {
      bgColor = 'bg-emerald-950';
      particleColor = 'bg-emerald-500/20';
    } else if (winner === 'mafia') {
      bgColor = 'bg-red-950';
      particleColor = 'bg-red-500/20';
    }
  }

  // Generate some static random positions for particles so they don't jump around on re-render
  // We'll just hardcode a few particle definitions for simplicity
  const particles = Array.from({ length: 15 }).map((_, i) => ({
    id: i,
    size: Math.random() * 100 + 50,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 5,
  }));

  return (
    <motion.div 
      className={`fixed inset-0 z-[-1] transition-colors duration-1000 ${bgColor}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className={`absolute rounded-full blur-3xl ${particleColor}`}
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            /* Add translateZ to force hardware acceleration */
            transform: 'translateZ(0)',
          }}
          /* Removed expensive x/y animations that kill mobile performance */
          animate={{
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut',
            delay: p.delay,
          }}
        />
      ))}
    </motion.div>
  );
}
