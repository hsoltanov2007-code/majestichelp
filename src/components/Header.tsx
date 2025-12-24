import { Link, useLocation } from "react-router-dom";
import { Menu, Moon, Sun, Bookmark, MessageSquare, User, LogOut, Crown, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import { GlobalSearch } from "@/components/GlobalSearch";
import { NotificationBell } from "@/components/NotificationBell";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { path: "/", label: "Главная" },
  { path: "/criminal-code", label: "УК" },
  { path: "/administrative-code", label: "АК" },
  { path: "/traffic-code", label: "ДК" },
  { path: "/procedural-code", label: "ПК" },
  { path: "/government-rules", label: "ПГО" },
  { path: "/calculator", label: "Калькулятор" },
  { path: "/quiz", label: "Тест", icon: Brain },
  { path: "/scenarios", label: "Сценарии" },
  { path: "/glossary", label: "Глоссарий" },
  { path: "/faq", label: "FAQ" },
  { path: "/forum", label: "Форум", icon: MessageSquare },
  { path: "/favorites", label: "Избранное", icon: Bookmark },
];

export function Header() {
  const location = useLocation();
  const { user, profile, isAdmin, signOut } = useAuth();
  const [isDark, setIsDark] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const dark = localStorage.getItem("theme") === "dark";
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    localStorage.setItem("theme", newDark ? "dark" : "light");
    document.documentElement.classList.toggle("dark", newDark);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="hidden lg:block">
          <GlobalSearch />
        </div>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1 ${
                  location.pathname === item.path || location.pathname.startsWith(item.path + '/')
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {IconComponent && <IconComponent className="h-4 w-4" />}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {user && <NotificationBell />}
          
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm" className="gap-2" title="Мой профиль">
                <Link to="/profile">
                  {isAdmin && <Crown className="h-4 w-4 text-red-500" />}
                  <span className={isAdmin ? "text-red-500" : ""}>
                    {profile?.username || 'Профиль'}
                  </span>
                </Link>
              </Button>
              <Button variant="ghost" size="icon" onClick={signOut} title="Выйти">
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <Button asChild variant="ghost" size="icon" title="Войти">
              <Link to="/auth">
                <User className="h-5 w-5" />
              </Link>
            </Button>
          )}

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <nav className="flex flex-col gap-2 mt-8">
                {navItems.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                      className={`px-4 py-3 text-base font-medium rounded-lg transition-colors flex items-center gap-2 ${
                        location.pathname === item.path || location.pathname.startsWith(item.path + '/')
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      {IconComponent && <IconComponent className="h-4 w-4" />}
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
