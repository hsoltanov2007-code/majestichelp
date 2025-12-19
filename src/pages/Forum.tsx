import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageCircle, Users, Clock, Shield, LogIn } from 'lucide-react';

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

      // Fetch topic counts for each category
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Форум</h1>
            <p className="text-muted-foreground mt-1">
              Обсуждайте законы, делитесь опытом и задавайте вопросы
            </p>
          </div>

          <div className="flex gap-2">
            {authLoading ? null : user ? (
              <>
                {isAdmin && (
                  <Button asChild variant="outline">
                    <Link to="/admin">
                      <Shield className="mr-2 h-4 w-4" />
                      Админ-панель
                    </Link>
                  </Button>
                )}
              </>
            ) : (
              <Button asChild>
                <Link to="/auth">
                  <LogIn className="mr-2 h-4 w-4" />
                  Войти
                </Link>
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-4 w-2/3" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {categories.map((category) => (
              <Link key={category.id} to={`/forum/category/${category.id}`}>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-xl">
                          {category.name.split(' ')[0]}
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {category.name.split(' ').slice(1).join(' ') || category.name}
                          </CardTitle>
                          <CardDescription>{category.description}</CardDescription>
                        </div>
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        <MessageCircle className="mr-1 h-3 w-3" />
                        {category.topics_count} тем
                      </Badge>
                    </div>
                  </CardHeader>
                  {category.last_topic && (
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span className="truncate">
                          Последнее: {category.last_topic.title}
                        </span>
                        <span>•</span>
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
