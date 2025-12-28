import { Link } from "react-router-dom";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function Logo({ size = "md", showText = true }: LogoProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  const letterSizes = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-xl",
  };

  return (
    <Link to="/" className="flex items-center gap-3 group">
      <div className={`${sizeClasses[size]} relative`}>
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-xl bg-accent/30 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Logo container */}
        <div className={`${sizeClasses[size]} relative rounded-xl bg-gradient-to-br from-accent via-accent to-accent/80 flex items-center justify-center shadow-lg shadow-accent/25 group-hover:shadow-accent/50 transition-all duration-300 group-hover:scale-105`}>
          {/* Inner gradient overlay */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/20 to-transparent" />
          
          {/* Letter D with animation */}
          <span className={`${letterSizes[size]} text-accent-foreground font-bold relative z-10 transition-transform duration-300 group-hover:scale-110`}>
            D
          </span>
          
          {/* Shine effect */}
          <div className="absolute inset-0 rounded-xl overflow-hidden">
            <div className="absolute -inset-full top-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 opacity-0 group-hover:opacity-100 group-hover:animate-shimmer" />
          </div>
        </div>
      </div>
      
      {showText && (
        <div className="flex flex-col">
          <span className={`${textSizes[size]} font-bold leading-tight`}>
            <span className="text-foreground">Denver</span>
          </span>
          <span className="text-xs text-accent font-medium tracking-wider uppercase">
            Majestic RP
          </span>
        </div>
      )}
    </Link>
  );
}
