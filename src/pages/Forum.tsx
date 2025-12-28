import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageCircle, Clock, Shield, LogIn, ArrowRight, MessageSquare } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  order_index: number;
  topics_count?: number;
  last_topic?: {
    title: string;
    created_at: string;
  };
}

export default function Forum() {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data: categoriesData, error } = await supabase
        .from('forum_categories')
        .select('*')
        .order('order_index');

      if (error) throw error;

      const categoriesWithCounts = await Promise.all(
        (categoriesData || []).map(async (category) => {
          const { count } = await supabase
            .from('forum_topics')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', category.id);

          const { data: lastTopic } = await supabase
            .from('forum_topics')
            .select('title, created_at')
            .eq('category_id', category.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            ...category,
            topics_count: count || 0,
            last_topic: lastTopic,
          };
        })
      );

      setCategories(categoriesWithCounts);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
          <div className="opacity-0 animate-fade-up">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-accent" />
              </div>
              <h1 className="text-4xl font-bold text-foreground">Форум</h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Обсуждайте законы, делитесь опытом и задавайте вопросы
            </p>
          </div>

          <div className="flex gap-2 opacity-0 animate-fade-up stagger-1">
            {authLoading ? null : user ? (
              <>
                {isAdmin && (
                  <Button asChild variant="outline" className="glass">
                    <Link to="/admin">
                      <Shield className="mr-2 h-4 w-4" />
                      Админ-панель
                    </Link>
                  </Button>
                )}
              </>
            ) : (
              <Button asChild className="bg-accent hover:bg-accent/90">
                <Link to="/auth">
                  <LogIn className="mr-2 h-4 w-4" />
                  Войти
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Categories */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="glass">
                <CardHeader>
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-4 w-2/3" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {categories.map((category, index) => (
              <Link 
                key={category.id} 
                to={`/forum/category/${category.id}`}
                className={`block opacity-0 animate-fade-up stagger-${Math.min(index + 1, 7)}`}
              >
                <Card className="glass hover-lift card-hover-gradient group cursor-pointer border-0">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-2xl shrink-0 transition-transform duration-300 group-hover:scale-110">
                          {category.name.split(' ')[0]}
                        </div>
                        <div className="space-y-1">
                          <CardTitle className="text-xl group-hover:text-accent transition-colors flex items-center gap-2">
                            {category.name.split(' ').slice(1).join(' ') || category.name}
                            <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                          </CardTitle>
                          <CardDescription className="text-base">{category.description}</CardDescription>
                        </div>
                      </div>
                      <Badge variant="secondary" className="shrink-0 glass">
                        <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
                        {category.topics_count} тем
                      </Badge>
                    </div>
                  </CardHeader>
                  {category.last_topic && (
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground pl-16">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="truncate">
                          Последнее: <span className="text-foreground/80">{category.last_topic.title}</span>
                        </span>
                        <span className="text-muted-foreground/50">•</span>
                        <span>{formatDate(category.last_topic.created_at)}</span>
                      </div>
                    </CardContent>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
