import { useState, useEffect } from "react";

export interface ViewHistoryItem {
  id: string;
  type: "criminal" | "administrative" | "traffic";
  article: string;
  description: string;
  viewedAt: string;
}

const MAX_HISTORY_ITEMS = 20;

export function useViewHistory() {
  const [history, setHistory] = useState<ViewHistoryItem[]>(() => {
    const stored = localStorage.getItem("denver-view-history");
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem("denver-view-history", JSON.stringify(history));
  }, [history]);

  const addToHistory = (item: Omit<ViewHistoryItem, "viewedAt">) => {
    setHistory((prev) => {
      const filtered = prev.filter(
        (h) => !(h.id === item.id && h.type === item.type)
      );
      const newItem: ViewHistoryItem = {
        ...item,
        viewedAt: new Date().toISOString(),
      };
      return [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    });
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const removeFromHistory = (id: string, type: ViewHistoryItem["type"]) => {
    setHistory((prev) => prev.filter((h) => !(h.id === id && h.type === type)));
  };

  return { history, addToHistory, clearHistory, removeFromHistory };
}
