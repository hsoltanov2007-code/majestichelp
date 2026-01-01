import { useState, useEffect, type ReactNode, type FormEvent } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, Shield, Mail, CheckCircle, ArrowLeft, KeyRound, Lock, Home, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

function AuthBackground({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-hero-pattern" />
      <div className="absolute inset-0 bg-dots-pattern opacity-20" />

      {/* Animated orbs */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float" />
      <div
        className="absolute bottom-20 right-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float"
        style={{ animationDelay: '2s' }}
      />
      <div
        className="absolute top-1/2 left-10 w-48 h-48 bg-accent/10 rounded-full blur-2xl animate-float"
        style={{ animationDelay: '1s' }}
      />

      {/* Content */}
      <div className="relative flex items-center justify-center min-h-screen px-4 py-12">
        {children}
      </div>

      {/* Home link */}
      <Link
        to="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors glass px-4 py-2 rounded-xl"
      >
        <Home className="h-4 w-4" />
        <span className="text-sm font-medium">На главную</span>
      </Link>
    </div>
  );
}

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading: authLoading, signIn, signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetSent, setShowResetSent] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event);
      if (event === 'PASSWORD_RECOVERY') {
        setShowNewPassword(true);
      }
    });

    const checkHashForRecovery = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const type = hashParams.get('type');
      
      if (type === 'recovery' && accessToken) {
        const refreshToken = hashParams.get('refresh_token') || '';
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        
        if (!error) {
          setShowNewPassword(true);
          window.history.replaceState(null, '', window.location.pathname);
        } else {
          console.log('Session error:', error);
          toast.error('Ссылка для сброса пароля недействительна или устарела');
        }
      }
    };

    checkHashForRecovery();

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user && !authLoading && !showNewPassword) {
      navigate('/forum');
    }
  }, [user, authLoading, navigate, showNewPassword]);

  useEffect(() => {
    const confirmed = searchParams.get('confirmed');
    if (confirmed === 'true') {
      toast.success('Email подтверждён! Теперь войдите в аккаунт.');
    }
  }, [searchParams]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast.error('Заполните все поля');
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setIsLoading(false);

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        toast.error('Неверный email или пароль');
      } else if (error.message.includes('Email not confirmed')) {
        toast.error('Email не подтверждён. Проверьте почту и перейдите по ссылке.');
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success('Успешный вход!');
      navigate('/forum');
    }
  };

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    if (!signupEmail || !signupPassword || !signupConfirmPassword) {
      toast.error('Заполните все поля');
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      toast.error('Пароли не совпадают');
      return;
    }

    if (signupPassword.length < 6) {
      toast.error('Пароль должен быть не менее 6 символов');
      return;
    }

    setIsLoading(true);
    const { error } = await signUp(signupEmail, signupPassword);
    setIsLoading(false);

    if (error) {
      if (error.message.includes('already registered')) {
        toast.error('Этот email уже зарегистрирован');
      } else {
        toast.error(error.message);
      }
    } else {
      setPendingEmail(signupEmail);
      setShowConfirmation(true);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error('Введите email');
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/auth?reset=true`,
    });
    setIsLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      setPendingEmail(resetEmail);
      setShowResetSent(true);
    }
  };

  const handleUpdatePassword = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || !confirmNewPassword) {
      toast.error('Заполните все поля');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error('Пароли не совпадают');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Пароль должен быть не менее 6 символов');
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setIsLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Пароль успешно изменён!');
      setShowNewPassword(false);
      setNewPassword('');
      setConfirmNewPassword('');
      navigate('/forum');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-accent" />
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  // Background component moved outside (AuthBackground) to prevent remount on every keystroke


  // New password form
  if (showNewPassword) {
    return (
      <AuthBackground>
        <Card className="w-full max-w-md glass border-0 opacity-0 animate-scale-up">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5">
              <Lock className="h-8 w-8 text-emerald-500" />
            </div>
            <CardTitle className="text-3xl font-bold">Новый пароль</CardTitle>
            <CardDescription className="text-base">
              Придумайте новый надёжный пароль для вашего аккаунта
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdatePassword} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="new-password">Новый пароль</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Минимум 6 символов"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isLoading}
                  className="h-12 bg-background/50 border-border/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-new-password">Подтвердите пароль</Label>
                <Input
                  id="confirm-new-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  disabled={isLoading}
                  className="h-12 bg-background/50 border-border/50"
                />
              </div>
              <Button type="submit" className="w-full h-12 text-base bg-accent hover:bg-accent/90" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  'Сохранить новый пароль'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </AuthBackground>
    );
  }

  // Password reset sent confirmation
  if (showResetSent) {
    return (
      <AuthBackground>
        <Card className="w-full max-w-md glass border-0 opacity-0 animate-scale-up">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-500/5">
              <Mail className="h-8 w-8 text-blue-500" />
            </div>
            <CardTitle className="text-3xl font-bold">Проверьте почту</CardTitle>
            <CardDescription className="text-base">
              Мы отправили ссылку для сброса пароля на
            </CardDescription>
            <p className="font-semibold text-foreground mt-2 text-lg">{pendingEmail}</p>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="bg-muted/50 rounded-xl p-5 space-y-3">
              <p className="flex items-start gap-3 text-sm">
                <CheckCircle className="h-5 w-5 mt-0.5 text-blue-500 shrink-0" />
                <span>Перейдите по ссылке в письме для сброса пароля</span>
              </p>
              <p className="flex items-start gap-3 text-sm">
                <CheckCircle className="h-5 w-5 mt-0.5 text-blue-500 shrink-0" />
                <span>Ссылка действительна в течение 1 часа</span>
              </p>
            </div>
            
            <Button
              variant="outline"
              className="w-full h-12 glass"
              onClick={() => {
                setShowResetSent(false);
                setShowResetPassword(false);
                setPendingEmail('');
                setResetEmail('');
              }}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Вернуться к входу
            </Button>
            
            <p className="text-xs text-center text-muted-foreground">
              Не получили письмо? Проверьте папку "Спам"
            </p>
          </CardContent>
        </Card>
      </AuthBackground>
    );
  }

  // Password reset form
  if (showResetPassword) {
    return (
      <AuthBackground>
        <Card className="w-full max-w-md glass border-0 opacity-0 animate-scale-up">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5">
              <KeyRound className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold">Сброс пароля</CardTitle>
            <CardDescription className="text-base">
              Введите email для получения ссылки сброса пароля
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="your@email.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  disabled={isLoading}
                  className="h-12 bg-background/50 border-border/50"
                />
              </div>
              <Button type="submit" className="w-full h-12 text-base bg-accent hover:bg-accent/90" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Отправка...
                  </>
                ) : (
                  'Отправить ссылку'
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setShowResetPassword(false)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Назад к входу
              </Button>
            </form>
          </CardContent>
        </Card>
      </AuthBackground>
    );
  }

  // Email sent confirmation screen
  if (showConfirmation) {
    return (
      <AuthBackground>
        <Card className="w-full max-w-md glass border-0 opacity-0 animate-scale-up">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 animate-pulse-glow">
              <Mail className="h-8 w-8 text-emerald-500" />
            </div>
            <CardTitle className="text-3xl font-bold">Проверьте почту</CardTitle>
            <CardDescription className="text-base">
              Мы отправили ссылку для подтверждения на
            </CardDescription>
            <p className="font-semibold text-foreground mt-2 text-lg">{pendingEmail}</p>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="bg-muted/50 rounded-xl p-5 space-y-3">
              <p className="flex items-start gap-3 text-sm">
                <CheckCircle className="h-5 w-5 mt-0.5 text-emerald-500 shrink-0" />
                <span>Перейдите по ссылке в письме для подтверждения email</span>
              </p>
              <p className="flex items-start gap-3 text-sm">
                <CheckCircle className="h-5 w-5 mt-0.5 text-emerald-500 shrink-0" />
                <span>После подтверждения вернитесь и войдите с паролем</span>
              </p>
            </div>
            
            <Button
              variant="outline"
              className="w-full h-12 glass"
              onClick={() => {
                setShowConfirmation(false);
                setPendingEmail('');
              }}
            >
              Вернуться к входу
            </Button>
            
            <p className="text-xs text-center text-muted-foreground">
              Не получили письмо? Проверьте папку "Спам"
            </p>
          </CardContent>
        </Card>
      </AuthBackground>
    );
  }

  // Main login/signup form
  return (
    <AuthBackground>
      <div className="w-full max-w-md space-y-6">
        {/* Logo/Brand */}
        <div className="text-center animate-fade-up">
          <Link to="/" className="inline-flex items-center gap-3 group mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent via-accent to-accent/80 flex items-center justify-center shadow-xl shadow-accent/30 group-hover:shadow-accent/50 transition-all group-hover:scale-105">
              <span className="text-2xl text-accent-foreground font-bold">H</span>
            </div>
          </Link>
          <h1 className="text-3xl font-bold mb-2">HARDY Portal</h1>
          <p className="text-muted-foreground">Войдите или создайте аккаунт</p>
        </div>

        {/* Auth Card */}
        <Card className="glass border-0 animate-fade-up stagger-1">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5">
              <Shield className="h-7 w-7 text-accent" />
            </div>
            <CardTitle className="text-2xl">Добро пожаловать</CardTitle>
            <CardDescription>
              Войдите для участия в обсуждениях и доступа к избранному
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 glass">
                <TabsTrigger value="login" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                  Вход
                </TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                  Регистрация
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-5">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="your@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      disabled={isLoading}
                      className="h-12 bg-background/50 border-border/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password">Пароль</Label>
                      <button
                        type="button"
                        onClick={() => setShowResetPassword(true)}
                        className="text-xs text-accent hover:text-accent/80 transition-colors"
                      >
                        Забыли пароль?
                      </button>
                    </div>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      disabled={isLoading}
                      className="h-12 bg-background/50 border-border/50"
                    />
                  </div>
                  <Button type="submit" className="w-full h-12 text-base bg-accent hover:bg-accent/90" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Вход...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Войти
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-5">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your@email.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      disabled={isLoading}
                      className="h-12 bg-background/50 border-border/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Пароль</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Минимум 6 символов"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      disabled={isLoading}
                      className="h-12 bg-background/50 border-border/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm">Подтвердите пароль</Label>
                    <Input
                      id="signup-confirm"
                      type="password"
                      placeholder="••••••••"
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      disabled={isLoading}
                      className="h-12 bg-background/50 border-border/50"
                    />
                  </div>
                  <Button type="submit" className="w-full h-12 text-base bg-accent hover:bg-accent/90" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Регистрация...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Создать аккаунт
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Footer text */}
        <p className="text-xs text-center text-muted-foreground animate-fade-up stagger-2">
          Регистрируясь, вы соглашаетесь с правилами сервера Majestic RP
        </p>
      </div>
    </AuthBackground>
  );
}
