import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTelegramApp } from "@/hooks/useTelegramApp";
import { Session } from "@supabase/supabase-js";

interface TelegramAuthContextType {
  isAuthenticating: boolean;
  telegramAuthDone: boolean;
  error: string | null;
}

const TelegramAuthContext = createContext<TelegramAuthContextType>({
  isAuthenticating: false,
  telegramAuthDone: false,
  error: null,
});

export function TelegramAuthProvider({ children }: { children: ReactNode }) {
  const { isTelegram, isReady, initData } = useTelegramApp();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [telegramAuthDone, setTelegramAuthDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady || !isTelegram || !initData) {
      if (isReady) setTelegramAuthDone(true);
      return;
    }

    const attemptAuth = async () => {
      setIsAuthenticating(true);
      try {
        // Check if already authenticated
        const { data: { session } } = await supabase.auth.getSession();
        
        // If session exists and it's a Telegram session, skip re-auth
        if (session?.user?.email?.endsWith("@telegram.hardy.local")) {
          setTelegramAuthDone(true);
          setIsAuthenticating(false);
          return;
        }

        const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
        const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

        const res = await fetch(`${SUPABASE_URL}/functions/v1/telegram-auth`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ initData }),
        });

        const data = await res.json();

        if (!res.ok || data.error) {
          throw new Error(data.error || "Auth failed");
        }

        // Set the session from the response
        if (data.session) {
          await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          });
        }

        setTelegramAuthDone(true);
      } catch (err) {
        console.error("Telegram auth error:", err);
        setError(String(err));
        setTelegramAuthDone(true); // Allow app to continue even if auth fails
      } finally {
        setIsAuthenticating(false);
      }
    };

    attemptAuth();
  }, [isReady, isTelegram, initData]);

  return (
    <TelegramAuthContext.Provider value={{ isAuthenticating, telegramAuthDone, error }}>
      {children}
    </TelegramAuthContext.Provider>
  );
}

export function useTelegramAuth() {
  return useContext(TelegramAuthContext);
}
