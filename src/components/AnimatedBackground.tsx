const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Video background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/videos/background.mp4" type="video/mp4" />
      </video>

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-background/80" />

      {/* Subtle gradient overlay */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          background: `
            radial-gradient(ellipse at 20% 30%, hsl(351 80% 52% / 0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 70%, hsl(213 55% 30% / 0.06) 0%, transparent 50%)
          `,
        }}
      />
    </div>
  );
};

export default AnimatedBackground;
