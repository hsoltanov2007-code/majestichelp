import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { allLawsList, getFullLawById, type FullLaw } from "@/data/allLaws";
import { ChevronRight, ExternalLink, History, FileEdit } from "lucide-react";
import { Button } from "@/components/ui/button";

// Компонент для отображения полного текста закона
function FullLawView({ law }: { law: FullLaw }) {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl md:text-3xl font-bold text-primary text-center mb-4">
        {law.title}
      </h1>
      
      {law.preamble && (
        <div className="text-muted-foreground text-center italic mb-8 max-w-3xl mx-auto whitespace-pre-line">
          {law.preamble}
        </div>
      )}
      
      {law.sections.map((section) => (
        <div key={section.id} className="space-y-4">
          <h2 className="text-xl font-semibold text-primary border-b border-primary/30 pb-2">
            {section.title}
          </h2>
          
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <div className="whitespace-pre-line text-foreground leading-relaxed">
              {section.content.split('\n').map((line, idx) => {
                // Заголовки статей
                if (line.match(/^Статья \d+/)) {
                  return (
                    <p key={idx} className="font-semibold text-primary mt-4 mb-2">
                      {line}
                    </p>
                  );
                }
                // Главы
                if (line.match(/^Глава [IVX]+\.|^Глава \d+\./)) {
                  return (
                    <h3 key={idx} className="font-semibold text-foreground mt-6 mb-3 text-lg">
                      {line}
                    </h3>
                  );
                }
                // Части статей
                if (line.match(/^ч\. \d+\./)) {
                  return (
                    <p key={idx} className="ml-0 mb-2">
                      <span className="text-primary font-medium">{line.split('.')[0]}.</span>
                      {line.split('.').slice(1).join('.')}
                    </p>
                  );
                }
                // Пункты
                if (line.match(/^[а-я]\)/)) {
                  return (
                    <p key={idx} className="ml-4 mb-1 text-muted-foreground">
                      {line}
                    </p>
                  );
                }
                // Примечания
                if (line.startsWith('Примечание:')) {
                  return (
                    <div key={idx} className="mt-3 p-3 bg-muted/50 rounded-lg border-l-2 border-primary">
                      <p className="text-sm">{line}</p>
                    </div>
                  );
                }
                // Исключения
                if (line.startsWith('Исключение:')) {
                  return (
                    <div key={idx} className="mt-3 p-3 bg-yellow-500/10 rounded-lg border-l-2 border-yellow-500">
                      <p className="text-sm">{line}</p>
                    </div>
                  );
                }
                // Штрафы
                if (line.startsWith('Штраф:')) {
                  return (
                    <p key={idx} className="text-red-500 font-medium ml-4 mb-3">
                      {line}
                    </p>
                  );
                }
                // Обычный текст
                if (line.trim()) {
                  return <p key={idx} className="mb-2">{line}</p>;
                }
                return null;
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Заглушка для законов без детальных данных
function PlaceholderLaw({ title, forumUrl }: { title: string; forumUrl?: string }) {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl md:text-3xl font-bold text-primary text-center mb-8">
        {title}
      </h1>
      
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">
          Полный текст закона доступен на форуме
        </p>
        {forumUrl && (
          <Button asChild>
            <a href={forumUrl} target="_blank" rel="noopener noreferrer">
              Открыть на форуме <ExternalLink className="w-4 h-4 ml-2" />
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}

export default function LawDetail() {
  const { lawId } = useParams<{ lawId: string }>();
  
  const lawInfo = allLawsList.find(l => l.id === lawId);
  
  if (!lawInfo) {
    return (
      <Layout>
        <div className="container py-8">
          <p className="text-center text-muted-foreground">Закон не найден</p>
          <Link to="/laws" className="text-primary hover:underline block text-center mt-4">
            Вернуться к списку законов
          </Link>
        </div>
      </Layout>
    );
  }
  
  // Получаем полный закон
  const fullLaw = lawId ? getFullLawById(lawId) : undefined;
  
  // Определяем какой контент показывать
  const renderContent = () => {
    if (fullLaw) {
      return <FullLawView law={fullLaw} />;
    }
    return <PlaceholderLaw title={lawInfo.title} forumUrl={lawInfo.forumUrl} />;
  };
  
  return (
    <Layout>
      <div className="container py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm mb-2">
          <Link to="/laws" className="text-muted-foreground hover:text-foreground transition-colors">
            Законы
          </Link>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
          <span className="text-foreground">{lawInfo.title}</span>
        </nav>
        
        {/* Action links */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
          <a href="#" className="flex items-center gap-1 hover:text-foreground transition-colors">
            <History className="w-4 h-4" />
            История изменений
          </a>
          {lawInfo.forumUrl && (
            <a 
              href={lawInfo.forumUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              Открыть оригинал
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          <a href="#" className="flex items-center gap-1 hover:text-foreground transition-colors">
            <FileEdit className="w-4 h-4" />
            Создать законопроект
          </a>
        </div>
        
        {/* Content */}
        <div className="max-w-4xl mx-auto">
          {renderContent()}
        </div>
      </div>
    </Layout>
  );
}
