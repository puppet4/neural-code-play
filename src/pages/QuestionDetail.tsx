import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { storage } from '@/lib/storage';
import { Question } from '@/types/question';
import { ArrowLeft, CheckCircle2, XCircle, Lightbulb, MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function QuestionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [question, setQuestion] = useState<Question | null>(null);
  const [userAnswer, setUserAnswer] = useState<string | string[]>('');
  const [submitted, setSubmitted] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    if (id) {
      const questions = storage.getQuestions();
      const found = questions.find(q => q.id === id);
      if (found) {
        setQuestion(found);
      } else {
        toast.error('题目不存在');
        navigate('/');
      }
    }
  }, [id, navigate]);

  const handleSubmit = () => {
    if (!question || !userAnswer || (Array.isArray(userAnswer) && userAnswer.length === 0)) {
      toast.error('请先选择答案');
      return;
    }

    const isCorrect = Array.isArray(question.correctAnswer)
      ? JSON.stringify((userAnswer as string[]).sort()) === JSON.stringify(question.correctAnswer.sort())
      : userAnswer === question.correctAnswer;

    storage.saveAnswer({
      id: Date.now().toString(),
      questionId: question.id,
      userAnswer,
      isCorrect,
      timestamp: Date.now()
    });

    setSubmitted(true);
    setShowExplanation(true);

    if (isCorrect) {
      toast.success('回答正确！');
    } else {
      toast.error('回答错误，请查看解析');
    }
  };

  const handleAiQuestion = async () => {
    if (!aiQuestion.trim()) {
      toast.error('请输入问题');
      return;
    }

    setIsAiLoading(true);
    setAiResponse('');

    try {
      // Placeholder for AI integration
      // This will be connected to Lovable AI later
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAiResponse('AI 功能即将集成，敬请期待！这里将显示 AI 对您问题的详细解答。');
    } catch (error) {
      toast.error('AI 问答失败，请重试');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleMultipleChoice = (option: string) => {
    const current = (userAnswer as string[]) || [];
    if (current.includes(option)) {
      setUserAnswer(current.filter(o => o !== option));
    } else {
      setUserAnswer([...current, option]);
    }
  };

  if (!question) {
    return null;
  }

  const isCorrect = submitted && (
    Array.isArray(question.correctAnswer)
      ? JSON.stringify((userAnswer as string[]).sort()) === JSON.stringify(question.correctAnswer.sort())
      : userAnswer === question.correctAnswer
  );

  const difficultyColors = {
    'easy': 'bg-success/10 text-success border-success/20',
    'medium': 'bg-warning/10 text-warning border-warning/20',
    'hard': 'bg-destructive/10 text-destructive border-destructive/20'
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate('/')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          返回题库
        </Button>

        <Card className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl font-bold text-foreground">{question.title}</h1>
              {submitted && (
                <Badge variant={isCorrect ? 'default' : 'destructive'} className="flex-shrink-0">
                  {isCorrect ? <CheckCircle2 className="h-4 w-4 mr-1" /> : <XCircle className="h-4 w-4 mr-1" />}
                  {isCorrect ? '正确' : '错误'}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={cn('border', difficultyColors[question.difficulty])}>
                {question.difficulty === 'easy' ? '简单' : question.difficulty === 'medium' ? '中等' : '困难'}
              </Badge>
              {question.tags?.map(tag => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-foreground whitespace-pre-wrap">{question.content}</p>

            {question.type === 'single' && question.options && (
              <RadioGroup value={userAnswer as string} onValueChange={setUserAnswer} disabled={submitted}>
                {question.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50">
                    <RadioGroupItem value={option} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {question.type === 'multiple' && question.options && (
              <div className="space-y-2">
                {question.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50">
                    <Checkbox
                      id={`option-${index}`}
                      checked={(userAnswer as string[])?.includes(option)}
                      onCheckedChange={() => handleMultipleChoice(option)}
                      disabled={submitted}
                    />
                    <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            )}

            {(question.type === 'blank' || question.type === 'essay') && (
              <Textarea
                value={userAnswer as string}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="请输入你的答案..."
                disabled={submitted}
                rows={question.type === 'essay' ? 6 : 3}
              />
            )}
          </div>

          {!submitted && (
            <Button onClick={handleSubmit} className="w-full" size="lg">
              提交答案
            </Button>
          )}

          {showExplanation && question.explanation && (
            <Card className="p-4 bg-muted/50 border-primary/20">
              <div className="flex items-start gap-3">
                <Lightbulb className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="space-y-2 flex-1">
                  <h3 className="font-semibold text-foreground">解析</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{question.explanation}</p>
                  {!isCorrect && (
                    <p className="text-sm font-medium text-foreground">
                      正确答案：{Array.isArray(question.correctAnswer) 
                        ? question.correctAnswer.join('、')
                        : question.correctAnswer}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          )}

          <div className="flex gap-2">
            {!showExplanation && submitted && (
              <Button onClick={() => setShowExplanation(true)} variant="outline" className="gap-2">
                <Lightbulb className="h-4 w-4" />
                查看解析
              </Button>
            )}

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 bg-ai/10 border-ai/20 hover:bg-ai/20">
                  <MessageSquare className="h-4 w-4" />
                  AI 问答
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-ai" />
                    AI 智能问答
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>向 AI 提问关于这道题的任何问题</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="例如：这道题的解题思路是什么？"
                        value={aiQuestion}
                        onChange={(e) => setAiQuestion(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAiQuestion()}
                      />
                      <Button onClick={handleAiQuestion} disabled={isAiLoading} className="gap-2">
                        <Send className="h-4 w-4" />
                        {isAiLoading ? '思考中...' : '发送'}
                      </Button>
                    </div>
                  </div>

                  {aiResponse && (
                    <Card className="p-4 bg-muted/50">
                      <p className="text-sm text-foreground whitespace-pre-wrap">{aiResponse}</p>
                    </Card>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
