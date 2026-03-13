import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import hardyLogo from "@/assets/hardy-logo.png";

const links = [
  { label: "УК", path: "/criminal-code" },
  { label: "АК", path: "/administrative-code" },
  { label: "ДК", path: "/traffic-code" },
  { label: "Процедуры", path: "/procedures" },
  { label: "FAQ", path: "/faq" },
  { label: "Глоссарий", path: "/glossary" },
  { label: "Медиа", path: "/media" },
];

export function Footer() {
  return (
    <footer className="relative mt-24 border-t border-border/20">
      <div className="container py-10">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <Link to="/" className="flex items-center gap-2.5">
              <img src={hardyLogo} alt="HARDY" className="w-7 h-7 object-contain opacity-80" />
              <span className="text-sm font-semibold tracking-wider">
                HARDY <span className="text-accent">Portal</span>
              </span>
            </Link>
            <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
              Информация о законах и процедурах для Majestic RP · Denver
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {links.map((link) => (
              <Link key={link.path} to={link.path}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                {link.label}
              </Link>
            ))}
          </div>

          {/* Social */}
          <div className="flex gap-4">
            <a href="https://discord.gg/58mtY7SqZt" target="_blank" rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-accent transition-colors inline-flex items-center gap-1">
              Discord <ExternalLink className="h-2.5 w-2.5" />
            </a>
            <a href="https://t.me/Hardyfamq" target="_blank" rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-accent transition-colors inline-flex items-center gap-1">
              Telegram <ExternalLink className="h-2.5 w-2.5" />
            </a>
          </div>
        </div>

        <div className="section-divider mt-8 mb-6" />
        
        <p className="text-[11px] text-muted-foreground/60 text-center">
          © {new Date().getFullYear()} HARDY Portal
        </p>
      </div>
    </footer>
  );
}
