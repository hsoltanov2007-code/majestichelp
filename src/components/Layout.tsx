import { Header } from "./Header";
import { Footer } from "./Footer";
import { ScrollToTop } from "./ScrollToTop";
import Snowfall from "./Snowfall";
import { AdBanner } from "./AdBanner";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="relative z-10 min-h-screen bg-background/0 flex flex-col">
      <Snowfall />
      <Header />
      <main className="flex-1">{children}</main>
      <AdBanner />
      <Footer />
      <ScrollToTop />
    </div>
  );
}
