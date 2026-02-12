import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Send, X, Loader2, Minimize2, Maximize2, Copy, Check, Trash2, Headphones, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import hardyLogo from "@/assets/hardy-logo.png";
import { useOpenBotListener, useOpenSupportListener } from "@/hooks/useGlobalSearch";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface SupportTicket {
  id: string;
  subject: string;
  status: string;
  created_at: string;
}

interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  content: string;
  is_admin: boolean;
  created_at: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/legal-chat`;

async function sendChat({
  messages,
  onResult,
  onError,
}: {
  messages: Message[];
  onResult: (text: string) => void;
  onError: (error: Error) => void;
}) {
  try {
    const lastUserMessage = messages.filter(m => m.role === "user").pop();
    
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ message: lastUserMessage?.content || "" }),
    });

    const data = await resp.json();
    
    if (!resp.ok) {
      throw new Error(data.error || "Ошибка соединения");
    }

    onResult(data.response || "Не удалось получить ответ");
  } catch (error) {
    onError(error instanceof Error ? error : new Error("Unknown error"));
  }
}

const CHAT_HISTORY_KEY = "hardy-chat-history";

type BotView = "chat" | "support-list" | "support-new" | "support-thread";

export function LegalChatBot() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(CHAT_HISTORY_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Support state
  const [botView, setBotView] = useState<BotView>("chat");
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [ticketMessages, setTicketMessages] = useState<SupportMessage[]>([]);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [newSubject, setNewSubject] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [supportLoading, setSupportLoading] = useState(false);

  const handleOpenBot = useCallback(() => {
    setIsOpen(true);
    setIsMinimized(false);
  }, []);
  
  useOpenBotListener(handleOpenBot);

  const autoCreateTicket = useCallback(async (subject: string) => {
    if (!user) return;
    setSupportLoading(true);
    const { data: ticket, error } = await supabase
      .from("support_tickets")
      .insert({ user_id: user.id, subject } as any)
      .select()
      .single();
    if (error || !ticket) {
      toast.error("Ошибка создания обращения");
      setSupportLoading(false);
      return;
    }
    await supabase.from("support_messages").insert({
      ticket_id: ticket.id,
      sender_id: user.id,
      content: `Здравствуйте! Хочу ${subject.toLowerCase()}.`,
      is_admin: false,
    } as any);
    toast.success("Обращение создано!");
    openTicketThread(ticket.id);
    setSupportLoading(false);
  }, [user]);

  const handleOpenSupport = useCallback((detail?: { subject?: string }) => {
    setIsOpen(true);
    setIsMinimized(false);
    if (detail?.subject && user) {
      autoCreateTicket(detail.subject);
    } else {
      setBotView("support-list");
      fetchTickets();
    }
  }, [user, autoCreateTicket]);

  useOpenSupportListener(handleOpenSupport);

  useEffect(() => {
    try {
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
    } catch {}
  }, [messages]);

  const clearHistory = () => {
    setMessages([]);
    localStorage.removeItem(CHAT_HISTORY_KEY);
    toast.success("История очищена");
  };

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      toast.success("Скопировано!");
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      toast.error("Не удалось скопировать");
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages, isLoading, ticketMessages]);

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  // Realtime subscription for support messages
  useEffect(() => {
    if (!activeTicketId) return;
    const channel = supabase
      .channel(`support-${activeTicketId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `ticket_id=eq.${activeTicketId}` },
        (payload) => {
          setTicketMessages(prev => [...prev, payload.new as SupportMessage]);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeTicketId]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    await sendChat({
      messages: [...messages, userMsg],
      onResult: (response) => {
        setMessages(prev => [...prev, { role: "assistant", content: response }]);
        setIsLoading(false);
      },
      onError: (error) => {
        setIsLoading(false);
        setMessages(prev => [...prev, { role: "assistant", content: `❌ Ошибка: ${error.message}` }]);
      },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Support functions
  const fetchTickets = async () => {
    if (!user) return;
    setSupportLoading(true);
    const { data } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setTickets((data as SupportTicket[]) || []);
    setSupportLoading(false);
  };

  const openSupportList = () => {
    setBotView("support-list");
    fetchTickets();
  };

  const createTicket = async () => {
    if (!user || !newSubject.trim() || !newMessage.trim()) {
      toast.error("Заполните тему и сообщение");
      return;
    }
    setSupportLoading(true);
    const { data: ticket, error } = await supabase
      .from("support_tickets")
      .insert({ user_id: user.id, subject: newSubject.trim() } as any)
      .select()
      .single();

    if (error || !ticket) {
      toast.error("Ошибка создания тикета");
      setSupportLoading(false);
      return;
    }

    await supabase.from("support_messages").insert({
      ticket_id: ticket.id,
      sender_id: user.id,
      content: newMessage.trim(),
      is_admin: false,
    } as any);

    toast.success("Обращение отправлено!");
    setNewSubject("");
    setNewMessage("");
    openTicketThread(ticket.id);
    setSupportLoading(false);
  };

  const openTicketThread = async (ticketId: string) => {
    setActiveTicketId(ticketId);
    setBotView("support-thread");
    setSupportLoading(true);
    const { data } = await supabase
      .from("support_messages")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });
    setTicketMessages((data as SupportMessage[]) || []);
    setSupportLoading(false);
  };

  const sendSupportMessage = async () => {
    if (!user || !activeTicketId || !newMessage.trim()) return;
    const { error } = await supabase.from("support_messages").insert({
      ticket_id: activeTicketId,
      sender_id: user.id,
      content: newMessage.trim(),
      is_admin: false,
    } as any);
    if (error) {
      toast.error("Ошибка отправки");
    } else {
      setNewMessage("");
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-16 w-16 rounded-full shadow-2xl bg-gradient-to-br from-denver-primary via-denver-primary to-denver-secondary hover:scale-110 transition-all duration-300 flex items-center justify-center border-2 border-denver-primary/50 group"
        title="Юридический помощник HARDY"
      >
        <img src={hardyLogo} alt="HARDY" className="h-10 w-10 object-contain group-hover:animate-pulse" />
        <span className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-background animate-pulse" />
      </button>
    );
  }

  const renderSupportList = () => (
    <div className="flex-1 flex flex-col">
      <div className="p-4 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">Мои обращения</h3>
          <Button size="sm" onClick={() => setBotView("support-new")}>Новое</Button>
        </div>
        {supportLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : tickets.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-8">Обращений пока нет</p>
        ) : (
          <div className="space-y-2">
            {tickets.map(t => (
              <button
                key={t.id}
                onClick={() => openTicketThread(t.id)}
                className="w-full text-left p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <div className="flex justify-between items-start gap-2">
                  <span className="text-sm font-medium truncate">{t.subject}</span>
                  <span className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full shrink-0",
                    t.status === "open" ? "bg-green-500/20 text-green-400" :
                    t.status === "answered" ? "bg-blue-500/20 text-blue-400" :
                    "bg-muted text-muted-foreground"
                  )}>
                    {t.status === "open" ? "Открыт" : t.status === "answered" ? "Ответ" : "Закрыт"}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(t.created_at).toLocaleDateString("ru-RU")}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderSupportNew = () => (
    <div className="flex-1 flex flex-col p-4">
      <h3 className="font-semibold text-sm mb-4">Новое обращение</h3>
      <div className="space-y-3 flex-1">
        <Input
          placeholder="Тема обращения"
          value={newSubject}
          onChange={(e) => setNewSubject(e.target.value)}
          className="border-denver-primary/30"
        />
        <Textarea
          placeholder="Опишите вашу проблему..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          rows={5}
          className="border-denver-primary/30 flex-1"
        />
      </div>
      <Button
        onClick={createTicket}
        disabled={supportLoading || !newSubject.trim() || !newMessage.trim()}
        className="w-full mt-3 bg-gradient-to-r from-denver-primary to-denver-secondary"
      >
        {supportLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
        Отправить
      </Button>
    </div>
  );

  const renderSupportThread = () => (
    <div className="flex-1 flex flex-col">
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        {supportLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : ticketMessages.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-8">Нет сообщений</p>
        ) : (
          ticketMessages.map(msg => (
            <div
              key={msg.id}
              className={cn(
                "mb-3 p-3 rounded-xl text-sm whitespace-pre-wrap",
                msg.is_admin
                  ? "bg-denver-primary/15 border border-denver-primary/30 mr-8"
                  : "bg-muted/80 border border-border ml-8"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-medium">
                  {msg.is_admin ? "🛡️ Поддержка" : "Вы"}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(msg.created_at).toLocaleString("ru-RU")}
                </span>
              </div>
              {msg.content}
            </div>
          ))
        )}
      </ScrollArea>
      <div className="p-3 border-t border-denver-primary/20">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Написать..."
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendSupportMessage(); } }}
            className="flex-1 border-denver-primary/30"
          />
          <Button size="icon" onClick={sendSupportMessage} disabled={!newMessage.trim()} className="bg-gradient-to-r from-denver-primary to-denver-secondary">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  const getHeaderTitle = () => {
    switch (botView) {
      case "support-list": return "Поддержка";
      case "support-new": return "Новое обращение";
      case "support-thread": return tickets.find(t => t.id === activeTicketId)?.subject || "Обращение";
      default: return "HARDY AI";
    }
  };

  const getHeaderSubtitle = () => {
    switch (botView) {
      case "support-list": return "Ваши обращения";
      case "support-new": return "Опишите проблему";
      case "support-thread": return "Переписка с поддержкой";
      default: return "Юридический помощник";
    }
  };

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 flex flex-col bg-card border border-denver-primary/30 rounded-2xl shadow-2xl transition-all duration-300 overflow-hidden",
        isMinimized ? "w-80 h-16" : "w-[400px] h-[560px] max-h-[80vh]"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-denver-primary/20 via-denver-primary/10 to-transparent border-b border-denver-primary/30">
        <div className="flex items-center gap-3">
          {botView !== "chat" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 hover:bg-denver-primary/20"
              onClick={() => {
                if (botView === "support-thread" || botView === "support-new") {
                  setBotView("support-list");
                  setActiveTicketId(null);
                  setNewMessage("");
                } else {
                  setBotView("chat");
                }
              }}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          {botView === "chat" && (
            <div className="relative">
              <img src={hardyLogo} alt="HARDY" className="h-8 w-8 object-contain" />
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 bg-green-500 rounded-full border border-card" />
            </div>
          )}
          {botView !== "chat" && <Headphones className="h-5 w-5 text-denver-primary" />}
          <div className="flex flex-col">
            <span className="font-bold text-sm text-foreground">{getHeaderTitle()}</span>
            <span className="text-[10px] text-muted-foreground">{getHeaderSubtitle()}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {botView === "chat" && messages.length > 0 && (
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-denver-primary/20 hover:text-denver-primary" onClick={clearHistory} title="Очистить историю">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          {botView === "chat" && user && (
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-denver-primary/20 hover:text-denver-primary" onClick={openSupportList} title="Поддержка">
              <Headphones className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-denver-primary/20 hover:text-denver-primary" onClick={() => setIsMinimized(!isMinimized)}>
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/20 hover:text-destructive" onClick={() => { setIsOpen(false); setBotView("chat"); }}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {botView === "chat" && (
            <>
              {/* Messages */}
              <ScrollArea ref={scrollRef} className="flex-1 p-4 bg-gradient-to-b from-transparent to-denver-primary/5">
                {messages.length === 0 && (
                  <div className="text-center text-muted-foreground text-sm py-6">
                    <div className="relative inline-block mb-4">
                      <img src={hardyLogo} alt="HARDY" className="h-16 w-16 mx-auto object-contain opacity-80" />
                      <div className="absolute inset-0 bg-denver-primary/20 rounded-full blur-xl -z-10" />
                    </div>
                    <p className="font-bold text-base text-foreground">Привет! Я AI-юрист HARDY</p>
                    <p className="mt-1 text-xs text-muted-foreground">Задайте вопрос по законодательству Majestic RP</p>
                    <div className="mt-5 flex flex-wrap gap-2 justify-center">
                      {["За что 3 звезды?", "Статья 10.1?", "Штраф за наркотики?"].map((q) => (
                        <button
                          key={q}
                          onClick={() => { setInput(q); inputRef.current?.focus(); }}
                          className="text-xs px-3 py-2 rounded-lg bg-denver-primary/10 hover:bg-denver-primary/20 border border-denver-primary/20 transition-all hover:scale-105 text-foreground"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                    {user && (
                      <button
                        onClick={openSupportList}
                        className="mt-4 text-xs px-4 py-2 rounded-lg bg-denver-primary/10 hover:bg-denver-primary/20 border border-denver-primary/20 transition-all hover:scale-105 text-foreground flex items-center gap-2 mx-auto"
                      >
                        <Headphones className="h-3.5 w-3.5" />
                        Обратиться в поддержку
                      </button>
                    )}
                  </div>
                )}
                
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      "mb-3 p-3 rounded-xl text-sm whitespace-pre-wrap relative group animate-fade-in",
                      msg.role === "user"
                        ? "bg-denver-primary/20 border border-denver-primary/30 text-foreground ml-8"
                        : "bg-muted/80 border border-border mr-8"
                    )}
                    style={{ animationDelay: `${Math.min(i * 50, 200)}ms` }}
                  >
                    {msg.role === "assistant" && (
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/50">
                        <img src={hardyLogo} alt="HARDY" className="h-4 w-4" />
                        <span className="text-[10px] font-medium text-denver-primary">HARDY AI</span>
                      </div>
                    )}
                    {msg.content}
                    {msg.role === "assistant" && msg.content && !msg.content.startsWith("❌") && (
                      <button
                        onClick={() => copyToClipboard(msg.content, i)}
                        className="absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-denver-primary/20 transition-all"
                        title="Копировать"
                      >
                        {copiedIndex === i ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                      </button>
                    )}
                  </div>
                ))}
                
                {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                  <div className="mb-3 p-3 rounded-xl bg-muted/80 border border-border mr-8 animate-fade-in">
                    <div className="flex items-center gap-2">
                      <img src={hardyLogo} alt="HARDY" className="h-4 w-4 animate-pulse" />
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-denver-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-denver-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-denver-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
              </ScrollArea>

              {/* Input */}
              <div className="p-3 border-t border-denver-primary/20 bg-card">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Задайте вопрос..."
                    disabled={isLoading}
                    className="flex-1 border-denver-primary/30 focus:border-denver-primary focus:ring-denver-primary/20"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!input.trim() || isLoading}
                    size="icon"
                    className="bg-gradient-to-r from-denver-primary to-denver-secondary hover:opacity-90 text-white shadow-lg shadow-denver-primary/30"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-[9px] text-center text-muted-foreground mt-2">
                  HARDY AI • Majestic RP Legal Assistant
                </p>
              </div>
            </>
          )}

          {botView === "support-list" && renderSupportList()}
          {botView === "support-new" && renderSupportNew()}
          {botView === "support-thread" && renderSupportThread()}
        </>
      )}
    </div>
  );
}
