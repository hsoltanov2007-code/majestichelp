import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  ArrowLeft, Plus, Trash2, Users, FolderOpen, MessageSquare, 
  Shield, Loader2, Pin, Lock, Unlock, Crown, UserCog
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  description: string | null;
  order_index: number;
}

interface UserWithRole {
  id: string;
  username: string;
  role: string;
  created_at: string;
}

interface Topic {
  id: string;
  title: string;
  is_pinned: boolean;
  is_locked: boolean;
  created_at: string;
  author?: { username: string };
}

export default function Admin() {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading: authLoading } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingRoleFor, setUpdatingRoleFor] = useState<string | null>(null);

  // New category form
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/auth');
      } else if (!isAdmin) {
        toast.error('Доступ запрещён');
        navigate('/forum');
      } else {
        fetchData();
      }
    }
  }, [user, isAdmin, authLoading, navigate]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch categories
      const { data: categoriesData } = await supabase
        .from('forum_categories')
        .select('*')
        .order('order_index');
      setCategories(categoriesData || []);

      // Fetch users with roles
      const { data: profiles } = await supabase.from('profiles').select('*');
      const usersWithRoles = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.id)
            .single();
          return {
            id: profile.id,
            username: profile.username,
            role: roleData?.role || 'user',
            created_at: profile.created_at,
          };
        })
      );
      setUsers(usersWithRoles);

      // Fetch recent topics
      const { data: topicsData } = await supabase
        .from('forum_topics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      const topicsWithAuthors = await Promise.all(
        (topicsData || []).map(async (topic) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', topic.author_id)
            .single();
          return { ...topic, author: profile };
        })
      );
      setTopics(topicsWithAuthors);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setIsAddingCategory(true);
    try {
      const { error } = await supabase.from('forum_categories').insert({
        name: newCategoryName.trim(),
        description: newCategoryDesc.trim() || null,
        order_index: categories.length + 1,
      });

      if (error) throw error;

      toast.success('Категория создана');
      setNewCategoryName('');
      setNewCategoryDesc('');
      fetchData();
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error('Ошибка при создании категории');
    } finally {
      setIsAddingCategory(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Удалить категорию и все её темы?')) return;

    try {
      const { error } = await supabase
        .from('forum_categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      toast.success('Категория удалена');
      fetchData();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Ошибка при удалении');
    }
  };

  const handleTogglePin = async (topicId: string, currentlyPinned: boolean) => {
    try {
      const { error } = await supabase
        .from('forum_topics')
        .update({ is_pinned: !currentlyPinned })
        .eq('id', topicId);

      if (error) throw error;

      toast.success(currentlyPinned ? 'Тема откреплена' : 'Тема закреплена');
      fetchData();
    } catch (error) {
      console.error('Error toggling pin:', error);
      toast.error('Ошибка');
    }
  };

  const handleToggleLock = async (topicId: string, currentlyLocked: boolean) => {
    try {
      const { error } = await supabase
        .from('forum_topics')
        .update({ is_locked: !currentlyLocked })
        .eq('id', topicId);

      if (error) throw error;

      toast.success(currentlyLocked ? 'Тема открыта' : 'Тема закрыта');
      fetchData();
    } catch (error) {
      console.error('Error toggling lock:', error);
      toast.error('Ошибка');
    }
  };

  const handleDeleteTopic = async (topicId: string) => {
    if (!confirm('Удалить тему?')) return;

    try {
      const { error } = await supabase.from('forum_topics').delete().eq('id', topicId);

      if (error) throw error;

      toast.success('Тема удалена');
      fetchData();
    } catch (error) {
      console.error('Error deleting topic:', error);
      toast.error('Ошибка при удалении');
    }
  };

  const handleChangeRole = async (userId: string, newRole: 'admin' | 'moderator' | 'user') => {
    if (userId === user?.id) {
      toast.error('Вы не можете изменить свою роль');
      return;
    }

    setUpdatingRoleFor(userId);
    try {
      // First check if user already has a role entry
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from('user_roles')
          .update({ role: newRole })
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: newRole });

        if (error) throw error;
      }

      toast.success(`Роль изменена на "${newRole === 'admin' ? 'Админ' : newRole === 'moderator' ? 'Модератор' : 'Пользователь'}"`);
      fetchData();
    } catch (error) {
      console.error('Error changing role:', error);
      toast.error('Ошибка при изменении роли');
    } finally {
      setUpdatingRoleFor(null);
    }
  };

  if (authLoading || isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button asChild variant="ghost" size="icon">
            <Link to="/forum">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6" />
              Админ-панель
            </h1>
            <p className="text-muted-foreground">Управление форумом</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Категорий
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-primary" />
                {categories.length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Пользователей
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                {users.length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Тем
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                {topics.length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="categories">
          <TabsList className="mb-4">
            <TabsTrigger value="categories">Категории</TabsTrigger>
            <TabsTrigger value="topics">Темы</TabsTrigger>
            <TabsTrigger value="users">Пользователи</TabsTrigger>
          </TabsList>

          <TabsContent value="categories">
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Новая категория</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddCategory} className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="cat-name">Название</Label>
                    <Input
                      id="cat-name"
                      placeholder="💬 Название категории"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="cat-desc">Описание</Label>
                    <Input
                      id="cat-desc"
                      placeholder="Описание категории"
                      value={newCategoryDesc}
                      onChange={(e) => setNewCategoryDesc(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="self-end" disabled={isAddingCategory}>
                    {isAddingCategory ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="mr-2 h-4 w-4" />
                    )}
                    Добавить
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-2">
              {categories.map((category) => (
                <Card key={category.id}>
                  <CardContent className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{category.name}</p>
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDeleteCategory(category.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="topics">
            <div className="space-y-2">
              {topics.map((topic) => (
                <Card key={topic.id}>
                  <CardContent className="py-3 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{topic.title}</p>
                      <p className="text-sm text-muted-foreground">
                        от {topic.author?.username || 'Аноним'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={topic.is_pinned ? 'secondary' : 'outline'}
                        size="icon"
                        onClick={() => handleTogglePin(topic.id, topic.is_pinned)}
                        title={topic.is_pinned ? 'Открепить' : 'Закрепить'}
                      >
                        <Pin className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={topic.is_locked ? 'secondary' : 'outline'}
                        size="icon"
                        onClick={() => handleToggleLock(topic.id, topic.is_locked)}
                        title={topic.is_locked ? 'Открыть' : 'Закрыть'}
                      >
                        {topic.is_locked ? (
                          <Lock className="h-4 w-4" />
                        ) : (
                          <Unlock className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDeleteTopic(topic.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="users">
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCog className="h-5 w-5" />
                  Управление ролями
                </CardTitle>
                <CardDescription>
                  Выберите роль для пользователя. Админы имеют полный доступ ко всем функциям.
                </CardDescription>
              </CardHeader>
            </Card>
            
            <div className="space-y-2">
              {users.map((u) => (
                <Card key={u.id} className={u.id === user?.id ? 'border-accent/50' : ''}>
                  <CardContent className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        u.role === 'admin' 
                          ? 'bg-yellow-500/20 text-yellow-500' 
                          : u.role === 'moderator' 
                            ? 'bg-blue-500/20 text-blue-500' 
                            : 'bg-muted text-muted-foreground'
                      }`}>
                        {u.role === 'admin' ? (
                          <Crown className="h-5 w-5" />
                        ) : u.role === 'moderator' ? (
                          <Shield className="h-5 w-5" />
                        ) : (
                          <Users className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium flex items-center gap-2">
                          {u.username}
                          {u.id === user?.id && (
                            <Badge variant="outline" className="text-xs">Вы</Badge>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(u.created_at).toLocaleDateString('ru-RU')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {u.id === user?.id ? (
                        <Badge variant="default" className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
                          <Crown className="h-3 w-3 mr-1" />
                          Админ
                        </Badge>
                      ) : (
                        <Select
                          value={u.role}
                          onValueChange={(value: 'admin' | 'moderator' | 'user') => handleChangeRole(u.id, value)}
                          disabled={updatingRoleFor === u.id}
                        >
                          <SelectTrigger className="w-[160px]">
                            {updatingRoleFor === u.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <SelectValue />
                            )}
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Пользователь
                              </div>
                            </SelectItem>
                            <SelectItem value="moderator">
                              <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4 text-blue-500" />
                                Модератор
                              </div>
                            </SelectItem>
                            <SelectItem value="admin">
                              <div className="flex items-center gap-2">
                                <Crown className="h-4 w-4 text-yellow-500" />
                                Админ
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
