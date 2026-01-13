import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, X, Loader2, Minimize2, Maximize2, Copy, Check, Trash2, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import hardyLogo from "@/assets/hardy-logo.png";
import { useOpenBotListener } from "@/hooks/useGlobalSearch";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/legal-chat`;

async function streamChat({
  messages,
  onDelta,
  onDone,
  onError,
}: {
  messages: Message[];
  onDelta: (deltaText: string) => void;
  onDone: () => void;
  onError: (error: Error) => void;
}) {
  try {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages }),
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      throw new Error(errorData.error || "Ошибка соединения");
    }

    if (!resp.body) throw new Error("No response body");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    if (textBuffer.trim()) {
      for (let raw of textBuffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch { /* ignore */ }
      }
    }

    onDone();
  } catch (error) {
    onError(error instanceof Error ? error : new Error("Unknown error"));
  }
}
const CHAT_HISTORY_KEY = "hardy-chat-history";

export function LegalChatBot() {
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
  const [showScrollButton, setShowScrollButton] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom function
  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
      }
    }
  }, []);

  // Check if scrolled up to show/hide button
  useEffect(() => {
    if (!scrollRef.current) return;
    const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
    if (!viewport) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = viewport;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    };

    viewport.addEventListener('scroll', handleScroll);
    return () => viewport.removeEventListener('scroll', handleScroll);
  }, [isOpen, isMinimized]);

  // Open bot when Ctrl+F is pressed
  const handleOpenBot = useCallback(() => {
    setIsOpen(true);
    setIsMinimized(false);
  }, []);
  
  useOpenBotListener(handleOpenBot);

  // Save messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
    } catch {
      // Ignore storage errors
    }
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

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      // ScrollArea uses a viewport element inside
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";
    const upsertAssistant = (nextChunk: string) => {
      assistantSoFar += nextChunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    await streamChat({
      messages: [...messages, userMsg],
      onDelta: (chunk) => upsertAssistant(chunk),
      onDone: () => setIsLoading(false),
      onError: (error) => {
        setIsLoading(false);
        setMessages(prev => [
          ...prev,
          { role: "assistant", content: `❌ Ошибка: ${error.message}` },
        ]);
      },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-16 w-16 rounded-full shadow-2xl bg-gradient-to-br from-denver-primary via-denver-primary to-denver-secondary hover:scale-110 transition-all duration-300 flex items-center justify-center border-2 border-denver-primary/50 group"
        title="Юридический помощник HARDY"
      >
        <img 
          src={hardyLogo} 
          alt="HARDY" 
          className="h-10 w-10 object-contain group-hover:animate-pulse" 
        />
        <span className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-background animate-pulse" />
      </button>
    );
  }

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 flex flex-col bg-card border border-denver-primary/30 rounded-2xl shadow-2xl transition-all duration-300 overflow-hidden",
        isMinimized ? "w-80 h-16" : "w-[400px] h-[560px] max-h-[80vh]"
      )}
    >
      {/* Header with Hardy branding */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-denver-primary/20 via-denver-primary/10 to-transparent border-b border-denver-primary/30">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img 
              src={hardyLogo} 
              alt="HARDY" 
              className="h-8 w-8 object-contain" 
            />
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 bg-green-500 rounded-full border border-card" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm text-foreground">HARDY AI</span>
            <span className="text-[10px] text-muted-foreground">Юридический помощник</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-denver-primary/20 hover:text-denver-primary"
              onClick={clearHistory}
              title="Очистить историю"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-denver-primary/20 hover:text-denver-primary"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-destructive/20 hover:text-destructive"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="relative flex-1">
          <ScrollArea ref={scrollRef} className="h-full p-4 bg-gradient-to-b from-transparent to-denver-primary/5">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground text-sm py-6">
                <div className="relative inline-block mb-4">
                  <img 
                    src={hardyLogo} 
                    alt="HARDY" 
                    className="h-16 w-16 mx-auto object-contain opacity-80" 
                  />
                  <div className="absolute inset-0 bg-denver-primary/20 rounded-full blur-xl -z-10" />
                </div>
                <p className="font-bold text-base text-foreground">Привет! Я AI-юрист HARDY</p>
                <p className="mt-1 text-xs text-muted-foreground">Задайте вопрос по законодательству Majestic RP</p>
                <div className="mt-5 flex flex-wrap gap-2 justify-center">
                  {["За что 3 звезды?", "Статья 10.1?", "Штраф за наркотики?"].map((q) => (
                    <button
                      key={q}
                      onClick={() => {
                        setInput(q);
                        inputRef.current?.focus();
                      }}
                      className="text-xs px-3 py-2 rounded-lg bg-denver-primary/10 hover:bg-denver-primary/20 border border-denver-primary/20 transition-all hover:scale-105 text-foreground"
                    >
                      {q}
                    </button>
                  ))}
                </div>
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
                    {copiedIndex === i ? (
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
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
          
          {/* Scroll to bottom button */}
          {showScrollButton && (
            <Button
              onClick={scrollToBottom}
              size="icon"
              className="absolute bottom-2 right-4 h-8 w-8 rounded-full bg-denver-primary/90 hover:bg-denver-primary shadow-lg animate-fade-in"
              title="Вниз"
            >
              <ArrowDown className="h-4 w-4 text-white" />
            </Button>
          )}
          </div>

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
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-[9px] text-center text-muted-foreground mt-2">
              HARDY AI • Majestic RP Legal Assistant
            </p>
          </div>
        </>
      )}
    </div>
  );
}
