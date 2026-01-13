import { Layout } from "@/components/Layout";
import { allLawsList } from "@/data/allLaws";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import hardyLogo from "@/assets/hardy-logo.png";

export default function LawsList() {
  return (
    <Layout>
      <div className="container py-8">
        <div className="flex items-center gap-3 mb-8">
          <img src={hardyLogo} alt="HARDY" className="w-10 h-10 object-contain" />
          <div>
            <h1 className="text-3xl font-bold">Законы</h1>
            <p className="text-muted-foreground">Нормативно-правовые акты штата Сан-Андреас</p>
          </div>
        </div>

        <div className="space-y-2">
          {allLawsList.map((law) => (
            <Link
              key={law.id}
              to={`/laws/${law.id}`}
              className="flex items-center justify-between p-4 bg-card hover:bg-accent/50 border border-border rounded-lg transition-colors group"
            >
              <span className="text-foreground group-hover:text-primary transition-colors">
                {law.title}
              </span>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  );
}
