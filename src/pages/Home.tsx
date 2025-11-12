import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import QuestionCard from '@/components/QuestionCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { storage } from '@/lib/storage';
import { Question, QuestionCategory } from '@/types/question';
import { Search, Shuffle } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<QuestionCategory | 'all'>('all');
  const [questionsWithStatus, setQuestionsWithStatus] = useState<Array<Question & { isAttempted: boolean; isCorrect?: boolean }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const questions = await storage.getQuestionsWithStatus();
      setQuestionsWithStatus(questions);
      setLoading(false);
    };
    loadData();
  }, []);

  const filteredQuestions = useMemo(() => {
    return questionsWithStatus.filter(q => {
      const matchesCategory = selectedCategory === 'all' || q.category === selectedCategory;
      const matchesSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           q.content.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [questionsWithStatus, selectedCategory, searchQuery]);

  const attemptedCount = questionsWithStatus.filter(q => q.isAttempted).length;

  const handleRandomQuestion = () => {
    navigate('/practice/random');
  };

  const categoryLabels = {
    'all': '全部',
    'algorithm': '算法',
    'data-structure': '数据结构',
    'system-design': '系统设计',
    'database': '数据库',
    'web': 'Web开发',
    'other': '其他'
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-muted-foreground">加载题库数据中...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">题库</h1>
              <p className="text-muted-foreground mt-1">
                共 {questionsWithStatus.length} 道题目，已完成 {attemptedCount} 道
              </p>
            </div>
            <Button onClick={handleRandomQuestion} className="gap-2">
              <Shuffle className="h-4 w-4" />
              随机一题
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索题目..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as QuestionCategory | 'all')}>
          <TabsList className="w-full flex-wrap h-auto">
            {Object.entries(categoryLabels).map(([key, label]) => (
              <TabsTrigger key={key} value={key} className="flex-1 min-w-[100px]">
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredQuestions.map(question => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  onClick={() => navigate(`/question/${question.id}`)}
                  isAttempted={question.isAttempted}
                  isCorrect={question.isCorrect}
                />
              ))}
            </div>
            {filteredQuestions.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                没有找到相关题目
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
