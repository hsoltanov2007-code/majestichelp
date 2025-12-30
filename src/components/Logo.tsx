import { Link } from "react-router-dom";
import hardyLogo from "@/assets/hardy-logo.png";

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

  return (
    <Link to="/" className="flex items-center gap-3 group">
      <div className={`${sizeClasses[size]} relative`}>
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-xl bg-accent/30 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Logo image */}
        <img 
          src={hardyLogo} 
          alt="HARDY" 
          className={`${sizeClasses[size]} relative object-contain transition-transform duration-300 group-hover:scale-110`}
        />
      </div>
      
      {showText && (
        <div className="flex flex-col">
          <span className={`${textSizes[size]} font-bold leading-tight tracking-wider`}>
            <span className="text-foreground">HARDY</span>
          </span>
          <span className="text-xs text-accent font-medium tracking-wider uppercase">
            Majestic RP
          </span>
        </div>
      )}
    </Link>
  );
}
