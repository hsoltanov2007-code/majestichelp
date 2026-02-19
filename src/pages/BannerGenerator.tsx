import { useRef, useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, ImageIcon, RefreshCw } from "lucide-react";
import hardyLogo from "@/assets/hardy-logo.png";

type BannerType = "giveaway" | "announcement" | "news" | "event";

const BANNER_TYPES: { value: BannerType; label: string; emoji: string }[] = [
  { value: "giveaway", label: "Розыгрыш", emoji: "🎁" },
  { value: "announcement", label: "Анонс", emoji: "📢" },
  { value: "news", label: "Новости", emoji: "📰" },
  { value: "event", label: "Событие", emoji: "⚡" },
];

export default function BannerGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [bannerType, setBannerType] = useState<BannerType>("giveaway");
  const [title, setTitle] = useState("РОЗЫГРЫШ");
  const [subtitle, setSubtitle] = useState("Majestic RP");
  const [description, setDescription] = useState("Участвуй и выиграй приз!");
  const [prize, setPrize] = useState("");
  const [date, setDate] = useState("");
  const [logoLoaded, setLogoLoaded] = useState(false);
  const logoRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = hardyLogo;
    img.onload = () => {
      logoRef.current = img;
      setLogoLoaded(true);
    };
    img.onerror = () => setLogoLoaded(true); // draw even without logo
  }, []);

  useEffect(() => {
    drawBanner();
  }, [bannerType, title, subtitle, description, prize, date, logoLoaded]);

  const ACCENT = "#e63946";
  const GOLD = "#f4c430";
  const BG_DARK = "#0a0b12";
  const BG_CARD = "#10131f";

  function drawBanner() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 1200;
    const H = 630;
    canvas.width = W;
    canvas.height = H;

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, "#0a0b12");
    bgGrad.addColorStop(0.5, "#0f1220");
    bgGrad.addColorStop(1, "#0d0c14");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Grid pattern
    ctx.strokeStyle = "rgba(255,255,255,0.03)";
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 60) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 60) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Glowing circle top-right
    const radialGlow = ctx.createRadialGradient(W - 150, 80, 0, W - 150, 80, 350);
    radialGlow.addColorStop(0, "rgba(230,57,70,0.18)");
    radialGlow.addColorStop(1, "transparent");
    ctx.fillStyle = radialGlow;
    ctx.fillRect(0, 0, W, H);

    // Glowing circle bottom-left
    const radialGlow2 = ctx.createRadialGradient(100, H - 100, 0, 100, H - 100, 300);
    radialGlow2.addColorStop(0, "rgba(244,196,48,0.08)");
    radialGlow2.addColorStop(1, "transparent");
    ctx.fillStyle = radialGlow2;
    ctx.fillRect(0, 0, W, H);

    // Left red accent bar
    const barGrad = ctx.createLinearGradient(0, 0, 0, H);
    barGrad.addColorStop(0, ACCENT);
    barGrad.addColorStop(1, "rgba(230,57,70,0)");
    ctx.fillStyle = barGrad;
    ctx.fillRect(0, 0, 5, H);

    // Card panel
    ctx.save();
    roundRect(ctx, 60, 60, W - 120, H - 120, 24);
    ctx.fillStyle = "rgba(16,19,31,0.7)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.07)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // Type badge
    const typeInfo = BANNER_TYPES.find((t) => t.value === bannerType)!;
    const badgeText = `${typeInfo.emoji}  ${typeInfo.label.toUpperCase()}`;
    ctx.font = "bold 16px Inter, Arial, sans-serif";
    ctx.fillStyle = ACCENT;
    const badgeW = ctx.measureText(badgeText).width + 32;
    ctx.save();
    roundRect(ctx, 100, 100, badgeW, 36, 8);
    ctx.fillStyle = "rgba(230,57,70,0.15)";
    ctx.fill();
    ctx.strokeStyle = "rgba(230,57,70,0.4)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = ACCENT;
    ctx.font = "bold 15px Inter, Arial, sans-serif";
    ctx.fillText(badgeText, 116, 124);

    // Separator line under badge
    ctx.strokeStyle = "rgba(230,57,70,0.25)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(100, 152); ctx.lineTo(W - 100, 152);
    ctx.stroke();

    // Main title
    ctx.fillStyle = "#ffffff";
    const titleFontSize = title.length > 20 ? 56 : 68;
    ctx.font = `900 ${titleFontSize}px Inter, Arial Black, sans-serif`;
    ctx.fillText(title, 100, 240);

    // Subtitle
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "500 26px Inter, Arial, sans-serif";
    ctx.fillText(subtitle, 100, 285);

    // Description
    if (description) {
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.font = "400 22px Inter, Arial, sans-serif";
      wrapText(ctx, description, 100, 340, W - 200, 32);
    }

    // Prize block
    if (prize) {
      const prizeY = description ? 430 : 360;
      ctx.save();
      roundRect(ctx, 100, prizeY, 500, 70, 14);
      const prizeGrad = ctx.createLinearGradient(100, prizeY, 600, prizeY);
      prizeGrad.addColorStop(0, "rgba(244,196,48,0.15)");
      prizeGrad.addColorStop(1, "rgba(244,196,48,0.03)");
      ctx.fillStyle = prizeGrad;
      ctx.fill();
      ctx.strokeStyle = "rgba(244,196,48,0.3)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = GOLD;
      ctx.font = "bold 13px Inter, Arial, sans-serif";
      ctx.fillText("🏆  ПРИЗ", 120, prizeY + 26);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 22px Inter, Arial, sans-serif";
      ctx.fillText(prize, 120, prizeY + 52);
    }

    // Date
    if (date) {
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.font = "400 18px Inter, Arial, sans-serif";
      ctx.fillText(`📅  ${date}`, 100, H - 95);
    }

    // Bottom footer line
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(100, H - 110); ctx.lineTo(W - 100, H - 110);
    ctx.stroke();

    // Logo
    if (logoRef.current) {
      const logoH = 40;
      const logoW = logoH * (logoRef.current.naturalWidth / logoRef.current.naturalHeight);
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.drawImage(logoRef.current, W - 100 - logoW, H - 110, logoW, logoH);
      ctx.restore();
    }

    // Site URL
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "400 15px Inter, Arial, sans-serif";
    ctx.fillText("majestichelp.lovable.app", W - 100 - 220, H - 75);

    // "HARDY" branding bottom-left
    ctx.fillStyle = ACCENT;
    ctx.font = "900 15px Inter, Arial Black, sans-serif";
    ctx.fillText("HARDY", 100, H - 75);
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "400 15px Inter, Arial, sans-serif";
    ctx.fillText("  ·  Majestic RP Legal Assistant", 150, H - 75);
  }

  function roundRect(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number, r: number
  ) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function wrapText(
    ctx: CanvasRenderingContext2D,
    text: string, x: number, y: number, maxWidth: number, lineHeight: number
  ) {
    const words = text.split(" ");
    let line = "";
    let currentY = y;
    for (const word of words) {
      const testLine = line + word + " ";
      if (ctx.measureText(testLine).width > maxWidth && line !== "") {
        ctx.fillText(line, x, currentY);
        line = word + " ";
        currentY += lineHeight;
      } else {
        line = testLine;
      }
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

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/20">
            <ImageIcon className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Генератор баннеров</h1>
            <p className="text-muted-foreground text-sm">Создавай красивые PNG-баннеры для Discord</p>
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
                <div className="grid grid-cols-2 gap-2">
                  {BANNER_TYPES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setBannerType(t.value)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                        bannerType === t.value
                          ? "bg-accent/15 border-accent/50 text-accent"
                          : "border-border text-muted-foreground hover:border-border/80 hover:text-foreground"
                      }`}
                    >
                      <span>{t.emoji}</span>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

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
                <Label>Приз (необязательно)</Label>
                <Input
                  value={prize}
                  onChange={(e) => setPrize(e.target.value)}
                  placeholder="1 000 000 $ в игре"
                  maxLength={50}
                />
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label>Дата (необязательно)</Label>
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
                <Button
                  variant="outline"
                  size="icon"
                  onClick={drawBanner}
                  title="Обновить превью"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Превью (1200×630)</p>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Discord OG размер</span>
            </div>
            <div className="rounded-2xl overflow-hidden border border-border shadow-2xl">
              <canvas
                ref={canvasRef}
                className="w-full"
                style={{ aspectRatio: "1200/630" }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Нажми «Скачать PNG» и загрузи картинку в Discord-канал
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
