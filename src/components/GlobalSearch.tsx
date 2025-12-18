import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Scale, Car, FileText, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { criminalArticles } from "@/data/criminalCode";
import { adminArticles } from "@/data/administrativeCode";
import { trafficArticles } from "@/data/trafficCode";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  type: "criminal" | "administrative" | "traffic";
  article: string;
  description: string;
  path: string;
}

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const searchLower = query.toLowerCase();
    const allResults: SearchResult[] = [];

    criminalArticles.forEach((article) => {
      if (
        article.article.toLowerCase().includes(searchLower) ||
        article.description.toLowerCase().includes(searchLower)
      ) {
        allResults.push({
          id: article.id,
          type: "criminal",
          article: article.article,
          description: article.description,
          path: `/criminal-code?article=${article.id}`,
        });
      }
    });

    adminArticles.forEach((article) => {
      if (
        article.article.toLowerCase().includes(searchLower) ||
        article.description.toLowerCase().includes(searchLower)
      ) {
        allResults.push({
          id: article.id,
          type: "administrative",
          article: article.article,
          description: article.description,
          path: `/administrative-code?article=${article.id}`,
        });
      }
    });

    trafficArticles.forEach((article) => {
      if (
        article.article.toLowerCase().includes(searchLower) ||
        article.description.toLowerCase().includes(searchLower)
      ) {
        allResults.push({
          id: article.id,
          type: "traffic",
          article: article.article,
          description: article.description,
          path: `/traffic-code?article=${article.id}`,
        });
      }
    });

    setResults(allResults.slice(0, 10));
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      navigate(results[selectedIndex].path);
      setQuery("");
      setIsOpen(false);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const getIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "criminal":
        return <Scale className="h-4 w-4 text-destructive" />;
      case "administrative":
        return <FileText className="h-4 w-4 text-primary" />;
      case "traffic":
        return <Car className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getTypeLabel = (type: SearchResult["type"]) => {
    switch (type) {
      case "criminal":
        return "УК";
      case "administrative":
        return "АК";
      case "traffic":
        return "ДК";
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Поиск по всем кодексам..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-10"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-2 max-h-96 overflow-auto rounded-lg border bg-popover p-2 shadow-lg">
          {results.map((result, index) => (
            <button
              key={`${result.type}-${result.id}`}
              onClick={() => {
                navigate(result.path);
                setQuery("");
                setIsOpen(false);
              }}
              className={cn(
                "flex w-full items-start gap-3 rounded-md p-3 text-left transition-colors",
                index === selectedIndex
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-muted"
              )}
            >
              <div className="mt-0.5">{getIcon(result.type)}</div>
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{result.article}</span>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium">
                    {getTypeLabel(result.type)}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">
                  {result.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && query.length >= 2 && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-2 rounded-lg border bg-popover p-4 shadow-lg">
          <p className="text-center text-sm text-muted-foreground">
            Ничего не найдено
          </p>
        </div>
      )}
    </div>
  );
}
