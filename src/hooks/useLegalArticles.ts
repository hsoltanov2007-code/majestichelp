import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ArticlePart {
  number: number;
  text: string;
  punishment?: string;
}

export interface LegalArticle {
  id: string;
  article_number: string;
  article_title: string;
  description: string;
  parts: ArticlePart[];
  is_void: boolean;
  section_name: string;
  chapter_name: string;
  sort_order: number;
}

interface UseLegalArticlesResult {
  articles: LegalArticle[];
  isLoading: boolean;
  error: string | null;
  totalCount: number;
}

export function useLegalArticles(sourceShortName: string): UseLegalArticlesResult {
  const [articles, setArticles] = useState<LegalArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchArticles() {
      setIsLoading(true);
      setError(null);

      try {
        // First get the source id
        const { data: source, error: sourceError } = await supabase
          .from("code_sources")
          .select("id")
          .eq("short_name", sourceShortName)
          .single();

        if (sourceError || !source) {
          setError("Источник не найден");
          setIsLoading(false);
          return;
        }

        // Fetch all articles for this source
        const { data, error: articlesError } = await supabase
          .from("legal_code_articles")
          .select("*")
          .eq("source_id", source.id)
          .order("sort_order", { ascending: true });

        if (articlesError) {
          setError(articlesError.message);
          setIsLoading(false);
          return;
        }

        const mapped: LegalArticle[] = (data || []).map((row) => ({
          id: row.id,
          article_number: row.article_number,
          article_title: row.article_title || "",
          description: row.description || "",
          parts: (row.parts as unknown as ArticlePart[]) || [],
          is_void: row.is_void || false,
          section_name: row.section_name || "",
          chapter_name: row.chapter_name || "",
          sort_order: row.sort_order || 0,
        }));

        setArticles(mapped);
      } catch (e) {
        setError("Ошибка загрузки статей");
      } finally {
        setIsLoading(false);
      }
    }

    fetchArticles();
  }, [sourceShortName]);

  return { articles, isLoading, error, totalCount: articles.length };
}
