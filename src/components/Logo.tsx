import { Link } from "react-router-dom";
import hardyLogo from "@/assets/hardy-logo.png";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function Logo({ size = "md", showText = true }: LogoProps) {
  const sizeClasses = { sm: "w-7 h-7", md: "w-9 h-9", lg: "w-12 h-12" };
  const textSizes = { sm: "text-base", md: "text-lg", lg: "text-xl" };

  return (
    <Link to="/" className="flex items-center gap-2.5 group">
      <img 
        src={hardyLogo} 
        alt="HARDY" 
        className={`${sizeClasses[size]} object-contain transition-all duration-500 group-hover:opacity-80`}
      />
      {showText && (
        <div className="flex items-baseline gap-1.5">
          <span className={`${textSizes[size]} font-bold tracking-wider text-foreground`}>
            HARDY
          </span>
          <span className="text-[10px] text-accent font-medium tracking-widest uppercase">
            MRP
          </span>
        </div>
      )}
    </Link>
  );
}
