import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { allLawsList, constitution, immunityLaw, laborCode, lawEnforcementLaw, secretServiceLaw, proceduralCode } from "@/data/allLaws";
import { ChevronRight, ExternalLink, History, FileEdit } from "lucide-react";
import { Button } from "@/components/ui/button";

// Компонент для отображения статьи закона
function ArticlePart({ number, text, subparts }: { number: string; text: string; subparts?: { letter: string; text: string }[] }) {
  return (
    <div className="mb-4">
      <p className="text-foreground">
        <span className="text-primary font-medium">ч. {number}.</span> {text}
      </p>
      {subparts && subparts.length > 0 && (
        <div className="pl-6 mt-2 space-y-1">
          {subparts.map((sub, idx) => (
            <p key={idx} className="text-muted-foreground">
              <span className="font-medium">{sub.letter})</span> {sub.text}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

// Компонент для отображения Конституции и законов с главами
function LawWithChapters({ law }: { law: typeof constitution }) {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl md:text-3xl font-bold text-primary text-center mb-8">
        {law.title}
      </h1>
      
      {law.chapters.map((chapter) => (
        <div key={chapter.id} className="space-y-6">
          <h2 className="text-lg font-semibold text-primary text-center">
            {chapter.title}
          </h2>
          
          {chapter.articles.map((article) => (
            <div key={article.number} className="space-y-3">
              <h3 className="font-semibold text-foreground">
                <span className="text-primary">Статья {article.number}.</span>{" "}
                {article.title.replace(`Статья ${article.number}`, "").replace(/^[\.\s]+/, "")}
              </h3>
              
              {article.parts.map((part, idx) => (
                <ArticlePart 
                  key={idx} 
                  number={part.number} 
                  text={part.text} 
                  subparts={part.subparts} 
                />
              ))}
              
              {article.notes && article.notes.length > 0 && (
                <div className="mt-3 p-3 bg-muted/50 rounded-lg border-l-2 border-primary">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Примечание:</p>
                  {article.notes.map((note, idx) => (
                    <p key={idx} className="text-sm text-muted-foreground">{note}</p>
                  ))}
                </div>
              )}
              
              {article.exception && (
                <div className="mt-3 p-3 bg-yellow-500/10 rounded-lg border-l-2 border-yellow-500">
                  <p className="text-sm font-medium text-yellow-600 mb-1">Исключение:</p>
                  <p className="text-sm">{article.exception}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// Компонент для отображения Процессуального кодекса
function ProceduralCodeView() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl md:text-3xl font-bold text-primary text-center mb-8">
        Процессуальный кодекс
      </h1>
      
      {proceduralCode.map((section) => (
        <div key={section.id} className="space-y-6">
          <h2 className="text-lg font-semibold text-primary text-center">
            {section.title}
          </h2>
          
          {section.chapters.map((chapter) => (
            <div key={chapter.id} className="space-y-6">
              <h3 className="text-md font-medium text-primary text-center">
                {chapter.title}
              </h3>
              
              {chapter.articles.map((article) => (
                <div key={article.id} className="space-y-3">
                  <h4 className="font-semibold text-foreground">
                    <span className="text-primary">{article.title.split('.')[0]}.</span>{" "}
                    {article.title.split('.').slice(1).join('.').trim()}
                  </h4>
                  
                  {article.parts.map((part, idx) => (
                    <ArticlePart 
                      key={idx} 
                      number={part.number} 
                      text={part.text} 
                      subparts={part.subparts} 
                    />
                  ))}
                  
                  {article.notes && article.notes.length > 0 && (
                    <div className="mt-3 p-3 bg-muted/50 rounded-lg border-l-2 border-primary">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Примечание:</p>
                      {article.notes.map((note, idx) => (
                        <p key={idx} className="text-sm text-muted-foreground">{note}</p>
                      ))}
                    </div>
                  )}
                  
                  {article.exception && (
                    <div className="mt-3 p-3 bg-yellow-500/10 rounded-lg border-l-2 border-yellow-500">
                      <p className="text-sm font-medium text-yellow-600 mb-1">Исключение:</p>
                      <p className="text-sm">{article.exception}</p>
                    </div>
                  )}
                  
                  {article.comment && (
                    <div className="mt-3 p-3 bg-blue-500/10 rounded-lg border-l-2 border-blue-500">
                      <p className="text-sm font-medium text-blue-600 mb-1">Комментарий:</p>
                      <p className="text-sm">{article.comment}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
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
  
  // Определяем какой контент показывать
  const renderContent = () => {
    switch (lawId) {
      case "constitution":
        return <LawWithChapters law={constitution} />;
      case "immunity-law":
        return <LawWithChapters law={immunityLaw} />;
      case "labor-code":
        return <LawWithChapters law={laborCode} />;
      case "regional-law-enforcement":
        return <LawWithChapters law={lawEnforcementLaw} />;
      case "secret-service-law":
        return <LawWithChapters law={secretServiceLaw} />;
      case "procedural-code":
        return <ProceduralCodeView />;
      default:
        return <PlaceholderLaw title={lawInfo.title} forumUrl={lawInfo.forumUrl} />;
    }
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
