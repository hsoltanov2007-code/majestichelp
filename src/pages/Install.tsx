import { Link } from "react-router-dom";
import { Download, Smartphone, Chrome, Share, Plus, MoreVertical, CheckCircle2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { usePWA } from "@/hooks/usePWA";

export default function Install() {
  const { isInstalled, canInstall, installApp, isStandalone } = usePWA();

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);

  if (isStandalone) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Приложение установлено!</h1>
          <p className="text-muted-foreground mb-6">
            Вы уже используете HARDY как приложение
          </p>
          <Link to="/app">
            <Button className="w-full">Открыть кодексы</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto p-4">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" />
          На главную
        </Link>

        <div className="text-center mb-8">
          <img
            src="/images/hardy-logo.png"
            alt="HARDY"
            className="h-20 w-20 mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold mb-2">Установить HARDY</h1>
          <p className="text-muted-foreground">
            Быстрый доступ к кодексам прямо с домашнего экрана
          </p>
        </div>

        {/* Direct install button for supported browsers */}
        {canInstall && (
          <Card className="p-6 mb-6 border-primary/50 bg-primary/5">
            <div className="text-center">
              <Download className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">Установить сейчас</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Нажмите кнопку ниже для установки
              </p>
              <Button onClick={installApp} size="lg" className="w-full">
                <Download className="h-5 w-5 mr-2" />
                Установить приложение
              </Button>
            </div>
          </Card>
        )}

        {/* iOS instructions */}
        {isIOS && !canInstall && (
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-blue-500/10">
                <Smartphone className="h-6 w-6 text-blue-500" />
              </div>
              <h2 className="text-lg font-semibold">Для iPhone / iPad</h2>
            </div>
            <ol className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-sm font-medium">1</span>
                <div>
                  <p>Нажмите на иконку <strong>Поделиться</strong></p>
                  <Share className="h-5 w-5 mt-1 text-muted-foreground" />
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-sm font-medium">2</span>
                <div>
                  <p>Выберите <strong>«На экран Домой»</strong></p>
                  <Plus className="h-5 w-5 mt-1 text-muted-foreground" />
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-sm font-medium">3</span>
                <p>Нажмите <strong>«Добавить»</strong></p>
              </li>
            </ol>
          </Card>
        )}

        {/* Android instructions */}
        {isAndroid && !canInstall && (
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-green-500/10">
                <Chrome className="h-6 w-6 text-green-500" />
              </div>
              <h2 className="text-lg font-semibold">Для Android</h2>
            </div>
            <ol className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-sm font-medium">1</span>
                <div>
                  <p>Нажмите на <strong>меню браузера</strong></p>
                  <MoreVertical className="h-5 w-5 mt-1 text-muted-foreground" />
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-sm font-medium">2</span>
                <p>Выберите <strong>«Установить приложение»</strong> или <strong>«Добавить на главный экран»</strong></p>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-sm font-medium">3</span>
                <p>Подтвердите установку</p>
              </li>
            </ol>
          </Card>
        )}

        {/* Desktop instructions */}
        {!isIOS && !isAndroid && !canInstall && (
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-purple-500/10">
                <Chrome className="h-6 w-6 text-purple-500" />
              </div>
              <h2 className="text-lg font-semibold">Для компьютера</h2>
            </div>
            <ol className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-sm font-medium">1</span>
                <p>Откройте сайт в <strong>Google Chrome</strong></p>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-sm font-medium">2</span>
                <p>Нажмите на иконку <strong>установки</strong> в адресной строке</p>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-sm font-medium">3</span>
                <p>Нажмите <strong>«Установить»</strong></p>
              </li>
            </ol>
          </Card>
        )}

        {/* Features */}
        <Card className="p-6">
          <h2 className="font-semibold mb-4">Преимущества приложения</h2>
          <ul className="space-y-3">
            <li className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
              <span>Быстрый запуск с домашнего экрана</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
              <span>Работает без интернета</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
              <span>Только кодексы — ничего лишнего</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
              <span>Автоматические обновления</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
