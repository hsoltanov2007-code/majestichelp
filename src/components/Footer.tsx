import { Link } from "react-router-dom";
import { Scale, FileText, Car, Users, BookOpen, Shield, MessageSquare, Play, HelpCircle, Heart, ExternalLink } from "lucide-react";
import hardyLogo from "@/assets/hardy-logo.png";

const navigationLinks = [
  { label: "Уголовный кодекс", path: "/criminal-code" },
  { label: "Административный кодекс", path: "/administrative-code" },
  { label: "Дорожный кодекс", path: "/traffic-code" },
  { label: "Процедуры", path: "/procedures" },
  { label: "Правила ГО", path: "/government-rules" },
];

const toolLinks = [
  { label: "Калькулятор", path: "/calculator" },
  { label: "Тест знаний", path: "/quiz" },
  { label: "Сценарии", path: "/scenarios" },
  { label: "Глоссарий", path: "/glossary" },
  { label: "FAQ", path: "/faq" },
];

const communityLinks = [
  { label: "Форум", path: "/forum" },
  { label: "Медиа", path: "/media" },
  { label: "Инструкции", path: "/instructions" },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative mt-20 border-t border-border/50 bg-card/50 backdrop-blur-sm">
      {/* Gradient accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
      
      <div className="container py-12 md:py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand section */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-3 group">
              <img src={hardyLogo} alt="HARDY" className="w-10 h-10 object-contain" />
              <span className="text-xl font-bold tracking-wider">
                <span className="text-foreground">HARDY</span>
                <span className="text-accent"> Portal</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Ваш надёжный источник информации о законах, правилах и процедурах для Majestic RP.
            </p>
          </div>

          {/* Navigation links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Scale className="h-4 w-4 text-accent" />
              Кодексы
            </h3>
            <ul className="space-y-2.5">
              {navigationLinks.map((link) => (
                <li key={link.path}>
                  <Link 
                    to={link.path}
                    className="text-sm text-muted-foreground hover:text-accent transition-colors animated-underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Tools links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-accent" />
              Инструменты
            </h3>
            <ul className="space-y-2.5">
              {toolLinks.map((link) => (
                <li key={link.path}>
                  <Link 
                    to={link.path}
                    className="text-sm text-muted-foreground hover:text-accent transition-colors animated-underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Community links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Users className="h-4 w-4 text-accent" />
              Сообщество
            </h3>
            <ul className="space-y-2.5">
              {communityLinks.map((link) => (
                <li key={link.path}>
                  <Link 
                    to={link.path}
                    className="text-sm text-muted-foreground hover:text-accent transition-colors animated-underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-border/50">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {currentYear} HARDY Portal. Все права защищены.
            </p>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              Сделано с <Heart className="h-3.5 w-3.5 text-accent fill-accent" /> для Majestic RP
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
