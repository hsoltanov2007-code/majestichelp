import { useState, useEffect } from "react";
import { loadArticles, ArticleData } from "@/lib/articles";

// Fallback to local data if remote fails
import { criminalArticles as localCriminalArticles } from "@/data/criminalCode";
import { adminArticles as localAdminArticles } from "@/data/administrativeCode";
import { trafficArticles as localTrafficArticles } from "@/data/trafficCode";
import * as localProcedures from "@/data/procedures";
import { governmentRules as localGovernmentRules } from "@/data/governmentRules";
import { proceduralCode as localProceduralCode } from "@/data/proceduralCode";
import * as localLegalTheory from "@/data/legalTheory";

interface UseArticlesResult {
  data: ArticleData | null;
  isLoading: boolean;
  error: string | null;
  isRemote: boolean;
}

export function useArticles(): UseArticlesResult {
  const [data, setData] = useState<ArticleData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRemote, setIsRemote] = useState(false);

  useEffect(() => {
    loadArticles()
      .then((remoteData) => {
        setData(remoteData);
        setIsRemote(true);
        setIsLoading(false);
      })
      .catch(() => {
        // Fallback to local data
        setData({
          criminalArticles: localCriminalArticles,
          adminArticles: localAdminArticles,
          trafficArticles: localTrafficArticles,
          procedures: localProcedures,
          governmentRules: localGovernmentRules,
          proceduralCode: localProceduralCode,
          legalTheory: localLegalTheory,
        });
        setIsRemote(false);
        setIsLoading(false);
        setError("Используются локальные данные (нет соединения с сервером)");
      });
  }, []);

  return { data, isLoading, error, isRemote };
}
