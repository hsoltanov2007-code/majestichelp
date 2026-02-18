import { useState, useEffect, useCallback } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { dispatchOpenSupport } from "@/hooks/useGlobalSearch";
import {
  Gift, Clock, Users, Trophy, Upload, CheckCircle2, Loader2,
  ExternalLink, RefreshCw, Share2, MessageCircle, Send,
  Flame, Heart, ThumbsUp, Sparkles, ChevronDown, ChevronUp, Bell
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

interface Condition {
  text: string;
  link?: string;
}

interface Giveaway {
  id: string;
  title: string;
  description: string | null;
  prize: string;
  conditions: Condition[];
  image_url: string | null;
  status: string;
  winner_id: string | null;
  ends_at: string | null;
  created_at: string;
  is_featured: boolean;
}

interface GiveawayEntry {
  id: string;
  giveaway_id: string;
  user_id: string;
  screenshot_url: string;
  screenshot_urls: string[];
  status: string;
  rejection_reason: string | null;
  created_at: string;
}

interface GiveawayComment {
  id: string;
  giveaway_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author?: { username: string; avatar_url: string | null };
}

interface ReactionCount {
  type: string;
  count: number;
  reacted: boolean;
}

const REACTION_TYPES = [
  { type: "fire", icon: Flame, label: "🔥" },
  { type: "heart", icon: Heart, label: "❤️" },
  { type: "thumbsup", icon: ThumbsUp, label: "👍" },
];

// Confetti particle component
function ConfettiParticles() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute animate-confetti"
          style={{
            left: `${Math.random() * 100}%`,
            top: `-5%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${2 + Math.random() * 3}s`,
          }}
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: ['hsl(45 93% 55%)', 'hsl(351 80% 58%)', 'hsl(210 40% 96%)', 'hsl(142 71% 55%)'][i % 4],
            }}
          />
        </div>
      ))}
    </div>
  );
}

// Live countdown timer
function LiveCountdown({ endsAt, createdAt }: { endsAt: string; createdAt?: string }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const update = () => {
      const now = Date.now();
      const end = new Date(endsAt).getTime();
      const diff = end - now;
      if (diff <= 0) {
        setTimeLeft("Завершён");
        setProgress(0);
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      if (days > 0) setTimeLeft(`${days}д ${hours}ч ${minutes}м`);
      else if (hours > 0) setTimeLeft(`${hours}ч ${minutes}м ${seconds}с`);
      else setTimeLeft(`${minutes}м ${seconds}с`);

      // Calculate progress based on actual giveaway duration
      if (createdAt) {
        const start = new Date(createdAt).getTime();
        const total = end - start;
        setProgress(Math.max(0, Math.min(100, (diff / total) * 100)));
      } else {
        const totalDuration = 30 * 24 * 60 * 60 * 1000;
        setProgress(Math.min(100, (diff / totalDuration) * 100));
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endsAt, createdAt]);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-xs font-medium">
        <Clock className="h-3.5 w-3.5 text-accent" />
        <span>{timeLeft}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 relative overflow-hidden"
          style={{
            width: `${progress}%`,
            background: `linear-gradient(90deg, hsl(var(--accent)), hsl(var(--accent) / 0.7), hsl(var(--accent)))`,
            backgroundSize: '200% 100%',
            animation: 'progress-flow 2s linear infinite',
          }}
        />
      </div>
    </div>
  );
}

export default function Giveaways() {
  const { user, canManage } = useAuth();
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [entries, setEntries] = useState<Record<string, GiveawayEntry[]>>({});
  const [myEntries, setMyEntries] = useState<Record<string, GiveawayEntry>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGiveaway, setSelectedGiveaway] = useState<Giveaway | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<FileList | null>(null);
  const [winnerProfiles, setWinnerProfiles] = useState<Record<string, string>>({});

  // Comments & reactions state
  const [comments, setComments] = useState<Record<string, GiveawayComment[]>>({});
  const [reactions, setReactions] = useState<Record<string, ReactionCount[]>>({});
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const [sendingComment, setSendingComment] = useState<string | null>(null);

  useEffect(() => {
    fetchGiveaways();
  }, [user]);

  const fetchGiveaways = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("giveaways")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Ошибка загрузки розыгрышей");
      setIsLoading(false);
      return;
    }

    const giveawaysList = (data as unknown as Giveaway[]) || [];
    setGiveaways(giveawaysList);

    const entryCounts: Record<string, GiveawayEntry[]> = {};
    const myE: Record<string, GiveawayEntry> = {};
    const winnerIds = giveawaysList.filter(g => g.winner_id).map(g => g.winner_id);

    for (const g of giveawaysList) {
      const { data: entryData } = await supabase
        .from("giveaway_entries")
        .select("*")
        .eq("giveaway_id", g.id);
      entryCounts[g.id] = (entryData as unknown as GiveawayEntry[]) || [];

      if (user) {
        const mine = (entryData as unknown as GiveawayEntry[])?.find(e => e.user_id === user.id);
        if (mine) myE[g.id] = mine;
      }
    }

    if (winnerIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", winnerIds);
      const wp: Record<string, string> = {};
      profiles?.forEach(p => { wp[p.id] = p.username; });
      setWinnerProfiles(wp);
    }

    setEntries(entryCounts);
    setMyEntries(myE);

    // Fetch comments & reactions for all
    await Promise.all([
      fetchAllComments(giveawaysList.map(g => g.id)),
      fetchAllReactions(giveawaysList.map(g => g.id)),
    ]);

    setIsLoading(false);
  };

  const fetchAllComments = async (giveawayIds: string[]) => {
    const allComments: Record<string, GiveawayComment[]> = {};
    for (const gId of giveawayIds) {
      const { data } = await supabase
        .from("giveaway_comments")
        .select("*")
        .eq("giveaway_id", gId)
        .order("created_at", { ascending: true });

      const commentsList = (data || []) as unknown as GiveawayComment[];
      // Fetch author profiles
      const authorIds = [...new Set(commentsList.map(c => c.author_id))];
      if (authorIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .in("id", authorIds);
        const profileMap: Record<string, { username: string; avatar_url: string | null }> = {};
        profiles?.forEach(p => { profileMap[p.id] = { username: p.username, avatar_url: p.avatar_url }; });
        commentsList.forEach(c => { c.author = profileMap[c.author_id]; });
      }
      allComments[gId] = commentsList;
    }
    setComments(allComments);
  };

  const fetchAllReactions = async (giveawayIds: string[]) => {
    const allReactions: Record<string, ReactionCount[]> = {};
    for (const gId of giveawayIds) {
      const { data } = await supabase
        .from("giveaway_reactions")
        .select("*")
        .eq("giveaway_id", gId);

      const reactionsList = (data || []) as unknown as { reaction_type: string; user_id: string }[];
      const counts: ReactionCount[] = REACTION_TYPES.map(rt => ({
        type: rt.type,
        count: reactionsList.filter(r => r.reaction_type === rt.type).length,
        reacted: user ? reactionsList.some(r => r.reaction_type === rt.type && r.user_id === user.id) : false,
      }));
      allReactions[gId] = counts;
    }
    setReactions(allReactions);
  };

  const handleScreenshotUpload = async (files: FileList) => {
    if (!user || !selectedGiveaway || files.length === 0) return;
    setIsUploading(true);

    try {
      const uploadedUrls: string[] = [];

      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop();
        const path = `${selectedGiveaway.id}/${user.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("giveaway-screenshots")
          .upload(path, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("giveaway-screenshots")
          .getPublicUrl(path);

        uploadedUrls.push(urlData.publicUrl);
      }

      const { error: insertError } = await supabase
        .from("giveaway_entries")
        .insert({
          giveaway_id: selectedGiveaway.id,
          user_id: user.id,
          screenshot_url: uploadedUrls[0],
          screenshot_urls: uploadedUrls,
        } as any);

      if (insertError) {
        if (insertError.code === "23505") {
          toast.error("Вы уже участвуете в этом розыгрыше");
        } else {
          throw insertError;
        }
      } else {
        toast.success("Вы участвуете в розыгрыше!");
        setSelectedGiveaway(null);
        setPendingFiles(null);
        fetchGiveaways();
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Ошибка загрузки скриншотов");
    } finally {
      setIsUploading(false);
    }
  };

  const handleToggleReaction = async (giveawayId: string, reactionType: string) => {
    if (!user) { toast.info("Войдите, чтобы реагировать"); return; }

    const current = reactions[giveawayId]?.find(r => r.type === reactionType);
    if (current?.reacted) {
      await supabase
        .from("giveaway_reactions")
        .delete()
        .eq("giveaway_id", giveawayId)
        .eq("user_id", user.id)
        .eq("reaction_type", reactionType);
    } else {
      await supabase
        .from("giveaway_reactions")
        .insert({ giveaway_id: giveawayId, user_id: user.id, reaction_type: reactionType } as any);
    }
    await fetchAllReactions(giveaways.map(g => g.id));
  };

  const handleSendComment = async (giveawayId: string) => {
    if (!user) { toast.info("Войдите, чтобы комментировать"); return; }
    const text = commentTexts[giveawayId]?.trim();
    if (!text) return;

    setSendingComment(giveawayId);
    const { error } = await supabase
      .from("giveaway_comments")
      .insert({ giveaway_id: giveawayId, author_id: user.id, content: text } as any);

    if (error) {
      toast.error("Ошибка отправки комментария");
    } else {
      setCommentTexts(prev => ({ ...prev, [giveawayId]: "" }));
      await fetchAllComments([giveawayId]);
    }
    setSendingComment(null);
  };

  const handleShare = (giveaway: Giveaway) => {
    const url = `${window.location.origin}/giveaways`;
    navigator.clipboard.writeText(url);
    toast.success("Ссылка скопирована!");
  };

  const handleClaimPrize = async (giveaway: Giveaway) => {
    if (!user) return;
    // Check if ticket already exists for this giveaway
    const { data: existingTickets } = await supabase
      .from("support_tickets")
      .select("id")
      .eq("user_id", user.id)
      .ilike("subject", `%${giveaway.title}%`);

    if (existingTickets && existingTickets.length > 0) {
      toast.info("Тикет уже создан!", {
        action: {
          label: "Открыть чат",
          onClick: () => dispatchOpenSupport(),
        },
      });
      return;
    }

    const { data: ticket, error } = await supabase
      .from("support_tickets")
      .insert({
        user_id: user.id,
        subject: `🎉 Получение приза: ${giveaway.title}`,
      } as any)
      .select()
      .single();

    if (error) {
      toast.error("Ошибка создания тикета");
      return;
    }

    await supabase.from("support_messages").insert({
      ticket_id: ticket.id,
      sender_id: user.id,
      is_admin: false,
      content: `Здравствуйте! Я победитель розыгрыша "${giveaway.title}". Хочу получить приз: ${giveaway.prize}`,
    } as any);

    toast.success("Тикет создан! Открываем чат поддержки...");
    // Auto-open support chat after a short delay for toast to show
    setTimeout(() => dispatchOpenSupport(), 500);
  };

  const handleNotifyAll = async (giveaway: Giveaway) => {
    if (!user) return;
    try {
      // Toggle featured status
      const newFeatured = !giveaway.is_featured;
      const { error: updateError } = await supabase
        .from("giveaways")
        .update({ is_featured: newFeatured } as any)
        .eq("id", giveaway.id);
      if (updateError) {
        console.error("Update giveaway error:", updateError);
        throw updateError;
      }

      // Also send notifications to registered users
      if (newFeatured) {
        const { data: allProfiles, error: profilesError } = await supabase.from("profiles").select("id");
        if (profilesError) {
          console.error("Fetch profiles error:", profilesError);
        }
        if (allProfiles && allProfiles.length > 0) {
          const notifications = allProfiles
            .filter(p => p.id !== user.id)
            .map(p => ({
              user_id: p.id,
              giveaway_id: giveaway.id,
              type: "new_giveaway",
            }));
          
          if (notifications.length > 0) {
            const { error: insertError } = await supabase.from("forum_notifications").insert(notifications as any);
            if (insertError) {
              console.error("Insert notifications error:", insertError);
              // Don't throw - featured status was updated successfully
              toast.success("Розыгрыш выделен! (уведомления не отправлены)");
              fetchGiveaways();
              return;
            }
          }
        }
        toast.success("Розыгрыш выделен и уведомления отправлены!");
      } else {
        toast.success("Выделение розыгрыша снято");
      }

      fetchGiveaways();
    } catch (error) {
      console.error("handleNotifyAll error:", error);
      toast.error("Ошибка");
    }
  };

  const toggleComments = (giveawayId: string) => {
    setExpandedComments(prev => {
      const next = new Set(prev);
      if (next.has(giveawayId)) next.delete(giveawayId);
      else next.add(giveawayId);
      return next;
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/20">
            <Gift className="h-8 w-8 text-accent" />
          </div>
          <div>
            <h1 className="text-3xl font-bold gradient-text">Розыгрыши</h1>
            <p className="text-sm text-muted-foreground">Участвуй и выигрывай призы</p>
          </div>
        </div>

        {/* Featured giveaway banner */}
        {giveaways.filter(g => g.is_featured && g.status === "active").map(g => (
          <div
            key={`featured-${g.id}`}
            className="mb-8 relative overflow-hidden rounded-2xl border-2 border-accent/40 bg-gradient-to-r from-accent/15 via-card to-accent/10 p-6 shadow-[0_0_30px_hsl(351_80%_58%/0.15)]"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent via-accent/60 to-accent animate-pulse" />
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              {g.image_url && (
                <img src={g.image_url} alt={g.title} className="w-20 h-20 rounded-xl object-cover shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="h-5 w-5 text-accent animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-accent">Не пропустите!</span>
                </div>
                <h3 className="text-xl font-bold">{g.title}</h3>
                {g.description && <p className="text-sm text-muted-foreground mt-1">{g.description}</p>}
                <div className="flex items-center gap-3 mt-2">
                  <Badge className="bg-accent/90 text-accent-foreground">Приз: {g.prize}</Badge>
                  {g.ends_at && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <LiveCountdown endsAt={g.ends_at} createdAt={g.created_at} />
                    </span>
                  )}
                </div>
              </div>
              {!myEntries[g.id] && user && (
                <Button
                  className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl shadow-lg"
                  onClick={() => setSelectedGiveaway(g)}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Участвовать
                </Button>
              )}
              {!user && (
                <Button variant="outline" className="rounded-xl" onClick={() => toast.info("Войдите, чтобы участвовать")}>
                  Войти для участия
                </Button>
              )}
            </div>
          </div>
        ))}

        {giveaways.length === 0 ? (
          <div className="glass rounded-2xl border-dashed text-center py-20 text-muted-foreground">
            <Gift className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">Пока нет активных розыгрышей</p>
            <p className="text-sm mt-1">Следите за обновлениями!</p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {giveaways.map((g) => {
              const isActive = g.status === "active";
              const isCompleted = g.status === "completed";
              const isWinner = isCompleted && g.winner_id;
              const participantCount = entries[g.id]?.length || 0;
              const gComments = comments[g.id] || [];
              const gReactions = reactions[g.id] || [];
              const isExpanded = expandedComments.has(g.id);

              return (
                <div
                  key={g.id}
                  className={`group relative flex flex-col rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-2 ${
                    isWinner
                      ? "shadow-[0_0_40px_hsl(45_93%_55%/0.3)] border-2 border-[hsl(45_93%_55%/0.5)]"
                      : isActive
                      ? "shadow-lg shadow-accent/5 hover:shadow-xl hover:shadow-accent/10 border border-border/50"
                      : "border border-border/30 opacity-85"
                  } glass`}
                >
                  {/* Winner confetti */}
                  {isWinner && <ConfettiParticles />}

                  {/* Image */}
                  {g.image_url ? (
                    <div className="relative h-52 overflow-hidden">
                      <img
                        src={g.image_url}
                        alt={g.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
                      <div className="absolute top-3 right-3 flex items-center gap-2">
                        <StatusBadge status={g.status} />
                      </div>
                      {g.ends_at && isActive && (
                        <div className="absolute bottom-3 left-3 right-3">
                          <LiveCountdown endsAt={g.ends_at} createdAt={g.created_at} />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="relative h-36 bg-gradient-to-br from-accent/10 via-secondary/50 to-card flex items-center justify-center">
                      <Gift className="h-14 w-14 text-accent/20" />
                      <div className="absolute top-3 right-3">
                        <StatusBadge status={g.status} />
                      </div>
                    </div>
                  )}

                  {/* Content */}
                  <div className="relative flex flex-col flex-1 p-5 space-y-4">
                    {/* Title & description */}
                    <div>
                      <h3 className="text-xl font-bold leading-tight mb-1.5">{g.title}</h3>
                      {g.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{g.description}</p>
                      )}
                    </div>

                    {/* Prize - gradient highlight */}
                    <div className="flex items-center gap-3 p-3.5 rounded-xl bg-gradient-to-r from-accent/10 to-transparent border border-accent/15">
                      <div className="p-2 rounded-lg bg-accent/15">
                        <Trophy className="h-5 w-5 text-accent" />
                      </div>
                      <span className="font-bold text-sm gradient-text-accent">{g.prize}</span>
                    </div>

                    {/* Conditions */}
                    {g.conditions && (g.conditions as Condition[]).length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Условия</p>
                        <ul className="space-y-1.5">
                          {(g.conditions as Condition[]).map((c, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <CheckCircle2 className="h-4 w-4 mt-0.5 text-accent shrink-0" />
                              <span className="flex-1">
                                {c.link ? (
                                  <a href={c.link} target="_blank" rel="noopener noreferrer"
                                    className="text-accent hover:underline inline-flex items-center gap-1">
                                    {c.text}
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                ) : (
                                  <span className="text-muted-foreground">{c.text}</span>
                                )}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Stats row */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        <span className={participantCount > 0 ? "animate-pulse font-semibold text-foreground" : ""}>
                          {participantCount}
                        </span>
                        участников
                      </span>
                      {g.ends_at && !g.image_url && isActive && (
                        <LiveCountdown endsAt={g.ends_at} createdAt={g.created_at} />
                      )}
                    </div>

                    {/* Winner announcement */}
                    {isCompleted && g.winner_id && (
                      <div className="relative p-4 rounded-xl bg-gradient-to-r from-[hsl(45_93%_55%/0.15)] to-transparent border border-[hsl(45_93%_55%/0.3)]">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-[hsl(45_93%_55%/0.2)] animate-bounce">
                            <Trophy className="h-5 w-5 text-[hsl(45_93%_55%)]" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Победитель</p>
                            <p className="font-bold text-[hsl(45_93%_55%)]">
                              {winnerProfiles[g.winner_id] || "—"}
                            </p>
                          </div>
                          <Sparkles className="ml-auto h-5 w-5 text-[hsl(45_93%_55%)] animate-pulse" />
                        </div>
                        {/* Claim prize button for winner */}
                        {user && user.id === g.winner_id && (
                          <Button
                            className="w-full mt-3 bg-gradient-to-r from-[hsl(45_93%_55%)] to-[hsl(45_93%_45%)] hover:from-[hsl(45_93%_50%)] hover:to-[hsl(45_93%_40%)] text-black font-bold rounded-xl shadow-lg"
                            onClick={() => handleClaimPrize(g)}
                          >
                            <Gift className="h-4 w-4 mr-2" />
                            Получить приз
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Reactions */}
                    <div className="flex items-center gap-2 pt-1">
                      {REACTION_TYPES.map(rt => {
                        const rc = gReactions.find(r => r.type === rt.type);
                        return (
                          <button
                            key={rt.type}
                            onClick={() => handleToggleReaction(g.id, rt.type)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-all border ${
                              rc?.reacted
                                ? "bg-accent/15 border-accent/30 text-accent"
                                : "bg-muted/50 border-border/50 text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            <rt.icon className="h-3.5 w-3.5" />
                            {(rc?.count || 0) > 0 && <span>{rc?.count}</span>}
                          </button>
                        );
                      })}

                      {/* Share button */}
                      <button
                        onClick={() => handleShare(g)}
                        className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-muted/50 border border-border/50 text-muted-foreground hover:bg-muted transition-all"
                      >
                        <Share2 className="h-3.5 w-3.5" />
                      </button>

                      {/* Admin notify/feature button */}
                      {canManage && isActive && (
                        <button
                          onClick={() => handleNotifyAll(g)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-all border ${
                            g.is_featured
                              ? "bg-accent/30 border-accent/50 text-accent"
                              : "bg-accent/15 border-accent/30 text-accent hover:bg-accent/25"
                          }`}
                          title={g.is_featured ? "Снять выделение" : "Выделить и уведомить всех"}
                        >
                          <Bell className={`h-3.5 w-3.5 ${g.is_featured ? "fill-current" : ""}`} />
                        </button>
                      )}
                    </div>

                    {/* Action button */}
                    <div className="pt-1">
                      {isActive && (
                        <>
                          {myEntries[g.id] ? (
                            myEntries[g.id].status === "rejected" ? (
                              <div className="space-y-2">
                                <Button
                                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl"
                                  onClick={async () => {
                                    await supabase.from("giveaway_entries").delete().eq("id", myEntries[g.id].id);
                                    setSelectedGiveaway(g);
                                    fetchGiveaways();
                                  }}
                                >
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Попробовать снова
                                </Button>
                                {myEntries[g.id].rejection_reason && (
                                  <p className="text-xs text-destructive text-center px-2">
                                    Отклонено: {myEntries[g.id].rejection_reason}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <Button disabled className="w-full rounded-xl" variant="secondary">
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                {myEntries[g.id].status === "approved" ? "Участие подтверждено" : "На проверке"}
                              </Button>
                            )
                          ) : user ? (
                            <Button
                              className="w-full bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 text-accent-foreground rounded-xl shadow-lg shadow-accent/20 transition-all duration-300"
                              onClick={() => setSelectedGiveaway(g)}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Участвовать
                            </Button>
                          ) : (
                            <Button className="w-full rounded-xl" variant="outline" onClick={() => toast.info("Войдите, чтобы участвовать")}>
                              Войти для участия
                            </Button>
                          )}
                        </>
                      )}
                    </div>

                    {/* Comments toggle */}
                    <button
                      onClick={() => toggleComments(g.id)}
                      className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors pt-1"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      Комментарии ({gComments.length})
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>

                    {/* Comments section */}
                    {isExpanded && (
                      <div className="space-y-3 border-t border-border/30 pt-3">
                        <ScrollArea className={gComments.length > 3 ? "h-48" : ""}>
                          <div className="space-y-3">
                            {gComments.length === 0 ? (
                              <p className="text-xs text-muted-foreground text-center py-2">Пока нет комментариев</p>
                            ) : (
                              gComments.map(c => (
                                <div key={c.id} className="flex items-start gap-2">
                                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0">
                                    {c.author?.username?.[0]?.toUpperCase() || "?"}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-semibold">{c.author?.username || "Аноним"}</span>
                                      <span className="text-[10px] text-muted-foreground">
                                        {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: ru })}
                                      </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5">{c.content}</p>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </ScrollArea>

                        {/* Comment input */}
                        {user && (
                          <div className="flex items-center gap-2">
                            <Input
                              placeholder="Написать комментарий..."
                              value={commentTexts[g.id] || ""}
                              onChange={e => setCommentTexts(prev => ({ ...prev, [g.id]: e.target.value }))}
                              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendComment(g.id); } }}
                              className="text-xs h-8 rounded-lg"
                            />
                            <Button
                              size="icon"
                              className="h-8 w-8 shrink-0 rounded-lg"
                              disabled={!commentTexts[g.id]?.trim() || sendingComment === g.id}
                              onClick={() => handleSendComment(g.id)}
                            >
                              {sendingComment === g.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload dialog */}
      <Dialog open={!!selectedGiveaway} onOpenChange={() => { setSelectedGiveaway(null); setPendingFiles(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Участие в розыгрыше</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Выполните все условия и загрузите скриншот-подтверждение.
            </p>
            {selectedGiveaway?.conditions && (
              <div className="space-y-2 p-3 rounded-lg bg-muted">
                <p className="font-medium text-sm">Условия:</p>
                {(selectedGiveaway.conditions as Condition[]).map((c, i) => (
                  <p key={i} className="text-sm flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-accent" />
                    {c.link ? (
                      <a href={c.link} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline inline-flex items-center gap-1">
                        {c.text}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      c.text
                    )}
                  </p>
                ))}
              </div>
            )}
            <div className="space-y-2">
              <Label>Скриншоты подтверждения * (можно несколько)</Label>
              <Input
                type="file"
                accept="image/*"
                multiple
                disabled={isUploading}
                onChange={(e) => {
                  setPendingFiles(e.target.files);
                }}
              />
              {pendingFiles && pendingFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Выбрано файлов: {pendingFiles.length}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(pendingFiles).map((f, i) => (
                      <img key={i} src={URL.createObjectURL(f)} alt={f.name} className="w-16 h-16 rounded-lg object-cover border border-border" />
                    ))}
                  </div>
                </div>
              )}
            </div>
            {isUploading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Загрузка...
              </div>
            )}
            <Button
              disabled={!pendingFiles?.length || isUploading}
              onClick={() => {
                if (pendingFiles?.length) handleScreenshotUpload(pendingFiles);
              }}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              {isUploading ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Загрузка...</>
              ) : (
                <><Upload className="h-4 w-4 mr-2" /> Подтвердить участие</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "active") {
    return (
      <Badge className="bg-accent/90 text-accent-foreground shadow-lg backdrop-blur-sm flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-accent-foreground animate-pulse" />
        Активен
      </Badge>
    );
  }
  if (status === "completed") return <Badge variant="secondary" className="backdrop-blur-sm">Завершён</Badge>;
  if (status === "cancelled") return <Badge variant="destructive" className="backdrop-blur-sm">Отменён</Badge>;
  return null;
}
