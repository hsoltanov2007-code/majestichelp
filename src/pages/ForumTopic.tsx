import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ArrowLeft, Pin, Lock, User, Clock, Send, Trash2, Loader2, Pencil, X, Check, Crown } from 'lucide-react';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  author?: {
    username: string;
  };
  author_is_admin?: boolean;
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
  author_is_admin?: boolean;
}

export default function ForumTopic() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin } = useAuth();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Edit states
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [editTopicTitle, setEditTopicTitle] = useState('');
  const [editTopicContent, setEditTopicContent] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  useEffect(() => {
    if (id) {
      fetchTopicAndComments();
      incrementViewCount();
    }
  }, [id]);

  const fetchTopicAndComments = async () => {
    try {
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

      // Check if topic author is admin
      const { data: topicAuthorRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', topicData.author_id)
        .eq('role', 'admin')
        .maybeSingle();

      setTopic({ ...topicData, author: topicAuthor, author_is_admin: !!topicAuthorRole });

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

          // Check if comment author is admin
          const { data: authorRole } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', comment.author_id)
            .eq('role', 'admin')
            .maybeSingle();

          return { ...comment, author: profile, author_is_admin: !!authorRole };
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

  // Edit topic handlers
  const startEditTopic = () => {
    if (!topic) return;
    setEditingTopicId(topic.id);
    setEditTopicTitle(topic.title);
    setEditTopicContent(topic.content);
  };

  const cancelEditTopic = () => {
    setEditingTopicId(null);
    setEditTopicTitle('');
    setEditTopicContent('');
  };

  const saveEditTopic = async () => {
    if (!topic || !editTopicTitle.trim() || !editTopicContent.trim()) return;

    setIsSavingEdit(true);
    try {
      const { error } = await supabase
        .from('forum_topics')
        .update({
          title: editTopicTitle.trim(),
          content: editTopicContent.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', topic.id);

      if (error) throw error;

      setTopic({
        ...topic,
        title: editTopicTitle.trim(),
        content: editTopicContent.trim(),
      });
      cancelEditTopic();
      toast.success('Тема обновлена');
    } catch (error) {
      console.error('Error updating topic:', error);
      toast.error('Ошибка при обновлении');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Edit comment handlers
  const startEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditCommentContent(comment.content);
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditCommentContent('');
  };

  const saveEditComment = async (commentId: string) => {
    if (!editCommentContent.trim()) return;

    setIsSavingEdit(true);
    try {
      const { error } = await supabase
        .from('forum_comments')
        .update({
          content: editCommentContent.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', commentId);

      if (error) throw error;

      setComments(
        comments.map((c) =>
          c.id === commentId ? { ...c, content: editCommentContent.trim() } : c
        )
      );
      cancelEditComment();
      toast.success('Комментарий обновлён');
    } catch (error) {
      console.error('Error updating comment:', error);
      toast.error('Ошибка при обновлении');
    } finally {
      setIsSavingEdit(false);
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

  // Only author or admin can edit/delete
  const canEditTopic = user && topic && (user.id === topic.author_id || isAdmin);
  const canDeleteTopic = canEditTopic;
  const canEditComment = (comment: Comment) => user && (user.id === comment.author_id || isAdmin);
  const canDeleteComment = (comment: Comment) => user && (user.id === comment.author_id || isAdmin);

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
          {canEditTopic && !editingTopicId && (
            <Button variant="outline" size="sm" onClick={startEditTopic}>
              <Pencil className="mr-2 h-4 w-4" />
              Редактировать
            </Button>
          )}
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
                {editingTopicId === topic.id ? (
                  <div className="space-y-3">
                    <Input
                      value={editTopicTitle}
                      onChange={(e) => setEditTopicTitle(e.target.value)}
                      placeholder="Заголовок темы"
                      className="text-lg font-bold"
                    />
                    <Textarea
                      value={editTopicContent}
                      onChange={(e) => setEditTopicContent(e.target.value)}
                      placeholder="Содержание темы"
                      rows={5}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={saveEditTopic}
                        disabled={isSavingEdit}
                      >
                        {isSavingEdit ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="mr-2 h-4 w-4" />
                        )}
                        Сохранить
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEditTopic}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Отмена
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className="text-2xl font-bold text-foreground">{topic.title}</h1>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {topic.author_is_admin && <Crown className="h-4 w-4 text-red-500" />}
                        <span className={topic.author_is_admin ? "text-red-500 font-medium" : ""}>
                          {topic.author?.username || 'Аноним'}
                        </span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatDate(topic.created_at)}
                      </span>
                    </div>
                  </>
                )}
              </CardHeader>
              {editingTopicId !== topic.id && (
                <CardContent>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <p className="whitespace-pre-wrap">{topic.content}</p>
                  </div>
                </CardContent>
              )}
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
                          {comment.author_is_admin && <Crown className="h-4 w-4 text-red-500" />}
                          <span className={`font-medium ${comment.author_is_admin ? 'text-red-500' : 'text-foreground'}`}>
                            {comment.author?.username || 'Аноним'}
                          </span>
                          <span>•</span>
                          <span>{formatDate(comment.created_at)}</span>
                        </div>
                        {editingCommentId === comment.id ? (
                          <div className="space-y-3">
                            <Textarea
                              value={editCommentContent}
                              onChange={(e) => setEditCommentContent(e.target.value)}
                              rows={3}
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => saveEditComment(comment.id)}
                                disabled={isSavingEdit}
                              >
                                {isSavingEdit ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Check className="mr-2 h-4 w-4" />
                                )}
                                Сохранить
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={cancelEditComment}
                              >
                                <X className="mr-2 h-4 w-4" />
                                Отмена
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap">{comment.content}</p>
                        )}
                      </div>
                      {canEditComment(comment) && editingCommentId !== comment.id && (
                        <div className="flex gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => startEditComment(comment)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {canDeleteComment(comment) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteComment(comment.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
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
                      <Link to="/auth" state={{ from: location.pathname }}>Войти</Link>
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
