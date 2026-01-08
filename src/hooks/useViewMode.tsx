import { useState, useEffect, createContext, useContext, ReactNode } from "react";

const VIEW_MODE_KEY = "hardy-view-mode";

type ViewMode = "auto" | "site" | "app";

interface ViewModeContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  effectiveMode: "site" | "app";
  isPWA: boolean;
}

const ViewModeContext = createContext<ViewModeContextType | null>(null);

// Проверка, запущено ли приложение как PWA
const checkIsPWA = () => {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    (window.navigator as any).standalone === true
  );
};

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    const stored = localStorage.getItem(VIEW_MODE_KEY);
    return (stored as ViewMode) || "auto";
  });
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    setIsPWA(checkIsPWA());
  }, []);

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    localStorage.setItem(VIEW_MODE_KEY, mode);
  };

  // Определяем эффективный режим
  const effectiveMode: "site" | "app" =
    viewMode === "auto" ? (isPWA ? "app" : "site") : viewMode;

  return (
    <ViewModeContext.Provider value={{ viewMode, setViewMode, effectiveMode, isPWA }}>
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  const context = useContext(ViewModeContext);
  if (!context) {
    throw new Error("useViewMode must be used within ViewModeProvider");
  }
  return context;
}
