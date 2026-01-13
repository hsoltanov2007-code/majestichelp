import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, Bookmark, MessageSquare, User, LogOut, Crown, Brain, Scale, BookOpen, Wrench, ChevronDown, Gavel, FileWarning, Car, ScrollText, Building2, LucideIcon, Home, HelpCircle, FileText, Play, Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import { GlobalSearch } from "@/components/GlobalSearch";
import { NotificationBell } from "@/components/NotificationBell";
import { NewsNotificationBell } from "@/components/NewsNotificationBell";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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

const referenceItems: { path: string; label: string; tooltip: string; icon: LucideIcon }[] = [
  { path: "/news", label: "Новости", tooltip: "Новости сервера", icon: Newspaper },
  { path: "/media", label: "Медиа", tooltip: "Видео контент", icon: Play },
];

function MobileMenuGroup({ 
  title, 
  icon: Icon, 
  items, 
  location, 
  onClose 
}: { 
  title: string; 
  icon: LucideIcon; 
  items: { path: string; label: string; icon?: LucideIcon; short?: string }[]; 
  location: ReturnType<typeof useLocation>; 
  onClose: () => void;
}) {
  const [isOpen, setIsOpen] = useState(
    items.some(item => location.pathname.startsWith(item.path))
  );

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full px-4 py-3 text-base font-medium rounded-xl transition-all flex items-center justify-between text-muted-foreground hover:text-foreground hover:bg-muted/80">
          <span className="flex items-center gap-3">
            <Icon className="h-5 w-5" />
            {title}
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-6 space-y-1 animate-accordion-down">
        {items.map((item) => {
          const ItemIcon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                location.pathname.startsWith(item.path)
                  ? "bg-accent/10 text-accent"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              {ItemIcon && <ItemIcon className="h-4 w-4" />}
              {item.short || item.label}
            </Link>
          );
        })}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, isAdmin, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // Always use dark theme
    document.documentElement.classList.add("dark");
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${
      scrolled 
        ? 'glass-strong shadow-lg shadow-background/5' 
        : 'bg-transparent border-b border-transparent'
    }`}>
      <div className="container flex h-16 items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-4">
          <Logo size="sm" showText={true} />
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          <Link
            to="/"
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              location.pathname === "/"
                ? "bg-accent text-accent-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
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
                className={`gap-1.5 rounded-lg ${
                  codeItems.some(item => location.pathname.startsWith(item.path))
                    ? "bg-accent/10 text-accent"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <BookOpen className="h-4 w-4" />
                Кодексы
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="glass-strong min-w-[220px]">
              {codeItems.map((item) => (
                <DropdownMenuItem key={item.path} asChild>
                  <Link 
                    to={item.path} 
                    className={`w-full cursor-pointer flex items-center gap-3 py-2.5 ${
                      location.pathname.startsWith(item.path)
                        ? "bg-accent/10 text-accent"
                        : ""
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="font-semibold">{item.short}</span>
                    <span className="text-muted-foreground text-xs ml-auto">{item.label}</span>
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
                className={`gap-1.5 rounded-lg ${
                  toolItems.some(item => location.pathname.startsWith(item.path))
                    ? "bg-accent/10 text-accent"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Wrench className="h-4 w-4" />
                Инструменты
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="glass-strong">
              {toolItems.map((item) => (
                <DropdownMenuItem key={item.path} asChild>
                  <Link 
                    to={item.path} 
                    className={`w-full cursor-pointer flex items-center gap-3 py-2.5 ${
                      location.pathname.startsWith(item.path)
                        ? "bg-accent/10 text-accent"
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
          <TooltipProvider delayDuration={300}>
            {referenceItems.map((item) => (
              <Tooltip key={item.path}>
                <TooltipTrigger asChild>
                  <Link
                    to={item.path}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
                      location.pathname === item.path
                        ? "bg-accent text-accent-foreground shadow-md"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </TooltipTrigger>
                <TooltipContent className="glass-strong">
                  <p>{item.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>

          {/* Форум и Избранное */}
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to="/forum"
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
                    location.pathname.startsWith("/forum")
                      ? "bg-accent text-accent-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  }`}
                >
                  <MessageSquare className="h-4 w-4" />
                  Форум
                </Link>
              </TooltipTrigger>
              <TooltipContent className="glass-strong">
                <p>Обсуждение с сообществом</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to="/favorites"
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
                    location.pathname === "/favorites"
                      ? "bg-accent text-accent-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  }`}
                >
                  <Bookmark className="h-4 w-4" />
                </Link>
              </TooltipTrigger>
              <TooltipContent className="glass-strong">
                <p>Сохранённые статьи</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </nav>

        {/* Search (tablet) */}
        <div className="hidden md:block lg:hidden flex-1 max-w-xs">
          <GlobalSearch />
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Search (desktop) */}
          <div className="hidden lg:block">
            <GlobalSearch />
          </div>

          <NewsNotificationBell />
          {user && <NotificationBell />}
          
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm" className="gap-2 rounded-lg hover:bg-muted/80 hidden sm:flex" title="Мой профиль">
                <Link to="/profile">
                  {isAdmin && <Crown className="h-4 w-4 text-accent" />}
                  <span className={isAdmin ? "text-accent font-semibold" : ""}>
                    {profile?.username || 'Профиль'}
                  </span>
                </Link>
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleSignOut} 
                disabled={isLoggingOut}
                title="Выйти" 
                className="rounded-lg hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <Button asChild variant="ghost" size="icon" title="Войти" className="rounded-lg hover:bg-muted/80">
              <Link to="/auth" state={{ from: location.pathname }}>
                <User className="h-5 w-5" />
              </Link>
            </Button>
          )}

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" className="rounded-lg">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 overflow-y-auto glass-strong border-l-border/50">
              <div className="mt-4 mb-6">
                <GlobalSearch onResultClick={() => setIsOpen(false)} />
              </div>
              <nav className="flex flex-col gap-2">
                {/* Главная */}
                <Link
                  to="/"
                  onClick={() => setIsOpen(false)}
                  className={`px-4 py-3 text-base font-medium rounded-xl transition-all flex items-center gap-3 ${
                    location.pathname === "/"
                      ? "bg-accent text-accent-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  }`}
                >
                  <Home className="h-5 w-5" />
                  Главная
                </Link>

                {/* Кодексы */}
                <MobileMenuGroup 
                  title="Кодексы" 
                  icon={BookOpen}
                  items={codeItems}
                  location={location}
                  onClose={() => setIsOpen(false)}
                />

                {/* Инструменты */}
                <MobileMenuGroup 
                  title="Инструменты" 
                  icon={Wrench}
                  items={toolItems}
                  location={location}
                  onClose={() => setIsOpen(false)}
                />

                {/* Справка */}
                <MobileMenuGroup 
                  title="Справка" 
                  icon={HelpCircle}
                  items={referenceItems}
                  location={location}
                  onClose={() => setIsOpen(false)}
                />

                {/* Форум */}
                <Link
                  to="/forum"
                  onClick={() => setIsOpen(false)}
                  className={`px-4 py-3 text-base font-medium rounded-xl transition-all flex items-center gap-3 ${
                    location.pathname.startsWith("/forum")
                      ? "bg-accent text-accent-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  }`}
                >
                  <MessageSquare className="h-5 w-5" />
                  Форум
                </Link>

                {/* Избранное */}
                <Link
                  to="/favorites"
                  onClick={() => setIsOpen(false)}
                  className={`px-4 py-3 text-base font-medium rounded-xl transition-all flex items-center gap-3 ${
                    location.pathname === "/favorites"
                      ? "bg-accent text-accent-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  }`}
                >
                  <Bookmark className="h-5 w-5" />
                  Избранное
                </Link>

                {/* Profile link for mobile */}
                {user && (
                  <Link
                    to="/profile"
                    onClick={() => setIsOpen(false)}
                    className={`px-4 py-3 text-base font-medium rounded-xl transition-all flex items-center gap-3 ${
                      location.pathname === "/profile"
                        ? "bg-accent text-accent-foreground shadow-md"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                    }`}
                  >
                    <User className="h-5 w-5" />
                    {profile?.username || 'Профиль'}
                    {isAdmin && <Crown className="h-4 w-4 text-accent ml-auto" />}
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
