import { Link, useLocation } from "react-router-dom";
import { Home, BookOpen, Gift, User, MessageSquare, Scale, Newspaper, Grid3X3 } from "lucide-react";
import { useTelegramApp } from "@/hooks/useTelegramApp";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const navItems = [
  {
    path: "/",
    label: "Главная",
    icon: Home,
    exact: true,
  },
  {
    path: "/giveaways",
    label: "Розыгрыши",
    icon: Gift,
    exact: true,
  },
  {
    path: "/news",
    label: "Новости",
    icon: Newspaper,
    exact: true,
  },
  {
    path: "/profile",
    label: "Профиль",
    icon: User,
    exact: true,
  },
];

export function TelegramBottomNav() {
  const { isTelegram } = useTelegramApp();
  const location = useLocation();

  if (!isTelegram) return null;

  const isActive = (item: typeof navItems[0]) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  };

  return (
    <>
      {/* Spacer so content isn't hidden behind nav */}
      <div className="h-20" />

      {/* Bottom nav bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
        {/* Backdrop blur */}
        <div className="absolute inset-0 bg-background/80 backdrop-blur-xl border-t border-border/50" />

        <div className="relative flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const active = isActive(item);
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[56px] relative"
              >
                {/* Active indicator dot */}
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-accent" />
                )}

                {/* Icon container */}
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-8 rounded-xl transition-all duration-200",
                    active
                      ? "bg-accent/15"
                      : "bg-transparent"
                  )}
                >
                  <Icon
                    className={cn(
                      "transition-all duration-200",
                      active
                        ? "text-accent stroke-[2.5] h-5 w-5"
                        : "text-muted-foreground stroke-2 h-5 w-5"
                    )}
                  />
                </div>

                <span
                  className={cn(
                    "text-[10px] font-medium transition-all duration-200 leading-none",
                    active ? "text-accent" : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
