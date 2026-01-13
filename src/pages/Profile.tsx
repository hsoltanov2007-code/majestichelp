import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { User, Crown, Save, Loader2, Mail, Eye, EyeOff, Shield, Calendar, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function Profile() {
  const navigate = useNavigate();
  const { user, profile, role, isAdmin, isLoading: authLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showEmail, setShowEmail] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username);
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user || !username.trim()) return;

    if (username.trim().length < 2) {
      toast.error('Никнейм должен быть минимум 2 символа');
      return;
    }

    if (username.trim().length > 30) {
      toast.error('Никнейм должен быть максимум 30 символов');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username: username.trim() })
        .eq('id', user.id);

      if (error) {
        if (error.code === '23505') {
          toast.error('Этот никнейм уже занят');
        } else {
          throw error;
        }
        return;
      }

      toast.success('Профиль обновлён');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Ошибка при сохранении');
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleBadge = () => {
    switch (role) {
      case 'admin':
        return (
          <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white border-0 shadow-lg shadow-red-500/25">
            <Crown className="mr-1.5 h-3.5 w-3.5" />
            Администратор
          </Badge>
        );
      case 'moderator':
        return (
          <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 shadow-lg shadow-blue-500/25">
            <Shield className="mr-1.5 h-3.5 w-3.5" />
            Модератор
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="bg-muted/50">
            <User className="mr-1.5 h-3.5 w-3.5" />
            Пользователь
          </Badge>
        );
    }
  };

  const getRoleIcon = () => {
    switch (role) {
      case 'admin':
        return <Crown className="h-8 w-8 text-red-400" />;
      case 'moderator':
        return <Shield className="h-8 w-8 text-blue-400" />;
      default:
        return <User className="h-8 w-8 text-primary" />;
    }
  };

  const getRoleGradient = () => {
    switch (role) {
      case 'admin':
        return 'from-red-500/20 via-orange-500/10 to-transparent';
      case 'moderator':
        return 'from-blue-500/20 via-cyan-500/10 to-transparent';
      default:
        return 'from-primary/20 via-primary/5 to-transparent';
    }
  };

  const maskEmail = (email: string) => {
    const [local, domain] = email.split('@');
    if (local.length <= 2) return '••••@' + domain;
    return local[0] + '••••' + local[local.length - 1] + '@' + domain;
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-lg">
          <Card className="overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-primary/20 to-primary/5" />
            <CardContent className="pt-0 -mt-12 space-y-6">
              <Skeleton className="h-24 w-24 rounded-full mx-auto" />
              <Skeleton className="h-6 w-32 mx-auto" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-lg">
        <Card className="overflow-hidden border-0 shadow-2xl bg-card/80 backdrop-blur-xl">
          {/* Header gradient */}
          <div className={`h-32 bg-gradient-to-br ${getRoleGradient()} relative`}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_50%)]" />
            <div className="absolute top-4 right-4">
              <Settings className="h-5 w-5 text-muted-foreground/50" />
            </div>
          </div>
          
          <CardContent className="pt-0 -mt-14 space-y-6 pb-8">
            {/* Avatar */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="h-28 w-28 rounded-full bg-gradient-to-br from-card to-muted flex items-center justify-center border-4 border-card shadow-xl">
                  {getRoleIcon()}
                </div>
                {role === 'admin' && (
                  <div className="absolute -top-1 -right-1 h-8 w-8 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/30">
                    <Crown className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
              
              <h1 className="mt-4 text-2xl font-bold text-foreground">
                {profile?.username || 'Пользователь'}
              </h1>
              
              <div className="mt-2">
                {getRoleBadge()}
              </div>
            </div>

            {/* Info cards */}
            <div className="grid gap-3">
              {/* Email spoiler */}
              <div className="p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-border transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Почта</p>
                      <p className="font-medium text-foreground">
                        {showEmail ? user?.email : maskEmail(user?.email || '')}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowEmail(!showEmail)}
                    className="h-9 w-9 rounded-lg hover:bg-primary/10"
                  >
                    {showEmail ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Registration date */}
              <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Регистрация</p>
                    <p className="font-medium text-foreground">
                      {user?.created_at 
                        ? format(new Date(user.created_at), 'd MMMM yyyy', { locale: ru })
                        : 'Неизвестно'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Username edit */}
            <div className="space-y-3 pt-2">
              <Label htmlFor="username" className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Никнейм
              </Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Введите никнейм"
                maxLength={30}
                className="h-12 bg-muted/30 border-border/50 focus:border-primary/50 rounded-xl"
              />
              <p className="text-xs text-muted-foreground">
                Этот никнейм будет отображаться на форуме
              </p>
            </div>

            <Button
              onClick={handleSave}
              disabled={isSaving || !username.trim() || username === profile?.username}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25 transition-all duration-300"
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Save className="mr-2 h-5 w-5" />
              )}
              Сохранить изменения
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
