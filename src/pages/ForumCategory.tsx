import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Plus, MessageCircle, Eye, Pin, Lock, User, Clock } from 'lucide-react';

interface Topic {
  id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  is_locked: boolean;
  views_count: number;
  created_at: string;
  author_id: string;
  author?: {
    username: string;
  };
  comments_count?: number;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
}

export default function ForumCategory() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [category, setCategory] = useState<Category | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchCategoryAndTopics();
    }
  }, [id]);

  const fetchCategoryAndTopics = async () => {
    try {
      // Fetch category
      const { data: categoryData, error: categoryError } = await supabase
        .from('forum_categories')
        .select('*')
        .eq('id', id)
        .single();

      if (categoryError) throw categoryError;
      setCategory(categoryData);

      // Fetch topics with authors
      const { data: topicsData, error: topicsError } = await supabase
        .from('forum_topics')
        .select('*')
        .eq('category_id', id)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (topicsError) throw topicsError;

      // Fetch author profiles and comment counts
      const topicsWithDetails = await Promise.all(
        (topicsData || []).map(async (topic) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', topic.author_id)
            .single();

          const { count } = await supabase
            .from('forum_comments')
            .select('*', { count: 'exact', head: true })
            .eq('topic_id', topic.id);

          return {
            ...topic,
            author: profile,
            comments_count: count || 0,
          };
        })
      );

      setTopics(topicsWithDetails);
    } catch (error) {
      console.error('Error fetching category and topics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button asChild variant="ghost" size="icon">
            <Link to="/forum">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1">
            {isLoading ? (
              <>
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-96" />
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-foreground">{category?.name}</h1>
                <p className="text-muted-foreground">{category?.description}</p>
              </>
            )}
          </div>
          {user && (
            <Button asChild>
              <Link to={`/forum/new-topic?category=${id}`}>
                <Plus className="mr-2 h-4 w-4" />
                Новая тема
              </Link>
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-1/3" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : topics.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-foreground">Пока нет тем</h3>
              <p className="text-muted-foreground mt-1">
                Будьте первым, кто создаст тему в этой категории
              </p>
              {user && (
                <Button asChild className="mt-4">
                  <Link to={`/forum/new-topic?category=${id}`}>
                    <Plus className="mr-2 h-4 w-4" />
                    Создать тему
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {topics.map((topic) => (
              <Link key={topic.id} to={`/forum/topic/${topic.id}`}>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardHeader className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {topic.is_pinned && (
                            <Badge variant="secondary" className="shrink-0">
                              <Pin className="mr-1 h-3 w-3" />
                              Закреплено
                            </Badge>
                          )}
                          {topic.is_locked && (
                            <Badge variant="outline" className="shrink-0">
                              <Lock className="mr-1 h-3 w-3" />
                              Закрыто
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-base font-medium truncate">
                          {topic.title}
                        </CardTitle>
                        <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {topic.author?.username || 'Аноним'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(topic.created_at)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground shrink-0">
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-4 w-4" />
                          {topic.comments_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {topic.views_count}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
