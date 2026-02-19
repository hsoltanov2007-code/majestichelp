import { useRef, useState, useEffect, useCallback } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, ImageIcon, RefreshCw, Trophy, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import hardyLogo from "@/assets/hardy-logo.png";

type BannerType = "winner" | "giveaway" | "announcement" | "news" | "event";

const BANNER_TYPES: { value: BannerType; label: string; emoji: string }[] = [
  { value: "winner", label: "Победитель", emoji: "🏆" },
  { value: "giveaway", label: "Розыгрыш", emoji: "🎁" },
  { value: "announcement", label: "Анонс", emoji: "📢" },
  { value: "news", label: "Новости", emoji: "📰" },
  { value: "event", label: "Событие", emoji: "⚡" },
];

interface GiveawayOption {
  id: string;
  title: string;
  prize: string;
  winner_id: string | null;
  winnerName?: string;
}

export default function BannerGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [bannerType, setBannerType] = useState<BannerType>("winner");
  const [title, setTitle] = useState("ПОБЕДИТЕЛЬ РОЗЫГРЫША");
  const [subtitle, setSubtitle] = useState("Majestic RP");
  const [description, setDescription] = useState("Поздравляем с победой!");
  const [prize, setPrize] = useState("");
  const [winner, setWinner] = useState("");
  const [date, setDate] = useState("");
  const [logoLoaded, setLogoLoaded] = useState(false);
  const logoRef = useRef<HTMLImageElement | null>(null);

  // Giveaway quick-fill
  const [giveaways, setGiveaways] = useState<GiveawayOption[]>([]);
  const [selectedGiveaway, setSelectedGiveaway] = useState<string>("");

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = hardyLogo;
    img.onload = () => { logoRef.current = img; setLogoLoaded(true); };
    img.onerror = () => setLogoLoaded(true);
  }, []);

  // Load finished giveaways with winner profiles
  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("giveaways")
        .select("id, title, prize, winner_id, status")
        .in("status", ["completed", "active"])
        .order("created_at", { ascending: false })
        .limit(20);

      if (!data) return;

      const withWinners = await Promise.all(
        data.map(async (g) => {
          let winnerName = "";
          if (g.winner_id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("username")
              .eq("id", g.winner_id)
              .single();
            winnerName = profile?.username || "";
          }
          return { ...g, winnerName };
        })
      );

      setGiveaways(withWinners);
    }
    load();
  }, []);

  const handleSelectGiveaway = (id: string) => {
    setSelectedGiveaway(id);
    const g = giveaways.find((x) => x.id === id);
    if (!g) return;
    setTitle(g.title.toUpperCase());
    setPrize(g.prize);
    if (g.winnerName) setWinner(g.winnerName);
  };

  const drawBanner = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 1200;
    const H = 630;
    canvas.width = W;
    canvas.height = H;

    const isWinner = bannerType === "winner";
    const ACCENT = isWinner ? "#f4c430" : "#e63946";
    const ACCENT2 = isWinner ? "#ff9500" : "#e63946";
    const GOLD = "#f4c430";

    // ── Background ──
    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    if (isWinner) {
      bgGrad.addColorStop(0, "#0d0a00");
      bgGrad.addColorStop(0.5, "#12100a");
      bgGrad.addColorStop(1, "#0a0d00");
    } else {
      bgGrad.addColorStop(0, "#0a0b12");
      bgGrad.addColorStop(0.5, "#0f1220");
      bgGrad.addColorStop(1, "#0d0c14");
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = "rgba(255,255,255,0.03)";
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // Glows
    const glow1 = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 500);
    if (isWinner) {
      glow1.addColorStop(0, "rgba(244,196,48,0.12)");
    } else {
      glow1.addColorStop(0, "rgba(230,57,70,0.1)");
    }
    glow1.addColorStop(1, "transparent");
    ctx.fillStyle = glow1;
    ctx.fillRect(0, 0, W, H);

    const glow2 = ctx.createRadialGradient(W - 100, 60, 0, W - 100, 60, 380);
    glow2.addColorStop(0, isWinner ? "rgba(255,149,0,0.15)" : "rgba(230,57,70,0.15)");
    glow2.addColorStop(1, "transparent");
    ctx.fillStyle = glow2;
    ctx.fillRect(0, 0, W, H);

    // Left accent bar gradient
    const barGrad = ctx.createLinearGradient(0, 0, 0, H);
    barGrad.addColorStop(0, ACCENT);
    barGrad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = barGrad;
    ctx.fillRect(0, 0, 5, H);

    // Winner: draw trophy stars in bg
    if (isWinner) {
      const stars = ["★", "★", "★", "✦", "✦", "★"];
      const positions = [
        [900, 90, 60], [1050, 160, 40], [820, 200, 30],
        [980, 70, 25], [1100, 230, 35], [860, 130, 20],
      ];
      positions.forEach(([x, y, size], i) => {
        ctx.save();
        ctx.globalAlpha = 0.07 + (i % 3) * 0.03;
        ctx.fillStyle = GOLD;
        ctx.font = `${size}px Arial`;
        ctx.fillText(stars[i % stars.length], x, y);
        ctx.restore();
      });
    }

    // Card panel
    ctx.save();
    roundRect(ctx, 60, 60, W - 120, H - 120, 24);
    ctx.fillStyle = isWinner ? "rgba(20,15,5,0.75)" : "rgba(16,19,31,0.7)";
    ctx.fill();
    if (isWinner) {
      ctx.strokeStyle = "rgba(244,196,48,0.2)";
    } else {
      ctx.strokeStyle = "rgba(255,255,255,0.07)";
    }
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // Winner sparkle top border inside card
    if (isWinner) {
      const topLine = ctx.createLinearGradient(60, 60, W - 60, 60);
      topLine.addColorStop(0, "transparent");
      topLine.addColorStop(0.5, "rgba(244,196,48,0.6)");
      topLine.addColorStop(1, "transparent");
      ctx.strokeStyle = topLine;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(60, 60); ctx.lineTo(W - 60, 60);
      ctx.stroke();
    }

    // Badge
    const typeInfo = BANNER_TYPES.find((t) => t.value === bannerType)!;
    const badgeText = `${typeInfo.emoji}  ${typeInfo.label.toUpperCase()}`;
    ctx.font = "bold 15px Inter, Arial, sans-serif";
    const badgeW = ctx.measureText(badgeText).width + 32;
    ctx.save();
    roundRect(ctx, 100, 100, badgeW, 36, 8);
    ctx.fillStyle = isWinner ? "rgba(244,196,48,0.15)" : "rgba(230,57,70,0.15)";
    ctx.fill();
    ctx.strokeStyle = isWinner ? "rgba(244,196,48,0.5)" : "rgba(230,57,70,0.4)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = ACCENT;
    ctx.font = "bold 15px Inter, Arial, sans-serif";
    ctx.fillText(badgeText, 116, 124);

    // Separator
    const sepGrad = ctx.createLinearGradient(100, 0, W - 100, 0);
    sepGrad.addColorStop(0, isWinner ? "rgba(244,196,48,0.4)" : "rgba(230,57,70,0.3)");
    sepGrad.addColorStop(1, "transparent");
    ctx.strokeStyle = sepGrad;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(100, 152); ctx.lineTo(W - 100, 152); ctx.stroke();

    // Main title
    const titleFontSize = title.length > 22 ? 50 : title.length > 15 ? 60 : 70;
    if (isWinner) {
      // Gold gradient text
      const titleGrad = ctx.createLinearGradient(100, 170, 100 + titleFontSize * title.length * 0.55, 260);
      titleGrad.addColorStop(0, "#ffe066");
      titleGrad.addColorStop(0.5, "#f4c430");
      titleGrad.addColorStop(1, "#ff9500");
      ctx.fillStyle = titleGrad;
    } else {
      ctx.fillStyle = "#ffffff";
    }
    ctx.font = `900 ${titleFontSize}px Inter, Arial Black, sans-serif`;
    ctx.fillText(title, 100, 242);

    // Subtitle
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "500 24px Inter, Arial, sans-serif";
    ctx.fillText(subtitle, 100, 282);

    // Winner name block (only for winner type)
    if (isWinner && winner) {
      const winnerY = 320;
      ctx.save();
      roundRect(ctx, 100, winnerY, 600, 80, 16);
      const winnerGrad = ctx.createLinearGradient(100, winnerY, 700, winnerY);
      winnerGrad.addColorStop(0, "rgba(244,196,48,0.18)");
      winnerGrad.addColorStop(1, "rgba(244,196,48,0.04)");
      ctx.fillStyle = winnerGrad;
      ctx.fill();
      ctx.strokeStyle = "rgba(244,196,48,0.35)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = "rgba(244,196,48,0.7)";
      ctx.font = "600 13px Inter, Arial, sans-serif";
      ctx.fillText("🎉  ПОБЕДИТЕЛЬ", 122, winnerY + 26);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 30px Inter, Arial Black, sans-serif";
      ctx.fillText(winner, 122, winnerY + 60);
    }

    // Description
    if (description && !(isWinner && winner)) {
      ctx.fillStyle = "rgba(255,255,255,0.72)";
      ctx.font = "400 22px Inter, Arial, sans-serif";
      wrapText(ctx, description, 100, 340, W - 200, 32);
    }
    if (description && isWinner && winner) {
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.font = "400 20px Inter, Arial, sans-serif";
      wrapText(ctx, description, 100, 440, W - 200, 30);
    }

    // Prize block
    if (prize) {
      const prizeY = isWinner && winner ? 490 : description ? 430 : 360;
      if (prizeY < H - 130) {
        ctx.save();
        roundRect(ctx, 100, prizeY, 520, 68, 14);
        const prizeGrad = ctx.createLinearGradient(100, prizeY, 620, prizeY);
        prizeGrad.addColorStop(0, "rgba(244,196,48,0.14)");
        prizeGrad.addColorStop(1, "rgba(244,196,48,0.03)");
        ctx.fillStyle = prizeGrad;
        ctx.fill();
        ctx.strokeStyle = "rgba(244,196,48,0.28)";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
        ctx.fillStyle = GOLD;
        ctx.font = "bold 12px Inter, Arial, sans-serif";
        ctx.fillText("🏆  ПРИЗ", 120, prizeY + 24);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 21px Inter, Arial, sans-serif";
        ctx.fillText(prize, 120, prizeY + 50);
      }
    }

    // Date
    if (date) {
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.font = "400 17px Inter, Arial, sans-serif";
      ctx.fillText(`📅  ${date}`, 100, H - 92);
    }

    // Footer line
    const footerLineGrad = ctx.createLinearGradient(100, 0, W - 100, 0);
    footerLineGrad.addColorStop(0, isWinner ? "rgba(244,196,48,0.25)" : "rgba(255,255,255,0.1)");
    footerLineGrad.addColorStop(1, "transparent");
    ctx.strokeStyle = footerLineGrad;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(100, H - 108); ctx.lineTo(W - 100, H - 108); ctx.stroke();

    // Logo — рядом с HARDY слева
    let logoDrawW = 0;
    if (logoRef.current) {
      const logoH = 32;
      logoDrawW = logoH * (logoRef.current.naturalWidth / logoRef.current.naturalHeight);
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.drawImage(logoRef.current, 100, H - 107, logoDrawW, logoH);
      ctx.restore();
    }

    // Footer branding — HARDY | Majestic RP (правее логотипа)
    const hardyX = logoDrawW > 0 ? 100 + logoDrawW + 10 : 100;
    ctx.fillStyle = ACCENT;
    ctx.font = "900 15px Inter, Arial Black, sans-serif";
    ctx.fillText("HARDY", hardyX, H - 74);
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.font = "500 15px Inter, Arial, sans-serif";
    ctx.fillText(" | Majestic RP", hardyX + 52, H - 74);

    // Promo code block — right side
    ctx.font = "bold 13px Inter, Arial, sans-serif";
    const promoText = "/promo HRDY — 50 000$ + 7 дней премиума";
    const promoW = ctx.measureText(promoText).width + 36;
    const promoX = W - 100 - promoW;
    const promoY = H - 97;
    ctx.save();
    roundRect(ctx, promoX, promoY, promoW, 34, 8);
    ctx.fillStyle = isWinner ? "rgba(244,196,48,0.12)" : "rgba(230,57,70,0.12)";
    ctx.fill();
    ctx.strokeStyle = isWinner ? "rgba(244,196,48,0.45)" : "rgba(230,57,70,0.45)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = isWinner ? "#f4c430" : ACCENT;
    ctx.font = "bold 13px Inter, Arial, sans-serif";
    ctx.fillText(promoText, promoX + 18, promoY + 22);
  }, [bannerType, title, subtitle, description, prize, winner, date, logoLoaded]);

  useEffect(() => { drawBanner(); }, [drawBanner]);

  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
    const words = text.split(" ");
    let line = "";
    let currentY = y;
    for (const word of words) {
      const testLine = line + word + " ";
      if (ctx.measureText(testLine).width > maxWidth && line !== "") {
        ctx.fillText(line, x, currentY);
        line = word + " ";
        currentY += lineHeight;
      } else { line = testLine; }
    }
    ctx.fillText(line, x, currentY);
  }

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `hardy-banner-${bannerType}-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  const isWinner = bannerType === "winner";

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/20">
            <ImageIcon className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Генератор баннеров</h1>
            <p className="text-muted-foreground text-sm">Создавай PNG-баннеры для Discord</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Настройки баннера</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Type */}
              <div className="space-y-2">
                <Label>Тип</Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {BANNER_TYPES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => {
                        setBannerType(t.value);
                        if (t.value === "winner") {
                          setTitle("ПОБЕДИТЕЛЬ РОЗЫГРЫША");
                          setDescription("Поздравляем с победой!");
                        } else if (t.value === "giveaway") {
                          setTitle("РОЗЫГРЫШ");
                          setDescription("Участвуй и выиграй приз!");
                          setWinner("");
                        } else {
                          setWinner("");
                        }
                      }}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                        bannerType === t.value
                          ? t.value === "winner"
                            ? "bg-[hsl(45_93%_55%/0.15)] border-[hsl(45_93%_55%/0.5)] text-[hsl(45_93%_65%)]"
                            : "bg-accent/15 border-accent/50 text-accent"
                          : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span>{t.emoji}</span>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick-fill from DB for winner type */}
              {isWinner && giveaways.length > 0 && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-[hsl(var(--denver-gold))]" />
                    Быстрое заполнение из розыгрыша
                  </Label>
                  <select
                    value={selectedGiveaway}
                    onChange={(e) => handleSelectGiveaway(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30"
                  >
                    <option value="">— Выбрать розыгрыш —</option>
                    {giveaways.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.title}{g.winnerName ? ` · 🏆 ${g.winnerName}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Winner name */}
              {isWinner && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Trophy className="h-3.5 w-3.5 text-[hsl(var(--denver-gold))]" />
                    Имя победителя *
                  </Label>
                  <Input
                    value={winner}
                    onChange={(e) => setWinner(e.target.value)}
                    placeholder="Nikita_Sokoloff"
                    maxLength={40}
                  />
                </div>
              )}

              {/* Title */}
              <div className="space-y-2">
                <Label>Заголовок *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value.toUpperCase())}
                  placeholder="РОЗЫГРЫШ"
                  maxLength={40}
                />
              </div>

              {/* Subtitle */}
              <div className="space-y-2">
                <Label>Подзаголовок</Label>
                <Input
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Majestic RP"
                  maxLength={60}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label>Описание</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Текст объявления..."
                  rows={2}
                  maxLength={150}
                />
              </div>

              {/* Prize */}
              <div className="space-y-2">
                <Label>Приз</Label>
                <Input
                  value={prize}
                  onChange={(e) => setPrize(e.target.value)}
                  placeholder="1 000 000 $ в игре"
                  maxLength={50}
                />
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label>Дата</Label>
                <Input
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  placeholder="25 февраля 2026"
                  maxLength={40}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button onClick={handleDownload} className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Скачать PNG
                </Button>
                <Button variant="outline" size="icon" onClick={drawBanner} title="Обновить">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Превью (1200×630)</p>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Discord размер</span>
            </div>
            <div className="rounded-2xl overflow-hidden border border-border shadow-2xl">
              <canvas ref={canvasRef} className="w-full" style={{ aspectRatio: "1200/630" }} />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Скачай PNG и загрузи в Discord-канал
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
