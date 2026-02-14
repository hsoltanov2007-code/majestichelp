import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Link, Unlink, Copy, CheckCircle } from 'lucide-react';

interface TelegramLinkSectionProps {
  userId: string;
  telegramChatId: number | null;
  onUpdate: () => void;
}

export function TelegramLinkSection({ userId, telegramChatId, onUpdate }: TelegramLinkSectionProps) {
  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateCode = async () => {
    setIsGenerating(true);
    try {
      // Delete old codes for this user
      await supabase.from('telegram_link_codes').delete().eq('user_id', userId);

      // Generate random 6-char code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();

      const { error } = await supabase.from('telegram_link_codes').insert({
        user_id: userId,
        code,
      });

      if (error) throw error;
      setLinkCode(code);
    } catch (err) {
      console.error('Error generating code:', err);
      toast.error('Ошибка при генерации кода');
    } finally {
      setIsGenerating(false);
    }
  };

  const unlinkTelegram = async () => {
    setIsUnlinking(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ telegram_chat_id: null } as any)
        .eq('id', userId);

      if (error) throw error;
      toast.success('Telegram отвязан');
      onUpdate();
    } catch (err) {
      console.error('Error unlinking:', err);
      toast.error('Ошибка при отвязке');
    } finally {
      setIsUnlinking(false);
    }
  };

  const copyCode = async () => {
    if (!linkCode) return;
    const deepLink = `https://t.me/HardyHelpBot?start=${linkCode}`;
    await navigator.clipboard.writeText(deepLink);
    setCopied(true);
    toast.success('Ссылка скопирована!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (telegramChatId) {
    return (
      <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <svg className="h-5 w-5 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Telegram</p>
              <div className="flex items-center gap-2">
                <p className="font-medium text-foreground">Привязан</p>
                <Badge className="bg-green-500/20 text-green-400 border-0 text-xs">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Активен
                </Badge>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={unlinkTelegram}
            disabled={isUnlinking}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            {isUnlinking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlink className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
          <svg className="h-5 w-5 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
          </svg>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Telegram</p>
          <p className="font-medium text-foreground">Не привязан</p>
        </div>
      </div>

      {linkCode ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Нажми на кнопку ниже, чтобы открыть бота и привязать аккаунт:
          </p>
          <div className="flex gap-2">
            <a
              href={`https://t.me/HardyHelpBot?start=${linkCode}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white">
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
                Открыть бота
              </Button>
            </a>
            <Button variant="outline" size="icon" onClick={copyCode}>
              {copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Код действителен 10 минут</p>
        </div>
      ) : (
        <Button
          onClick={generateCode}
          disabled={isGenerating}
          variant="outline"
          className="w-full"
        >
          {isGenerating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Link className="mr-2 h-4 w-4" />
          )}
          Привязать Telegram
        </Button>
      )}
    </div>
  );
}
