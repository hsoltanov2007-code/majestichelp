import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Headphones, Send, X, CheckCircle2, Crown } from "lucide-react";

interface Ticket {
  id: string;
  user_id: string;
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
  profile?: { username: string };
  lastMessage?: string;
  messageCount?: number;
}

interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  content: string;
  is_admin: boolean;
  created_at: string;
}

export default function AdminSupport() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) checkAdmin();
  }, [user]);

  const checkAdmin = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();
    if (data?.role === "admin" || data?.role === "moderator") {
      setIsAdmin(true);
      fetchTickets();
    } else {
      navigate("/");
    }
  };

  const fetchTickets = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("support_tickets")
      .select("*")
      .order("updated_at", { ascending: false });

    const ticketsData = (data as Ticket[]) || [];

    // Fetch profiles and last messages
    for (const t of ticketsData) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", t.user_id)
        .single();
      t.profile = profile || { username: "—" };

      const { data: msgs, count } = await supabase
        .from("support_messages")
        .select("*", { count: "exact" })
        .eq("ticket_id", t.id)
        .order("created_at", { ascending: false })
        .limit(1);
      t.lastMessage = msgs?.[0]?.content || "";
      t.messageCount = count || 0;
    }

    setTickets(ticketsData);
    setIsLoading(false);
  };

  const openTicket = async (ticket: Ticket) => {
    setActiveTicket(ticket);
    const { data } = await supabase
      .from("support_messages")
      .select("*")
      .eq("ticket_id", ticket.id)
      .order("created_at", { ascending: true });
    setMessages((data as TicketMessage[]) || []);
  };

  // Realtime
  useEffect(() => {
    if (!activeTicket) return;
    const channel = supabase
      .channel(`admin-support-${activeTicket.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `ticket_id=eq.${activeTicket.id}` },
        (payload) => {
          setMessages(prev => [...prev, payload.new as TicketMessage]);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeTicket]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages]);

  const sendReply = async () => {
    if (!user || !activeTicket || !reply.trim()) return;
    setSending(true);

    const { error } = await supabase.from("support_messages").insert({
      ticket_id: activeTicket.id,
      sender_id: user.id,
      content: reply.trim(),
      is_admin: true,
    } as any);

    if (!error) {
      // Update ticket status to answered
      await supabase
        .from("support_tickets")
        .update({ status: "answered" } as any)
        .eq("id", activeTicket.id);
      setReply("");
    } else {
      toast.error("Ошибка отправки");
    }
    setSending(false);
  };

  const closeTicket = async (ticketId: string) => {
    await supabase
      .from("support_tickets")
      .update({ status: "closed" } as any)
      .eq("id", ticketId);
    toast.success("Тикет закрыт");
    if (activeTicket?.id === ticketId) setActiveTicket(null);
    fetchTickets();
  };

  const reopenTicket = async (ticketId: string) => {
    await supabase
      .from("support_tickets")
      .update({ status: "open" } as any)
      .eq("id", ticketId);
    toast.success("Тикет открыт");
    fetchTickets();
  };

  const grantSubscription = async () => {
    if (!activeTicket) return;
    const userId = activeTicket.user_id;
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    // Check if user already has subscriber role
    const { data: existing } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", userId)
      .eq("role", "subscriber" as any)
      .maybeSingle();

    if (existing) {
      // Update expiry
      await supabase
        .from("user_roles")
        .update({ expires_at: expiresAt } as any)
        .eq("id", existing.id);
      toast.success("Подписка продлена на 30 дней!");
    } else {
      // Insert new subscriber role
      await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: "subscriber" as any, expires_at: expiresAt } as any);
      toast.success("Подписка выдана на 30 дней!");
    }

    // Send confirmation message in chat
    if (user) {
      await supabase.from("support_messages").insert({
        ticket_id: activeTicket.id,
        sender_id: user.id,
        content: `✅ Подписка активирована! Реклама убрана на 30 дней (до ${new Date(expiresAt).toLocaleDateString("ru-RU")}).`,
        is_admin: true,
      } as any);
    }
  };

  if (authLoading || isLoading || !isAdmin) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Headphones className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Поддержка</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tickets list */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-sm">Обращения ({tickets.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[60vh] overflow-y-auto">
                {tickets.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground text-sm">Обращений нет</p>
                ) : (
                  tickets.map(t => (
                    <button
                      key={t.id}
                      onClick={() => openTicket(t)}
                      className={`w-full text-left p-4 border-b border-border hover:bg-muted/50 transition-colors ${
                        activeTicket?.id === t.id ? "bg-muted/80" : ""
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <span className="text-sm font-medium truncate">{t.subject}</span>
                        <Badge variant={t.status === "open" ? "default" : t.status === "answered" ? "secondary" : "outline"} className="shrink-0 text-[10px]">
                          {t.status === "open" ? "Новый" : t.status === "answered" ? "Ответ" : "Закрыт"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{t.profile?.username}</p>
                      {t.lastMessage && (
                        <p className="text-xs text-muted-foreground truncate mt-1">{t.lastMessage}</p>
                      )}
                      <div className="flex justify-between mt-1">
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(t.created_at).toLocaleDateString("ru-RU")}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{t.messageCount} сообщ.</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Chat area */}
          <Card className="lg:col-span-2 flex flex-col" style={{ minHeight: "60vh" }}>
            {activeTicket ? (
              <>
                <CardHeader className="border-b border-border pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{activeTicket.subject}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        От: {activeTicket.profile?.username} • {new Date(activeTicket.created_at).toLocaleString("ru-RU")}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="text-amber-500 border-amber-500/30 hover:bg-amber-500/10" onClick={grantSubscription}>
                        <Crown className="h-3.5 w-3.5 mr-1" /> Подписка 30д
                      </Button>
                      {activeTicket.status !== "closed" ? (
                        <Button size="sm" variant="outline" onClick={() => closeTicket(activeTicket.id)}>
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Закрыть
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => reopenTicket(activeTicket.id)}>
                          Открыть
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => setActiveTicket(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <ScrollArea ref={scrollRef} className="flex-1 p-4">
                  {messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`mb-3 p-3 rounded-xl text-sm whitespace-pre-wrap ${
                        msg.is_admin
                          ? "bg-primary/10 border border-primary/20 ml-8"
                          : "bg-muted/80 border border-border mr-8"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-semibold">
                          {msg.is_admin ? "🛡️ Поддержка" : `👤 ${activeTicket.profile?.username}`}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(msg.created_at).toLocaleString("ru-RU")}
                        </span>
                      </div>
                      {msg.content}
                    </div>
                  ))}
                </ScrollArea>
                {activeTicket.status !== "closed" && (
                  <div className="p-4 border-t border-border">
                    <div className="flex gap-2">
                      <Input
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        placeholder="Ответить..."
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                        className="flex-1"
                      />
                      <Button onClick={sendReply} disabled={!reply.trim() || sending}>
                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Headphones className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Выберите обращение</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </Layout>
  );
}
