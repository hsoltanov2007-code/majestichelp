import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTelegramApp } from '@/hooks/useTelegramApp';
import { Layout } from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { User, Crown, Save, Loader2, Mail, Eye, EyeOff, Shield, Calendar, Settings, Camera, Upload, Unlink, CheckCircle } from 'lucide-react';
import { TelegramLinkSection } from '@/components/TelegramLinkSection';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';


// Telegram SVG icon
const TelegramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

export default function Profile() {
  const navigate = useNavigate();
  const { user, profile, role, isAdmin, isLoading: authLoading } = useAuth();
  const { isTelegram, user: tgUser } = useTelegramApp();
  const [username, setUsername] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username);
      setAvatarUrl(profile.avatar_url);
    }
  }, [profile]);

  // In Telegram — use TG avatar as display avatar if no custom one set
  const displayAvatar = avatarUrl || (isTelegram && tgUser?.photo_url ? tgUser.photo_url : null);
  const isTelegramSession = user?.email?.endsWith('@telegram.hardy.local');

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Можно загружать только изображения');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Максимальный размер файла — 2 МБ');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      await supabase.storage
        .from('avatars')
        .remove([`${user.id}/avatar.png`, `${user.id}/avatar.jpg`, `${user.id}/avatar.jpeg`, `${user.id}/avatar.webp`]);

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const urlWithCacheBuster = `${publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlWithCacheBuster })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setAvatarUrl(urlWithCacheBuster);
      toast.success('Аватар обновлён');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Ошибка при загрузке аватара');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

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

  const handleUnlinkTelegram = async () => {
    if (!user) return;
    setIsUnlinking(true);
    try {
      await supabase
        .from('profiles')
        .update({ telegram_chat_id: null } as any)
        .eq('id', user.id);

      toast.success('Telegram отвязан от аккаунта');
      window.location.reload();
    } catch (err) {
      toast.error('Ошибка при отвязке Telegram');
    } finally {
      setIsUnlinking(false);
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
      case 'admin': return <Crown className="h-8 w-8 text-red-400" />;
      case 'moderator': return <Shield className="h-8 w-8 text-blue-400" />;
      default: return <User className="h-8 w-8 text-primary" />;
    }
  };

  const getRoleGradient = () => {
    switch (role) {
      case 'admin': return 'from-red-500/20 via-orange-500/10 to-transparent';
      case 'moderator': return 'from-blue-500/20 via-cyan-500/10 to-transparent';
      default: return 'from-primary/20 via-primary/5 to-transparent';
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
            {/* Telegram badge in header */}
            {isTelegramSession && (
              <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-blue-500/20 backdrop-blur-sm border border-blue-500/30 rounded-full px-3 py-1">
                <TelegramIcon className="h-3.5 w-3.5 text-blue-400" />
                <span className="text-xs text-blue-400 font-medium">Telegram аккаунт</span>
              </div>
            )}
            <div className="absolute top-4 right-4">
              <Settings className="h-5 w-5 text-muted-foreground/50" />
            </div>
          </div>

          <CardContent className="pt-0 -mt-14 space-y-6 pb-8">
            {/* Avatar */}
            <div className="flex flex-col items-center">
              <div className="relative group">
                <div className="h-28 w-28 rounded-full bg-gradient-to-br from-card to-muted flex items-center justify-center border-4 border-card shadow-xl overflow-hidden">
                  {displayAvatar ? (
                    <img
                      src={displayAvatar}
                      alt="Avatar"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    getRoleIcon()
                  )}
                </div>

                {/* Upload overlay — only for non-telegram avatar */}
                {!isTelegramSession && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isUploadingAvatar ? (
                      <Loader2 className="h-8 w-8 text-white animate-spin" />
                    ) : (
                      <Camera className="h-8 w-8 text-white" />
                    )}
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />

                {role === 'admin' && (
                  <div className="absolute -top-1 -right-1 h-8 w-8 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/30">
                    <Crown className="h-4 w-4 text-white" />
                  </div>
                )}

                {/* Telegram indicator on avatar */}
                {isTelegramSession && (
                  <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center shadow-lg border-2 border-card">
                    <TelegramIcon className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>

              {!isTelegramSession && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="mt-2 text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                >
                  <Upload className="h-3 w-3" />
                  Изменить аватар
                </button>
              )}

              {isTelegramSession && tgUser?.photo_url && (
                <p className="mt-2 text-xs text-blue-400 flex items-center gap-1">
                  <TelegramIcon className="h-3 w-3" />
                  Аватар из Telegram
                </p>
              )}

              <h1 className="mt-3 text-2xl font-bold text-foreground">
                {tgUser ? (tgUser.username ? `@${tgUser.username}` : tgUser.first_name) : (profile?.username || 'Пользователь')}
              </h1>

              {tgUser?.username && (
                <p className="text-sm text-muted-foreground">{tgUser.first_name}{tgUser.last_name ? ` ${tgUser.last_name}` : ''}</p>
              )}

              <div className="mt-2">
                {getRoleBadge()}
              </div>
            </div>

            {/* Telegram session info block */}
            {isTelegramSession ? (
              <div className="space-y-3">
                {/* Telegram account card */}
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <TelegramIcon className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-xs text-blue-400/70 uppercase tracking-wider">Telegram ID</p>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">
                            {tgUser?.username ? `@${tgUser.username}` : tgUser?.first_name || 'Неизвестно'}
                          </p>
                          <Badge className="bg-blue-500/20 text-blue-400 border-0 text-xs">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Активен
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleUnlinkTelegram}
                      disabled={isUnlinking}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
                      title="Отвязать Telegram"
                    >
                      {isUnlinking
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Unlink className="h-4 w-4" />
                      }
                      <span className="text-xs">Отвязать</span>
                    </Button>
                  </div>
                </div>

                {/* Telegram user details */}
                {tgUser && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                      <p className="text-xs text-muted-foreground">Имя</p>
                      <p className="text-sm font-medium truncate">{tgUser.first_name}{tgUser.last_name ? ` ${tgUser.last_name}` : ''}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                      <p className="text-xs text-muted-foreground">Username</p>
                      <p className="text-sm font-medium truncate">{tgUser.username ? `@${tgUser.username}` : '—'}</p>
                    </div>
                  </div>
                )}

                {/* Registration date */}
                <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">В системе с</p>
                      <p className="font-medium text-foreground">
                        {user?.created_at
                          ? format(new Date(user.created_at), 'd MMMM yyyy', { locale: ru })
                          : 'Неизвестно'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Standard email account info */
              <div className="grid gap-3">
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
                      {showEmail
                        ? <EyeOff className="h-4 w-4 text-muted-foreground" />
                        : <Eye className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                  </div>
                </div>

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
            )}

            {/* Telegram link section — only for non-telegram accounts */}
            {!isTelegramSession && user && (
              <TelegramLinkSection
                userId={user.id}
                telegramChatId={(profile as any)?.telegram_chat_id ?? null}
                onUpdate={() => window.location.reload()}
              />
            )}

            {/* Username edit */}
            <div className="space-y-3 pt-2">
              <Label htmlFor="username" className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Никнейм на сайте
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
