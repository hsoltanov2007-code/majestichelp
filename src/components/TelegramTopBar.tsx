import { useLocation } from "react-router-dom";
import { useTelegramApp } from "@/hooks/useTelegramApp";
import { useAuth } from "@/hooks/useAuth";
import { NotificationBell } from "@/components/NotificationBell";
import { Logo } from "@/components/Logo";

const routeTitles: Record<string, string> = {
  "/": "Hardy Help",
  "/laws": "Законы",
  "/criminal-code": "Уголовный кодекс",
  "/administrative-code": "Административный кодекс",
  "/traffic-code": "Дорожный кодекс",
  "/procedural-code": "Процессуальный кодекс",
  "/government-rules": "Правила гос. органов",
  "/giveaways": "Розыгрыши",
  "/news": "Новости",
  "/forum": "Форум",
  "/profile": "Профиль",
  "/favorites": "Избранное",
  "/media": "Медиа",
  "/redux": "Redux",
  "/faq": "FAQ",
  "/glossary": "Глоссарий",
};

function getTitle(pathname: string): string {
  if (routeTitles[pathname]) return routeTitles[pathname];
  // Check prefix matches
  for (const [path, title] of Object.entries(routeTitles)) {
    if (pathname.startsWith(path) && path !== "/") return title;
  }
  return "Hardy Help";
}

export function TelegramTopBar() {
  const { isTelegram, user: tgUser } = useTelegramApp();
  const { user } = useAuth();
  const location = useLocation();

  if (!isTelegram) return null;

  const title = getTitle(location.pathname);
  const isHome = location.pathname === "/";

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-xl border-b border-border/50" />
      <div className="relative flex items-center justify-between px-4 h-14">
        {/* Left: Logo or title */}
        <div className="flex items-center gap-2">
          {isHome ? (
            <Logo size="sm" showText={true} />
          ) : (
            <span className="text-base font-semibold text-foreground">{title}</span>
          )}
        </div>

        {/* Right: notifications */}
        <div className="flex items-center gap-2">
          {user && <NotificationBell />}
          {tgUser && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="text-accent font-medium">
                {tgUser.first_name}
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
