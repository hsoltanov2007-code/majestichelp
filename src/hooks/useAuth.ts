import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'admin' | 'moderator' | 'user';

interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  isLoading: boolean;
  isAdmin: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    role: null,
    isLoading: true,
    isAdmin: false,
  });

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setAuthState(prev => ({
          ...prev,
          session,
          user: session?.user ?? null,
        }));

        // Defer fetching profile and role
        if (session?.user) {
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setAuthState(prev => ({
            ...prev,
            profile: null,
            role: null,
            isAdmin: false,
            isLoading: false,
          }));
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthState(prev => ({
        ...prev,
        session,
        user: session?.user ?? null,
      }));

      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // Fetch role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      const role = (roleData?.role as AppRole) || 'user';

      setAuthState(prev => ({
        ...prev,
        profile,
        role,
        isAdmin: role === 'admin',
        isLoading: false,
      }));
    } catch (error) {
      console.error('Error fetching user data:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    // Best-effort: remove any persisted auth tokens so refresh won't restore the session
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (!key) continue;
        if ((key.startsWith('sb-') && key.endsWith('-auth-token')) || key === 'supabase.auth.token') {
          localStorage.removeItem(key);
        }
      }
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const key = sessionStorage.key(i);
        if (!key) continue;
        if ((key.startsWith('sb-') && key.endsWith('-auth-token')) || key === 'supabase.auth.token') {
          sessionStorage.removeItem(key);
        }
      }
    } catch {
      // ignore
    }

    // Clear local state immediately
    setAuthState({
      user: null,
      session: null,
      profile: null,
      role: null,
      isLoading: false,
      isAdmin: false,
    });

    // Tell auth client to drop local session (ignore if it was already gone)
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      // ignore
    }

    return { error: null };
  };

  return {
    ...authState,
    signUp,
    signIn,
    signOut,
  };
}
