import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Scale, FileText, Car, Users, BookOpen, HelpCircle, Search, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import ServerStats from "@/components/ServerStats";

const sections = [
  { icon: Scale, title: "Уголовный кодекс", description: "Все статьи УК с розыском и штрафами", path: "/criminal-code", color: "bg-destructive/10 text-destructive" },
  { icon: FileText, title: "Административный кодекс", description: "Административные правонарушения", path: "/administrative-code", color: "bg-orange-500/10 text-orange-500" },
  { icon: Car, title: "Дорожный кодекс", description: "Правила дорожного движения", path: "/traffic-code", color: "bg-primary/10 text-primary" },
  { icon: Users, title: "Процедуры", description: "Инструкции для госслужащих", path: "/procedures", color: "bg-green-500/10 text-green-500" },
  { icon: Shield, title: "Правила ГО", description: "Правила государственных организаций", path: "/government-rules", color: "bg-blue-500/10 text-blue-500" },
  { icon: BookOpen, title: "Юридическая справка", description: "Теория уголовного права", path: "/legal-reference", color: "bg-accent/10 text-accent" },
  { icon: HelpCircle, title: "Инструкции", description: "Как пользоваться порталом", path: "/instructions", color: "bg-muted text-muted-foreground" },
];

export default function Index() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/criminal-code?search=${encodeURIComponent(search)}`);
    }
  };

  return (
    <Layout>
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="container relative">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Официальный портал <span className="text-accent">Denver</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Majestic RP — здесь собраны все законы, правила и процедуры штата Denver
            </p>
            
            <form onSubmit={handleSearch} className="flex gap-2 max-w-xl mx-auto mt-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Поиск по законам..."
                  className="pl-10 h-12 text-base"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </form>
          </div>
        </div>
      </section>

      <section className="container py-12">
        <div className="grid gap-6 lg:grid-cols-4">
          <div className="lg:col-span-3 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sections.map((section) => (
              <Link key={section.path} to={section.path}>
                <Card className="h-full transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer group">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${section.color} mb-2`}>
                      <section.icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="group-hover:text-accent transition-colors">{section.title}</CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
          <div className="lg:col-span-1">
            <ServerStats />
          </div>
        </div>
      </section>
    </Layout>
  );
}
