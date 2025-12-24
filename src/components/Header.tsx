import { Link, useLocation } from "react-router-dom";
import { Menu, Moon, Sun, Bookmark, MessageSquare, User, LogOut, Crown, Brain, Scale, BookOpen, Wrench, ChevronDown, Gavel, FileWarning, Car, ScrollText, Building2, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import { GlobalSearch } from "@/components/GlobalSearch";
import { NotificationBell } from "@/components/NotificationBell";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const codeItems: { path: string; label: string; short: string; icon: LucideIcon }[] = [
  { path: "/criminal-code", label: "Уголовный кодекс", short: "УК", icon: Gavel },
  { path: "/administrative-code", label: "Административный кодекс", short: "АК", icon: FileWarning },
  { path: "/traffic-code", label: "Дорожный кодекс", short: "ДК", icon: Car },
  { path: "/procedural-code", label: "Процессуальный кодекс", short: "ПК", icon: ScrollText },
  { path: "/government-rules", label: "Правила гос. органов", short: "ПГО", icon: Building2 },
];

const toolItems = [
  { path: "/calculator", label: "Калькулятор", icon: Scale },
  { path: "/quiz", label: "Тест знаний", icon: Brain },
  { path: "/scenarios", label: "Сценарии", icon: BookOpen },
];

const referenceItems = [
  { path: "/glossary", label: "Глоссарий" },
  { path: "/faq", label: "FAQ" },
];

const allMobileItems = [
  { path: "/", label: "Главная" },
  ...codeItems.map(i => ({ path: i.path, label: i.short })),
  ...toolItems.map(i => ({ path: i.path, label: i.label, icon: i.icon })),
  ...referenceItems,
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
          <Link
            to="/"
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              location.pathname === "/"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            Главная
          </Link>

          {/* Кодексы */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className={`gap-1 ${
                  codeItems.some(item => location.pathname.startsWith(item.path))
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <BookOpen className="h-4 w-4" />
                Кодексы
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-popover">
              {codeItems.map((item) => (
                <DropdownMenuItem key={item.path} asChild>
                  <Link 
                    to={item.path} 
                    className={`w-full cursor-pointer flex items-center gap-2 ${
                      location.pathname.startsWith(item.path)
                        ? "bg-primary/10 text-primary"
                        : ""
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="font-medium">{item.short}</span>
                    <span className="text-muted-foreground text-xs">{item.label}</span>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Инструменты */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className={`gap-1 ${
                  toolItems.some(item => location.pathname.startsWith(item.path))
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Wrench className="h-4 w-4" />
                Инструменты
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-popover">
              {toolItems.map((item) => (
                <DropdownMenuItem key={item.path} asChild>
                  <Link 
                    to={item.path} 
                    className={`w-full cursor-pointer flex items-center gap-2 ${
                      location.pathname.startsWith(item.path)
                        ? "bg-primary/10 text-primary"
                        : ""
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Справка */}
          {referenceItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                location.pathname === item.path
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {item.label}
            </Link>
          ))}

          {/* Форум */}
          <Link
            to="/forum"
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1 ${
              location.pathname.startsWith("/forum")
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            Форум
          </Link>

          {/* Избранное */}
          <Link
            to="/favorites"
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1 ${
              location.pathname === "/favorites"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Bookmark className="h-4 w-4" />
          </Link>
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
                {allMobileItems.map((item) => {
                  const IconComponent = (item as any).icon;
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
