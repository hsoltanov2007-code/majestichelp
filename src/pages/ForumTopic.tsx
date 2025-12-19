import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ArrowLeft, Pin, Lock, User, Clock, Send, Trash2, Loader2 } from 'lucide-react';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  author?: {
    username: string;
  };
}

interface Topic {
  id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  is_locked: boolean;
  views_count: number;
  created_at: string;
  category_id: string;
  author_id: string;
  author?: {
    username: string;
  };
}

export default function ForumTopic() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchTopicAndComments();
      incrementViewCount();
    }
  }, [id]);

  const fetchTopicAndComments = async () => {
    try {
      // Fetch topic with author
      const { data: topicData, error: topicError } = await supabase
        .from('forum_topics')
        .select('*')
        .eq('id', id)
        .single();

      if (topicError) throw topicError;

      const { data: topicAuthor } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', topicData.author_id)
        .single();

      setTopic({ ...topicData, author: topicAuthor });

      // Fetch comments with authors
      const { data: commentsData, error: commentsError } = await supabase
        .from('forum_comments')
        .select('*')
        .eq('topic_id', id)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;

      const commentsWithAuthors = await Promise.all(
        (commentsData || []).map(async (comment) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', comment.author_id)
            .single();

          return { ...comment, author: profile };
        })
      );

      setComments(commentsWithAuthors);
    } catch (error) {
      console.error('Error fetching topic:', error);
      toast.error('Тема не найдена');
      navigate('/forum');
    } finally {
      setIsLoading(false);
    }
  };

  const incrementViewCount = async () => {
    if (!id) return;
    await supabase
      .from('forum_topics')
      .update({ views_count: (topic?.views_count || 0) + 1 })
      .eq('id', id);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id || !newComment.trim()) return;

    if (topic?.is_locked) {
      toast.error('Тема закрыта для комментирования');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('forum_comments').insert({
        topic_id: id,
        author_id: user.id,
        content: newComment.trim(),
      });

      if (error) throw error;

      setNewComment('');
      fetchTopicAndComments();
      toast.success('Комментарий добавлен');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Ошибка при добавлении комментария');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Удалить комментарий?')) return;

    try {
      const { error } = await supabase
        .from('forum_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      setComments(comments.filter((c) => c.id !== commentId));
      toast.success('Комментарий удалён');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Ошибка при удалении');
    }
  };

  const handleDeleteTopic = async () => {
    if (!confirm('Удалить тему и все комментарии?')) return;

    try {
      const { error } = await supabase
        .from('forum_topics')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Тема удалена');
      navigate(`/forum/category/${topic?.category_id}`);
    } catch (error) {
      console.error('Error deleting topic:', error);
      toast.error('Ошибка при удалении');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const canDeleteTopic = user && topic && (user.id === topic.author_id || isAdmin);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/forum/category/${topic?.category_id}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1" />
          {canDeleteTopic && (
            <Button variant="destructive" size="sm" onClick={handleDeleteTopic}>
              <Trash2 className="mr-2 h-4 w-4" />
              Удалить тему
            </Button>
          )}
        </div>

        {isLoading ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-2/3 mb-2" />
              <Skeleton className="h-4 w-1/3" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ) : topic ? (
          <>
            {/* Topic */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  {topic.is_pinned && (
                    <Badge variant="secondary">
                      <Pin className="mr-1 h-3 w-3" />
                      Закреплено
                    </Badge>
                  )}
                  {topic.is_locked && (
                    <Badge variant="outline">
                      <Lock className="mr-1 h-3 w-3" />
                      Закрыто
                    </Badge>
                  )}
                </div>
                <h1 className="text-2xl font-bold text-foreground">{topic.title}</h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {topic.author?.username || 'Аноним'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formatDate(topic.created_at)}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <p className="whitespace-pre-wrap">{topic.content}</p>
                </div>
              </CardContent>
            </Card>

            {/* Comments */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">
                Комментарии ({comments.length})
              </h2>

              {comments.map((comment) => (
                <Card key={comment.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span className="font-medium text-foreground">
                            {comment.author?.username || 'Аноним'}
                          </span>
                          <span>•</span>
                          <span>{formatDate(comment.created_at)}</span>
                        </div>
                        <p className="whitespace-pre-wrap">{comment.content}</p>
                      </div>
                      {user && (user.id === comment.author_id || isAdmin) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Add comment form */}
              {user ? (
                topic.is_locked ? (
                  <Card>
                    <CardContent className="py-4 text-center text-muted-foreground">
                      <Lock className="mx-auto h-5 w-5 mb-2" />
                      Тема закрыта для комментирования
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="py-4">
                      <form onSubmit={handleSubmitComment}>
                        <Textarea
                          placeholder="Напишите комментарий..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          className="mb-3"
                          rows={3}
                        />
                        <Button type="submit" disabled={isSubmitting || !newComment.trim()}>
                          {isSubmitting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="mr-2 h-4 w-4" />
                          )}
                          Отправить
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                )
              ) : (
                <Card>
                  <CardContent className="py-4 text-center">
                    <p className="text-muted-foreground mb-3">
                      Войдите, чтобы оставить комментарий
                    </p>
                    <Button asChild>
                      <Link to="/auth">Войти</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        ) : null}
      </div>
    </Layout>
  );
}
