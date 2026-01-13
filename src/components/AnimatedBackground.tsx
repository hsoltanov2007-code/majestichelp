import { useEffect, useState } from 'react';

interface GradientOrb {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  duration: number;
  delay: number;
}

const AnimatedBackground = () => {
  const [orbs, setOrbs] = useState<GradientOrb[]>([]);

  useEffect(() => {
    const colors = [
      'hsl(351 80% 52% / 0.15)', // accent red
      'hsl(213 55% 30% / 0.12)', // navy blue
      'hsl(270 60% 50% / 0.1)',  // purple
      'hsl(45 93% 50% / 0.08)',  // gold
    ];

    const generatedOrbs: GradientOrb[] = [];
    for (let i = 0; i < 6; i++) {
      generatedOrbs.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 300 + Math.random() * 400,
        color: colors[i % colors.length],
        duration: 20 + Math.random() * 15,
        delay: Math.random() * -20,
      });
    }
    setOrbs(generatedOrbs);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/20" />
      
      {/* Animated orbs */}
      {orbs.map((orb) => (
        <div
          key={orb.id}
          className="absolute rounded-full blur-3xl animate-float-orb"
          style={{
            left: `${orb.x}%`,
            top: `${orb.y}%`,
            width: `${orb.size}px`,
            height: `${orb.size}px`,
            background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
            animationDuration: `${orb.duration}s`,
            animationDelay: `${orb.delay}s`,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}

      {/* Mesh gradient overlay */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: `
            radial-gradient(ellipse at 20% 30%, hsl(351 80% 52% / 0.1) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 70%, hsl(213 55% 30% / 0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, hsl(270 60% 50% / 0.05) 0%, transparent 60%)
          `,
        }}
      />

      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Noise texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
};

export default AnimatedBackground;
