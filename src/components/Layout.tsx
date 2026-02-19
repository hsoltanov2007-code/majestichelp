import { Header } from "./Header";
import { Footer } from "./Footer";
import { ScrollToTop } from "./ScrollToTop";
import { AdBanner } from "./AdBanner";
import { TelegramBottomNav } from "./TelegramBottomNav";
import { TelegramTopBar } from "./TelegramTopBar";
import { useTelegramApp } from "@/hooks/useTelegramApp";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { isTelegram } = useTelegramApp();

  return (
    <div className="relative z-10 min-h-screen bg-background/0 flex flex-col">
      {isTelegram ? <TelegramTopBar /> : <Header />}
      <main className="flex-1">{children}</main>
      {!isTelegram && <Footer />}
      {!isTelegram && <AdBanner />}
      <ScrollToTop />
      <TelegramBottomNav />
    </div>
  );
}

