import { Header } from "./Header";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>{children}</main>
      <footer className="border-t bg-card py-8 mt-16">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2024 Denver | Majestic RP. Все права защищены.</p>
          <p className="mt-2">
            <a href="https://discord.gg/majestic" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
              Discord Majestic
            </a>
            {" | "}
            <a href="https://discord.gg/statemajestic" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
              Discord State Fraction
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
