import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import QuestionCard from '@/components/QuestionCard';
import { storage } from '@/lib/storage';
import { Question } from '@/types/question';
import { AlertCircle } from 'lucide-react';

export default function WrongQuestions() {
  const navigate = useNavigate();
  const [wrongQuestions, setWrongQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWrongQuestions = async () => {
      const questions = await storage.getWrongQuestions();
      setWrongQuestions(questions);
      setLoading(false);
    };
    loadWrongQuestions();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-muted-foreground">加载错题数据中...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">错题集</h1>
          <p className="text-muted-foreground mt-1">
            共 {wrongQuestions.length} 道错题，加油复习！
          </p>
        </div>

        {wrongQuestions.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {wrongQuestions.map(question => (
              <QuestionCard
                key={question.id}
                question={question}
                onClick={() => navigate(`/question/${question.id}`)}
                isAttempted={true}
                isCorrect={false}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-success" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">太棒了！</h2>
            <p className="text-muted-foreground">
              你还没有错题，继续保持！
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
