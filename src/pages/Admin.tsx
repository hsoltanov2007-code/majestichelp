import { useState, useMemo } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import hardyLogo from "@/assets/hardy-logo.png";
import {
  Users, FileText, Shield, LogOut, Check, X, Trash2, Search,
  BarChart3, ChevronDown, ChevronRight,
  Scale, Eye, RefreshCw, ArrowLeft, Hash,
  Menu, Clock, Loader2, AlertCircle, CheckCircle2,
  Gift, Headphones, Image, Package, Crown, UserCog, Star, Database
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Tab = "dashboard" | "users" | "articles" | "updates";

export default function Admin() {
  const { user, isAdmin, isLoading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("dashboard");
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (authLoading) return null;
  if (!user || !isAdmin) return <Navigate to="/" replace />;

  const tabs = [
    { id: "dashboard" as Tab, label: "Дашборд", icon: BarChart3 },
    { id: "users" as Tab, label: "Пользователи", icon: Users },
    { id: "articles" as Tab, label: "Статьи", icon: FileText },
    { id: "updates" as Tab, label: "Обновления", icon: RefreshCw },
  ];

  const handleTabClick = (id: Tab) => {
    setTab(id);
    if (isMobile) setSidebarOpen(false);
  };

  const sidebarContent = (
    <>
      <button onClick={() => navigate("/")} className="flex items-center gap-2.5 px-5 py-4 border-b border-border/50 group">
        <img src={hardyLogo} alt="" className="w-8 h-8 rounded-lg object-contain" />
        <div>
          <span className="text-sm font-extrabold text-accent">Admin</span>
          <span className="text-sm font-bold text-foreground ml-1">Panel</span>
        </div>
      </button>

      <nav className="flex-1 py-4 space-y-1">
        {tabs.map((item) => (
          <button
            key={item.id}
            onClick={() => handleTabClick(item.id)}
            className={`w-full flex items-center gap-3 mx-3 px-3 py-3 text-sm transition-all duration-300 rounded-xl border ${
              tab === item.id
                ? "bg-accent/10 border-accent/30 text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
            style={{ width: 'calc(100% - 1.5rem)' }}
          >
            <div className={`relative w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all ${
              tab === item.id ? 'bg-accent/20' : 'bg-muted/50'
            }`}>
              <item.icon className={`w-4 h-4 ${tab === item.id ? 'text-accent' : 'text-muted-foreground'}`} />
            </div>
            <span className="text-xs font-bold">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="px-4 py-3 border-t border-border/50 space-y-2">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full">
          <ArrowLeft className="w-3.5 h-3.5" /> На сайт
        </button>
        <button onClick={() => navigate("/admin/giveaways")} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full">
          <Gift className="w-3.5 h-3.5" /> Розыгрыши
        </button>
        <button onClick={() => navigate("/admin/ads")} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full">
          <Image className="w-3.5 h-3.5" /> Реклама
        </button>
        <button onClick={() => navigate("/admin/support")} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full">
          <Headphones className="w-3.5 h-3.5" /> Поддержка
        </button>
        <button onClick={() => navigate("/admin/redux")} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full">
          <Package className="w-3.5 h-3.5" /> Redux
        </button>
        <button onClick={() => navigate("/admin/knowledge-base")} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full">
          <Database className="w-3.5 h-3.5" /> База знаний AI
        </button>
        <button onClick={signOut} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full">
          <LogOut className="w-3.5 h-3.5" /> Выйти
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row relative">
      {/* Mobile top bar */}
      {isMobile && (
        <div className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-background/95 backdrop-blur-md border-b border-border/50">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg bg-muted/40 text-foreground">
            <Menu className="w-5 h-5" />
          </button>
          <img src={hardyLogo} alt="" className="w-7 h-7 rounded-lg object-contain" />
          <span className="text-sm font-extrabold text-accent">Admin</span>
          <span className="text-xs text-muted-foreground ml-auto">{tabs.find(t => t.id === tab)?.label}</span>
        </div>
      )}

      {/* Mobile sidebar overlay */}
      {isMobile && sidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-30" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed left-0 top-0 bottom-0 w-64 bg-background z-40 flex flex-col shadow-2xl animate-in slide-in-from-left duration-200 border-r border-border/50">
            {sidebarContent}
          </aside>
        </>
      )}

      {/* Desktop sidebar */}
      {!isMobile && (
        <aside className="w-56 h-screen bg-card/50 border-r border-border/50 flex flex-col shrink-0 sticky top-0 z-20">
          {sidebarContent}
        </aside>
      )}

      {/* Content */}
      <main className={`flex-1 min-w-0 overflow-auto relative z-10 ${isMobile ? 'p-3' : 'p-6'}`}>
        {tab === "dashboard" && <DashboardTab />}
        {tab === "users" && <UsersTab />}
        {tab === "articles" && <ArticlesTab />}
        {tab === "updates" && <UpdatesTab />}
      </main>
    </div>
  );
}

// ─── STAT CARD ─────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: typeof Users; color: string }) {
  return (
    <div className="glass p-5 rounded-xl border border-border/50">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-extrabold text-foreground">{value}</p>
    </div>
  );
}

// ─── DASHBOARD TAB ───────────────────────────────────────
function DashboardTab() {
  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: articles = [] } = useQuery({
    queryKey: ["admin-articles-count"],
    queryFn: async () => {
      const { data, error } = await supabase.from("legal_code_articles").select("id, source_id, is_void");
      if (error) throw error;
      return data;
    },
  });

  const { data: sources = [] } = useQuery({
    queryKey: ["admin-sources"],
    queryFn: async () => {
      const { data, error } = await supabase.from("code_sources").select("*").order("order_index");
      if (error) throw error;
      return data;
    },
  });

  const activeArticles = articles.filter(a => !a.is_void).length;
  const recentUsers = profiles.slice(0, 5);

  return (
    <div>
      <h2 className="text-lg font-bold text-foreground mb-6">Дашборд</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Пользователи" value={profiles.length} icon={Users} color="bg-accent/20 text-accent" />
        <StatCard label="Статьи" value={activeArticles} icon={FileText} color="bg-primary/20 text-primary" />
        <StatCard label="Кодексы" value={sources.length} icon={Scale} color="bg-emerald-600/20 text-emerald-400" />
        <StatCard label="Утратили силу" value={articles.filter(a => a.is_void).length} icon={AlertCircle} color="bg-destructive/20 text-destructive" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass p-5 rounded-xl border border-border/50">
          <h3 className="text-sm font-bold text-foreground mb-4">Последние пользователи</h3>
          <div className="space-y-3">
            {recentUsers.map(p => (
              <div key={p.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <Users className="w-3 h-3 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{p.username || "Без имени"}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(p.created_at).toLocaleDateString("ru")}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass p-5 rounded-xl border border-border/50">
          <h3 className="text-sm font-bold text-foreground mb-4">Кодексы</h3>
          <div className="space-y-3">
            {sources.map(s => {
              const count = articles.filter(a => a.source_id === s.id && !a.is_void).length;
              return (
                <div key={s.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-accent">{s.short_name}</span>
                    <span className="text-xs text-muted-foreground truncate">{s.name}</span>
                  </div>
                  <span className="text-xs font-bold text-foreground">{count} ст.</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── USERS TAB ───────────────────────────────────────────
function UsersTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [updatingRoleFor, setUpdatingRoleFor] = useState<string | null>(null);

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: allRoles = [] } = useQuery({
    queryKey: ["admin-roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("*");
      if (error) throw error;
      return data;
    },
  });

  const handleChangeRole = async (userId: string, newRole: 'admin' | 'moderator' | 'user') => {
    if (userId === user?.id) { toast.error('Нельзя менять свою роль'); return; }
    setUpdatingRoleFor(userId);
    try {
      const { data: existingRole } = await supabase.from('user_roles').select('*').eq('user_id', userId).single();
      if (existingRole) {
        await supabase.from('user_roles').update({ role: newRole }).eq('user_id', userId);
      } else {
        await supabase.from('user_roles').insert({ user_id: userId, role: newRole });
      }
      toast.success('Роль обновлена');
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUpdatingRoleFor(null);
    }
  };

  const filtered = useMemo(() => {
    if (!search) return profiles;
    const q = search.toLowerCase();
    return profiles.filter(p => (p.username || "").toLowerCase().includes(q) || p.id.includes(q));
  }, [profiles, search]);

  if (isLoading) return <p className="text-muted-foreground text-sm">Загрузка...</p>;

  return (
    <div>
      <h2 className="text-lg font-bold text-foreground mb-6">Пользователи ({profiles.length})</h2>

      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Поиск по имени или ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 text-sm bg-card/50 border border-border/50 rounded-xl focus:outline-none focus:border-accent/50"
        />
      </div>

      <div className="space-y-2">
        {filtered.map((p) => {
          const userRoles = allRoles.filter((r) => r.user_id === p.id).map((r) => r.role);
          const highestRole = userRoles.includes('admin') ? 'admin' : userRoles.includes('moderator') ? 'moderator' : 'user';

          return (
            <div key={p.id} className="glass p-4 rounded-xl border border-border/50">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  highestRole === 'admin' ? 'bg-yellow-500/20 text-yellow-500' :
                  highestRole === 'moderator' ? 'bg-blue-500/20 text-blue-500' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {highestRole === 'admin' ? <Crown className="w-4 h-4" /> :
                   highestRole === 'moderator' ? <Shield className="w-4 h-4" /> :
                   <Users className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{p.username || "Без имени"}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {p.id.slice(0, 8)}... · {new Date(p.created_at).toLocaleDateString("ru")}
                  </p>
                </div>
                {p.id === user?.id ? (
                  <span className="text-[10px] px-2 py-1 rounded-lg bg-yellow-500/20 text-yellow-500 font-bold">ВЫ</span>
                ) : (
                  <Select
                    value={highestRole}
                    onValueChange={(v: any) => handleChangeRole(p.id, v)}
                    disabled={updatingRoleFor === p.id}
                  >
                    <SelectTrigger className="w-[140px] h-8 text-xs">
                      {updatingRoleFor === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <SelectValue />}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Пользователь</SelectItem>
                      <SelectItem value="moderator">Модератор</SelectItem>
                      <SelectItem value="admin">Админ</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── ARTICLES TAB ────────────────────────────────────────
function ArticlesTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: sources = [] } = useQuery({
    queryKey: ["admin-sources"],
    queryFn: async () => {
      const { data, error } = await supabase.from("code_sources").select("*").order("order_index");
      if (error) throw error;
      return data;
    },
  });

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["admin-articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("legal_code_articles")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const deleteArticle = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("legal_code_articles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      toast.success("Статья удалена");
    },
  });

  const toggleVoid = useMutation({
    mutationFn: async ({ id, isVoid }: { id: string; isVoid: boolean }) => {
      const { error } = await supabase.from("legal_code_articles").update({ is_void: isVoid }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      toast.success("Статус обновлён");
    },
  });

  const filtered = useMemo(() => {
    let list = articles;
    if (selectedSource) list = list.filter(a => a.source_id === selectedSource);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        a.article_number.toLowerCase().includes(q) ||
        a.article_title.toLowerCase().includes(q)
      );
    }
    return list;
  }, [articles, selectedSource, search]);

  const sourceCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of articles) {
      map.set(a.source_id, (map.get(a.source_id) || 0) + 1);
    }
    return map;
  }, [articles]);

  if (isLoading) return <p className="text-muted-foreground text-sm">Загрузка...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-foreground">Статьи ({articles.length})</h2>
      </div>

      {/* Source filter chips */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setSelectedSource(null)}
          className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition-colors ${
            !selectedSource ? "bg-accent/20 border-accent/30 text-accent" : "bg-muted/30 border-border/30 text-muted-foreground hover:bg-muted/50"
          }`}
        >
          Все ({articles.length})
        </button>
        {sources.map(s => (
          <button
            key={s.id}
            onClick={() => setSelectedSource(s.id === selectedSource ? null : s.id)}
            className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition-colors ${
              selectedSource === s.id ? "bg-accent/20 border-accent/30 text-accent" : "bg-muted/30 border-border/30 text-muted-foreground hover:bg-muted/50"
            }`}
          >
            {s.short_name} ({sourceCounts.get(s.id) || 0})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Поиск статей..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 text-sm bg-card/50 border border-border/50 rounded-xl focus:outline-none focus:border-accent/50"
        />
      </div>

      <div className="space-y-2">
        {filtered.slice(0, 200).map((a) => (
          <div key={a.id} className="glass rounded-xl border border-border/50 overflow-hidden">
            <div
              className="p-4 flex items-center gap-3 cursor-pointer"
              onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}
            >
              <Hash className="w-4 h-4 text-muted-foreground/50 shrink-0" />
              <span className="text-xs font-mono text-muted-foreground shrink-0 w-14">{a.article_number}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{a.article_title}</p>
                {a.section_name && <p className="text-[10px] text-muted-foreground truncate">{a.section_name}</p>}
              </div>
              {a.is_void && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/20 text-destructive border border-destructive/30 shrink-0">VOID</span>
              )}
              {expandedId === a.id ? <ChevronDown className="w-4 h-4 text-muted-foreground/50 shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0" />}
            </div>

            {expandedId === a.id && (
              <div className="px-4 pb-4 border-t border-border/30 pt-3">
                {a.description && <p className="text-xs text-muted-foreground mb-3">{a.description}</p>}
                {a.parts && (a.parts as any[]).length > 0 && (
                  <div className="space-y-1 mb-3">
                    {(a.parts as any[]).map((part: any, idx: number) => (
                      <div key={idx} className="text-xs text-muted-foreground">
                        <span className="font-bold text-foreground">ч.{part.number}</span> {part.text}
                        {part.punishment && <span className="text-destructive ml-1">— {part.punishment}</span>}
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleVoid.mutate({ id: a.id, isVoid: !a.is_void })}
                    className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition-colors ${
                      a.is_void ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "bg-amber-500/20 border-amber-500/30 text-amber-400"
                    }`}
                  >
                    {a.is_void ? "Восстановить" : "Аннулировать"}
                  </button>
                  <button
                    onClick={() => { if (confirm("Удалить статью навсегда?")) deleteArticle.mutate(a.id); }}
                    className="text-xs px-3 py-1.5 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive font-semibold hover:bg-destructive/20 transition-colors"
                  >
                    <Trash2 className="w-3 h-3 inline mr-1" />
                    Удалить
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {filtered.length > 200 && (
          <p className="text-xs text-muted-foreground text-center py-4">Показано 200 из {filtered.length} статей. Используйте поиск.</p>
        )}
      </div>
    </div>
  );
}

// ─── UPDATES TAB ─────────────────────────────────────────
function UpdatesTab() {
  const queryClient = useQueryClient();
  const [isRunning, setIsRunning] = useState<string | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const { data: sources = [] } = useQuery({
    queryKey: ["admin-sources"],
    queryFn: async () => {
      const { data, error } = await supabase.from("code_sources").select("*").eq("is_active", true).order("order_index");
      if (error) throw error;
      return data;
    },
  });

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["update-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("update_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data;
    },
    refetchInterval: 10000,
  });

  const handleRunForSource = async (sourceId: string, sourceName: string) => {
    setIsRunning(sourceId);
    try {
      const { error } = await supabase.functions.invoke("daily-update", {
        body: { sourceId },
      });
      if (error) throw error;
      toast.success(`Парсинг ${sourceName} запущен`);
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ["update-logs"] }), 2000);
    } catch (e: any) {
      toast.error("Ошибка: " + e.message);
    } finally {
      setIsRunning(null);
    }
  };

  const handleRunAll = async () => {
    setIsRunning("all");
    try {
      const { error } = await supabase.functions.invoke("daily-update", { body: {} });
      if (error) throw error;
      toast.success("Полное обновление запущено");
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ["update-logs"] }), 2000);
    } catch (e: any) {
      toast.error("Ошибка: " + e.message);
    } finally {
      setIsRunning(null);
    }
  };

  const handleCancelRun = async (logId: string) => {
    try {
      await supabase.from("update_logs").update({ status: "cancelled", finished_at: new Date().toISOString() }).eq("id", logId);
      queryClient.invalidateQueries({ queryKey: ["update-logs"] });
      toast.success("Обновление отменено");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running": return <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />;
      case "completed_with_changes": return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case "completed_no_changes": return <Check className="w-4 h-4 text-muted-foreground" />;
      case "error": return <AlertCircle className="w-4 h-4 text-red-400" />;
      case "cancelled": return <X className="w-4 h-4 text-orange-400" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      running: { label: "Выполняется", cls: "bg-amber-500/15 text-amber-400 border-amber-500/25" },
      completed_with_changes: { label: "Есть изменения", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" },
      completed_no_changes: { label: "Без изменений", cls: "bg-muted/30 text-muted-foreground border-border/30" },
      error: { label: "Ошибка", cls: "bg-red-500/15 text-red-400 border-red-500/25" },
      cancelled: { label: "Отменено", cls: "bg-orange-500/15 text-orange-400 border-orange-500/25" },
    };
    const s = map[status] || { label: status, cls: "bg-muted/30 text-muted-foreground border-border/30" };
    return <span className={`text-[10px] px-2 py-0.5 rounded-md border font-bold ${s.cls}`}>{s.label}</span>;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-foreground">Обновления кодексов</h2>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 mb-6 flex-wrap">
        {sources.map(s => (
          <button
            key={s.id}
            onClick={() => handleRunForSource(s.id, s.short_name)}
            disabled={!!isRunning}
            className="flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl bg-accent/10 text-accent hover:bg-accent/20 border border-accent/20 transition-colors disabled:opacity-50"
          >
            {isRunning === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            {s.short_name}
          </button>
        ))}
        <button
          onClick={handleRunAll}
          disabled={!!isRunning}
          className="flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors disabled:opacity-50"
        >
          {isRunning === "all" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Обновить всё
        </button>
      </div>

      {/* Logs */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">История обновлений</h3>
        {logs.length > 0 && (
          <button
            onClick={async () => {
              if (!confirm("Удалить ВСЕ логи?")) return;
              await supabase.from("update_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
              queryClient.invalidateQueries({ queryKey: ["update-logs"] });
              toast.success("Логи удалены");
            }}
            className="text-[10px] px-2.5 py-1 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive font-bold hover:bg-destructive/20 transition-colors"
          >
            <Trash2 className="w-3 h-3 inline mr-1" />Очистить
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Загрузка...</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Нет записей об обновлениях.</div>
      ) : (
        <div className="space-y-2">
          {logs.map((log: any) => {
            const changes = (log.changes || []) as string[];
            const logErrors = (log.errors || []) as string[];
            const isExpanded = expandedLogId === log.id;

            return (
              <div key={log.id} className="glass rounded-xl border border-border/50 overflow-hidden hover:border-accent/20 transition-colors">
                <div className="px-4 py-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpandedLogId(isExpanded ? null : log.id)}>
                  {getStatusIcon(log.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-foreground">
                        {new Date(log.started_at).toLocaleDateString("ru", { day: "numeric", month: "short" })}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(log.started_at).toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {getStatusBadge(log.status)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground shrink-0">
                    {log.finished_at && (
                      <span className="font-mono">
                        {Math.round((new Date(log.finished_at).getTime() - new Date(log.started_at).getTime()) / 1000)}с
                      </span>
                    )}
                    {changes.length > 0 && <span className="text-emerald-400 font-bold">+{changes.length}</span>}
                    {logErrors.length > 0 && <span className="text-red-400 font-bold">⚠{logErrors.length}</span>}
                    {log.status === "running" && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCancelRun(log.id); }}
                        className="text-[10px] px-2 py-0.5 rounded bg-destructive/20 text-destructive font-bold hover:bg-destructive/30"
                      >
                        Стоп
                      </button>
                    )}
                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-border/20 pt-3 space-y-3">
                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "Источники", val: log.sources_updated || 0 },
                        { label: "Статьи", val: log.articles_reparsed || 0 },
                        { label: "Изменения", val: changes.filter((c: string) => c.startsWith("[+СТ]") || c.startsWith("[~СТ]") || c.startsWith("[⊘СТ]")).length },
                      ].map(s => (
                        <div key={s.label} className="text-center p-2 rounded-lg bg-muted/20">
                          <p className="text-sm font-extrabold text-foreground">{s.val}</p>
                          <p className="text-[9px] text-muted-foreground">{s.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Changes */}
                    {changes.length > 0 && (
                      <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/15 p-3">
                        <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-2">Изменения ({changes.length})</p>
                        <ul className="space-y-1 max-h-48 overflow-y-auto">
                          {changes.map((c: string, i: number) => {
                            const isAdd = c.startsWith("[+");
                            const isRemove = c.startsWith("[-");
                            const isParse = c.startsWith("[ПАРСИНГ]") || c.startsWith("[СКРЕЙП]");
                            const color = isAdd ? "text-emerald-300/90" : isRemove ? "text-red-300/80" : isParse ? "text-violet-300/80" : "text-muted-foreground";
                            return (
                              <li key={i} className={`text-[11px] ${color} flex items-start gap-1.5`}>
                                <span className="mt-0.5 shrink-0">{isAdd ? "+" : isRemove ? "−" : isParse ? "⟳" : "•"}</span>
                                <span className="break-all">{c.replace(/^\[[^\]]+\]\s*/, "")}</span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}

                    {/* Errors */}
                    {logErrors.length > 0 && (
                      <div className="rounded-xl bg-red-500/5 border border-red-500/15 p-3">
                        <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-2">Ошибки</p>
                        <ul className="space-y-1">
                          {logErrors.map((e: string, i: number) => (
                            <li key={i} className="text-[11px] text-red-300/80 flex items-start gap-1.5">
                              <span className="text-red-400 mt-0.5 shrink-0">•</span>
                              <span className="break-all">{e}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!confirm("Удалить лог?")) return;
                        supabase.from("update_logs").delete().eq("id", log.id).then(() => {
                          queryClient.invalidateQueries({ queryKey: ["update-logs"] });
                          toast.success("Лог удалён");
                        });
                      }}
                      className="flex items-center gap-1.5 text-[10px] font-bold text-destructive/70 hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-3 h-3" /> Удалить запись
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}