import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, Bookmark, User, LogOut, Crown, BookOpen, ChevronDown, Gavel, FileWarning, Car, ScrollText, LucideIcon, Home, HelpCircle, Play, Gift, Package, Shield, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import { GlobalSearch } from "@/components/GlobalSearch";
import { NotificationBell } from "@/components/NotificationBell";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  { path: "/closed-territories", label: "Закрытые территории", short: "ЗТ", icon: Shield },
];

const referenceItems: { path: string; label: string; icon: LucideIcon }[] = [
  { path: "/media", label: "Медиа", icon: Play },
  { path: "/image-host", label: "Хостинг фото", icon: ImageIcon },
  { path: "/redux", label: "Redux", icon: Package },
];

function MobileMenuGroup({ 
  title, icon: Icon, items, location, onClose 
}: { 
  title: string; icon: LucideIcon; 
  items: { path: string; label: string; icon?: LucideIcon; short?: string }[]; 
  location: ReturnType<typeof useLocation>; onClose: () => void;
}) {
  const [isOpen, setIsOpen] = useState(items.some(item => location.pathname.startsWith(item.path)));

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full px-4 py-3 text-sm font-medium rounded-xl transition-all flex items-center justify-between text-muted-foreground hover:text-foreground hover:bg-secondary/80">
          <span className="flex items-center gap-3">
            <Icon className="h-4 w-4" />
            {title}
          </span>
          <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-6 space-y-0.5 mt-0.5">
        {items.map((item) => {
          const ItemIcon = item.icon;
          return (
            <Link key={item.path} to={item.path} onClick={onClose}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                location.pathname.startsWith(item.path)
                  ? "bg-accent/10 text-accent"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              }`}
            >
              {ItemIcon && <ItemIcon className="h-3.5 w-3.5" />}
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
  const [scrolled, setScrolled] = useState(false);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try { await signOut(); navigate('/'); } 
    catch (e) { console.error(e); } 
    finally { setIsLoggingOut(false); }
  };

  useEffect(() => { document.documentElement.classList.add("dark"); }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinkClass = (active: boolean) => 
    `px-3 py-1.5 text-[13px] font-medium rounded-lg transition-all duration-300 ${
      active ? "text-accent" : "text-muted-foreground hover:text-foreground"
    }`;

  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-500 ${
      scrolled 
        ? 'bg-background/80 backdrop-blur-2xl border-b border-border/30 shadow-sm shadow-background/20' 
        : 'bg-transparent'
    }`}>
      <div className="container flex h-14 items-center justify-between gap-4">
        <Logo size="sm" showText={true} />

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-0.5">
          <Link to="/" className={navLinkClass(location.pathname === "/")}>Главная</Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={`flex items-center gap-1 ${navLinkClass(
                codeItems.some(i => location.pathname.startsWith(i.path))
              )}`}>
                <BookOpen className="h-3.5 w-3.5" />
                Кодексы
                <ChevronDown className="h-3 w-3 opacity-50" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-card/95 backdrop-blur-2xl border-border/40 min-w-[200px]">
              {codeItems.map((item) => (
                <DropdownMenuItem key={item.path} asChild>
                  <Link to={item.path} className={`cursor-pointer flex items-center gap-3 py-2 ${
                    location.pathname.startsWith(item.path) ? "text-accent" : ""
                  }`}>
                    <item.icon className="h-3.5 w-3.5" />
                    <span className="font-semibold text-sm">{item.short}</span>
                    <span className="text-muted-foreground text-xs ml-auto">{item.label}</span>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {referenceItems.map((item) => (
            <Link key={item.path} to={item.path}
              className={`flex items-center gap-1.5 ${navLinkClass(location.pathname === item.path)}`}>
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </Link>
          ))}

          <Link to="/giveaways" className={`flex items-center gap-1.5 ${navLinkClass(location.pathname === "/giveaways")}`}>
            <Gift className="h-3.5 w-3.5" />
            Розыгрыши
          </Link>

          <Link to="/favorites" className={navLinkClass(location.pathname === "/favorites")}>
            <Bookmark className="h-3.5 w-3.5" />
          </Link>

          {isAdmin && (
            <Link to="/admin" className={navLinkClass(location.pathname.startsWith("/admin"))}>
              <Shield className="h-3.5 w-3.5" />
            </Link>
          )}
        </nav>

        {/* Search (tablet) */}
        <div className="hidden md:block lg:hidden flex-1 max-w-xs">
          <GlobalSearch />
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1.5">
          <div className="hidden lg:block">
            <GlobalSearch />
          </div>
          
          {user && <NotificationBell />}
          
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm" className="gap-1.5 rounded-lg hidden sm:flex h-8 text-xs">
                <Link to="/profile">
                  {isAdmin && <Crown className="h-3.5 w-3.5 text-accent" />}
                  <span className={isAdmin ? "text-accent font-medium" : "text-muted-foreground"}>
                    {profile?.username || 'Профиль'}
                  </span>
                </Link>
              </Button>
              <Button variant="ghost" size="icon" onClick={handleSignOut} disabled={isLoggingOut}
                className="rounded-lg hover:bg-destructive/10 hover:text-destructive h-8 w-8">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button asChild variant="ghost" size="icon" className="rounded-lg h-8 w-8">
              <Link to="/auth" state={{ from: location.pathname }}>
                <User className="h-4 w-4" />
              </Link>
            </Button>
          )}

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" className="rounded-lg h-8 w-8">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 overflow-y-auto bg-card/95 backdrop-blur-2xl border-l-border/30">
              <div className="mt-3 mb-5">
                <GlobalSearch onResultClick={() => setIsOpen(false)} />
              </div>
              <nav className="flex flex-col gap-1">
                <Link to="/" onClick={() => setIsOpen(false)}
                  className={`px-4 py-2.5 text-sm font-medium rounded-xl flex items-center gap-3 ${
                    location.pathname === "/" ? "text-accent" : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                  }`}>
                  <Home className="h-4 w-4" />
                  Главная
                </Link>

                <MobileMenuGroup title="Кодексы" icon={BookOpen} items={codeItems} location={location} onClose={() => setIsOpen(false)} />
                <MobileMenuGroup title="Справка" icon={HelpCircle} items={referenceItems} location={location} onClose={() => setIsOpen(false)} />

                <Link to="/giveaways" onClick={() => setIsOpen(false)}
                  className={`px-4 py-2.5 text-sm font-medium rounded-xl flex items-center gap-3 ${
                    location.pathname === "/giveaways" ? "text-accent" : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                  }`}>
                  <Gift className="h-4 w-4" />
                  Розыгрыши
                </Link>

                <Link to="/favorites" onClick={() => setIsOpen(false)}
                  className={`px-4 py-2.5 text-sm font-medium rounded-xl flex items-center gap-3 ${
                    location.pathname === "/favorites" ? "text-accent" : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                  }`}>
                  <Bookmark className="h-4 w-4" />
                  Избранное
                </Link>

                {user && (
                  <Link to="/profile" onClick={() => setIsOpen(false)}
                    className={`px-4 py-2.5 text-sm font-medium rounded-xl flex items-center gap-3 ${
                      location.pathname === "/profile" ? "text-accent" : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                    }`}>
                    <User className="h-4 w-4" />
                    {profile?.username || 'Профиль'}
                    {isAdmin && <Crown className="h-3.5 w-3.5 text-accent ml-auto" />}
                  </Link>
                )}

                {isAdmin && (
                  <Link to="/admin" onClick={() => setIsOpen(false)}
                    className={`px-4 py-2.5 text-sm font-medium rounded-xl flex items-center gap-3 ${
                      location.pathname.startsWith("/admin") ? "text-accent" : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                    }`}>
                    <Shield className="h-4 w-4" />
                    Админ-панель
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
