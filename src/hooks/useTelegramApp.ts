import { useEffect, useState, useCallback } from "react";
import WebApp from "@twa-dev/sdk";

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
}

interface TelegramAppState {
  isReady: boolean;
  isTelegram: boolean;
  user: TelegramUser | null;
  initData: string;
  colorScheme: "light" | "dark";
}

export function useTelegramApp() {
  const [state, setState] = useState<TelegramAppState>({
    isReady: false,
    isTelegram: false,
    user: null,
    initData: "",
    colorScheme: "dark",
  });

  useEffect(() => {
    // Detect if running inside Telegram WebApp
    const tgWindow = window as unknown as { Telegram?: { WebApp?: { initData?: string } } };
    const isTg = Boolean(
      tgWindow.Telegram?.WebApp?.initData &&
      tgWindow.Telegram.WebApp.initData.length > 0
    );

    if (isTg) {
      WebApp.ready();
      WebApp.expand();

      // Set Telegram theme colors
      WebApp.setHeaderColor("#0d1117");
      WebApp.setBackgroundColor("#0d1117");

      const tgUser = WebApp.initDataUnsafe?.user as TelegramUser | undefined;

      setState({
        isReady: true,
        isTelegram: true,
        user: tgUser ?? null,
        initData: WebApp.initData,
        colorScheme: WebApp.colorScheme as "light" | "dark",
      });
    } else {
      setState(prev => ({ ...prev, isReady: true, isTelegram: false }));
    }
  }, []);

  const showAlert = useCallback((message: string) => {
    if (state.isTelegram) {
      WebApp.showAlert(message);
    } else {
      alert(message);
    }
  }, [state.isTelegram]);

  const showConfirm = useCallback((message: string): Promise<boolean> => {
    if (state.isTelegram) {
      return new Promise((resolve) => {
        WebApp.showConfirm(message, resolve);
      });
    }
    return Promise.resolve(window.confirm(message));
  }, [state.isTelegram]);

  const hapticFeedback = useCallback((type: "impact" | "notification" | "selection" = "impact") => {
    if (!state.isTelegram) return;
    if (type === "impact") WebApp.HapticFeedback.impactOccurred("medium");
    if (type === "notification") WebApp.HapticFeedback.notificationOccurred("success");
    if (type === "selection") WebApp.HapticFeedback.selectionChanged();
  }, [state.isTelegram]);

  const close = useCallback(() => {
    if (state.isTelegram) WebApp.close();
  }, [state.isTelegram]);

  return {
    ...state,
    showAlert,
    showConfirm,
    hapticFeedback,
    close,
    WebApp: state.isTelegram ? WebApp : null,
  };
}
