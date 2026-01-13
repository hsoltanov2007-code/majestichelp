import { useEffect, useState, useCallback } from "react";

interface UseGlobalSearchResult {
  isSearchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  toggleSearch: () => void;
}

// Create a global event for Ctrl+F to open the bot
const OPEN_BOT_EVENT = "open-hardy-bot";

export function dispatchOpenBot() {
  window.dispatchEvent(new CustomEvent(OPEN_BOT_EVENT));
}

export function useOpenBotListener(callback: () => void) {
  useEffect(() => {
    const handler = () => callback();
    window.addEventListener(OPEN_BOT_EVENT, handler);
    return () => window.removeEventListener(OPEN_BOT_EVENT, handler);
  }, [callback]);
}

export function useGlobalSearch(): UseGlobalSearchResult {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const openSearch = useCallback(() => setIsSearchOpen(true), []);
  const closeSearch = useCallback(() => setIsSearchOpen(false), []);
  const toggleSearch = useCallback(() => setIsSearchOpen((prev) => !prev), []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        // Dispatch event to open Hardy bot instead
        dispatchOpenBot();
      }
      if (e.key === "Escape") {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return { isSearchOpen, openSearch, closeSearch, toggleSearch };
}
