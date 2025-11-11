import Layout from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { storage } from '@/lib/storage';
import { calculateStatistics } from '@/lib/statistics';
import { CheckCircle2, XCircle, Target, TrendingUp } from 'lucide-react';

export default function Statistics() {
  const questions = storage.getQuestions();
  const answers = storage.getAnswers();
  const stats = calculateStatistics(questions, answers);

  const categoryLabels = {
    'algorithm': '算法',
    'data-structure': '数据结构',
    'system-design': '系统设计',
    'database': '数据库',
    'web': 'Web开发',
    'other': '其他'
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">学习统计</h1>
          <p className="text-muted-foreground mt-1">追踪你的学习进度和成果</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">总题数</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalQuestions}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">正确数</p>
                <p className="text-2xl font-bold text-foreground">{stats.correctAnswers}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-destructive/10 flex items-center justify-center">
                <XCircle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">错误数</p>
                <p className="text-2xl font-bold text-foreground">{stats.wrongAnswers}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-ai/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-ai" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">正确率</p>
                <p className="text-2xl font-bold text-foreground">{stats.accuracy.toFixed(1)}%</p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-foreground">整体进度</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">已完成</span>
              <span className="font-medium text-foreground">
                {stats.attemptedQuestions} / {stats.totalQuestions}
              </span>
            </div>
            <Progress value={(stats.attemptedQuestions / stats.totalQuestions) * 100} />
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6 text-foreground">分类统计</h2>
          <div className="space-y-6">
            {Object.entries(stats.categoryStats).map(([category, data]) => {
              const accuracy = data.attempted > 0 ? (data.correct / data.attempted) * 100 : 0;
              const progress = data.total > 0 ? (data.attempted / data.total) * 100 : 0;
              
              return (
                <div key={category} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">
                      {categoryLabels[category as keyof typeof categoryLabels]}
                    </span>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">
                        {data.attempted} / {data.total}
                      </span>
                      <span className="font-medium text-foreground">
                        {accuracy.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <Progress value={progress} />
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </Layout>
  );
}
