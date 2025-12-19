import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { User, Crown, Save, Loader2 } from 'lucide-react';

export default function Profile() {
  const navigate = useNavigate();
  const { user, profile, role, isAdmin, isLoading: authLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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

    // Validate username
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
          <Badge className="bg-red-500/20 text-red-500 border-red-500/30">
            <Crown className="mr-1 h-3 w-3" />
            Администратор
          </Badge>
        );
      case 'moderator':
        return (
          <Badge variant="secondary">
            Модератор
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            Пользователь
          </Badge>
        );
    }
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-md">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
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
      <div className="container mx-auto px-4 py-8 max-w-md">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  Мой профиль
                  {isAdmin && <Crown className="h-5 w-5 text-red-500" />}
                </CardTitle>
                <CardDescription>{user?.email}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Роль:</span>
              {getRoleBadge()}
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Никнейм</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Введите никнейм"
                maxLength={30}
              />
              <p className="text-xs text-muted-foreground">
                Этот никнейм будет отображаться на форуме
              </p>
            </div>

            <Button
              onClick={handleSave}
              disabled={isSaving || !username.trim() || username === profile?.username}
              className="w-full"
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Сохранить
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
