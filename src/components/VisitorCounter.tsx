import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Users } from 'lucide-react';

const getSessionId = () => {
  let sessionId = sessionStorage.getItem('visitor_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('visitor_session_id', sessionId);
  }
  return sessionId;
};

export const VisitorCounter = () => {
  const [onlineCount, setOnlineCount] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);

  useEffect(() => {
    const sessionId = getSessionId();
    
    // Register/update visitor
    const updateVisitor = async () => {
      await supabase
        .from('site_visitors')
        .upsert(
          { session_id: sessionId, last_seen_at: new Date().toISOString() },
          { onConflict: 'session_id' }
        );
    };

    // Get counts
    const fetchCounts = async () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      // Online count (active in last 5 minutes)
      const { count: online } = await supabase
        .from('site_visitors')
        .select('*', { count: 'exact', head: true })
        .gte('last_seen_at', fiveMinutesAgo);
      
      // Total unique visitors
      const { count: total } = await supabase
        .from('site_visitors')
        .select('*', { count: 'exact', head: true });

      setOnlineCount(online || 0);
      setTotalCount(total || 0);
    };

    updateVisitor();
    fetchCounts();

    // Update presence every 30 seconds
    const interval = setInterval(() => {
      updateVisitor();
      fetchCounts();
    }, 30000);

    // Subscribe to realtime changes
    const channel = supabase
      .channel('visitors-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'site_visitors' },
        () => {
          fetchCounts();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-card/50 backdrop-blur-sm rounded-lg border border-border/50">
      <div className="flex items-center gap-2">
        <div className="relative">
          <Users className="h-4 w-4 text-primary" />
          <span className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full animate-pulse" />
        </div>
        <div className="text-sm">
          <span className="text-green-500 font-semibold">{onlineCount}</span>
          <span className="text-muted-foreground ml-1">онлайн</span>
        </div>
      </div>
      <div className="h-4 w-px bg-border" />
      <div className="text-sm">
        <span className="text-foreground font-semibold">{totalCount}</span>
        <span className="text-muted-foreground ml-1">всего</span>
      </div>
    </div>
  );
};
