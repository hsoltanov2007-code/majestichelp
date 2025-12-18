import { useState, useEffect } from "react";

export interface FavoriteItem {
  id: string;
  type: "criminal" | "administrative" | "traffic";
  article: string;
  description: string;
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>(() => {
    const stored = localStorage.getItem("denver-favorites");
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem("denver-favorites", JSON.stringify(favorites));
  }, [favorites]);

  const addFavorite = (item: FavoriteItem) => {
    setFavorites((prev) => {
      if (prev.some((f) => f.id === item.id && f.type === item.type)) {
        return prev;
      }
      return [...prev, item];
    });
  };

  const removeFavorite = (id: string, type: FavoriteItem["type"]) => {
    setFavorites((prev) => prev.filter((f) => !(f.id === id && f.type === type)));
  };

  const isFavorite = (id: string, type: FavoriteItem["type"]) => {
    return favorites.some((f) => f.id === id && f.type === type);
  };

  const toggleFavorite = (item: FavoriteItem) => {
    if (isFavorite(item.id, item.type)) {
      removeFavorite(item.id, item.type);
    } else {
      addFavorite(item);
    }
  };

  return { favorites, addFavorite, removeFavorite, isFavorite, toggleFavorite };
}
