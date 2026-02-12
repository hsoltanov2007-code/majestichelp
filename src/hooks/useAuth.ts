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
  isModerator: boolean;
  isSubscriber: boolean;
  canManage: boolean; // admin or moderator
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    role: null,
    isLoading: true,
    isAdmin: false,
    isModerator: false,
    isSubscriber: false,
    canManage: false,
  });

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setAuthState(prev => ({
            ...prev,
            session,
            user: session.user,
          }));
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setAuthState(prev => ({
            ...prev,
            profile: null,
            role: null,
            isAdmin: false,
            isModerator: false,
            isSubscriber: false,
            canManage: false,
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

      // Fetch roles (user may have multiple: admin + subscriber)
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('role, expires_at')
        .eq('user_id', userId);

      // Determine primary role: admin > moderator > subscriber > user
      let role: AppRole = 'user';
      let isSubscriber = false;
      if (rolesData && rolesData.length > 0) {
        for (const r of rolesData) {
          const roleName = r.role as string;
          if (roleName === 'admin') { role = 'admin' as AppRole; break; }
          if (roleName === 'moderator') { role = 'moderator' as AppRole; }
          if (roleName === 'subscriber') {
            const expiresAt = (r as any).expires_at ? new Date((r as any).expires_at) : null;
            if (!expiresAt || expiresAt > new Date()) {
              isSubscriber = true;
            }
          }
        }
        if ((role as string) !== 'admin' && (role as string) !== 'moderator' && isSubscriber) {
          role = 'subscriber' as AppRole;
        }
      }
      const isAdmin = role === 'admin';
      const isModerator = role === 'moderator';

      setAuthState(prev => ({
        ...prev,
        profile,
        role,
        isAdmin,
        isModerator,
        isSubscriber,
        canManage: isAdmin || isModerator,
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
      isModerator: false,
      isSubscriber: false,
      canManage: false,
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
