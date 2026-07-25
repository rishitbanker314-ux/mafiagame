import { useEffect, useRef } from 'react';

interface EliminationCanvasProps {
  onComplete: () => void;
}

export default function EliminationCanvas({ onComplete }: EliminationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const particles: any[] = [];
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Spawn shatter particles (Glass shards)
    for (let i = 0; i < 25; i++) {
      particles.push({
        type: 'shard',
        x: centerX,
        y: centerY,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10 - 2,
        size: Math.random() * 6 + 2,
        angle: Math.random() * Math.PI * 2,
        angularVelocity: (Math.random() - 0.5) * 0.5,
        color: `hsl(${Math.random() * 40 + 260}, 80%, ${Math.random() * 40 + 40}%)`, // purples
        life: 1.0,
        decay: Math.random() * 0.02 + 0.015,
      });
    }

    // Spawn smoke particles
    for (let i = 0; i < 25; i++) {
      particles.push({
        type: 'smoke',
        x: centerX + (Math.random() - 0.5) * 20,
        y: centerY + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 2,
        vy: -Math.random() * 3 - 1,
        size: Math.random() * 15 + 10,
        color: `rgba(40, 40, 40, 1)`,
        life: 1.0,
        decay: Math.random() * 0.02 + 0.01,
      });
    }

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let activeParticles = 0;

      for (const p of particles) {
        if (p.life <= 0) continue;
        activeParticles++;

        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;

        if (p.type === 'shard') {
          p.vy += 0.2; // gravity
          p.angle += p.angularVelocity;

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.angle);
          ctx.globalAlpha = Math.max(0, p.life);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.moveTo(-p.size, -p.size);
          ctx.lineTo(p.size, -p.size * 0.5);
          ctx.lineTo(p.size * 0.5, p.size);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        } else if (p.type === 'smoke') {
          p.size += 0.5; // expand
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.life * 0.5);
          
          const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
          gradient.addColorStop(0, p.color);
          gradient.addColorStop(1, 'rgba(100, 50, 150, 0)');
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      if (activeParticles > 0) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    const timeout = setTimeout(() => {
      onComplete();
    }, 1500);

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearTimeout(timeout);
    };
  }, [onComplete]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-50"
    />
  );
}
