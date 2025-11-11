import { Question } from '@/types/question';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Code2, Database, Layout, Globe, Blocks, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuestionCardProps {
  question: Question;
  onClick: () => void;
  isAttempted?: boolean;
  isCorrect?: boolean;
}

const categoryIcons = {
  'algorithm': Code2,
  'data-structure': Blocks,
  'system-design': Layout,
  'database': Database,
  'web': Globe,
  'other': Tag
};

const categoryLabels = {
  'algorithm': '算法',
  'data-structure': '数据结构',
  'system-design': '系统设计',
  'database': '数据库',
  'web': 'Web开发',
  'other': '其他'
};

const difficultyColors = {
  'easy': 'bg-success/10 text-success border-success/20',
  'medium': 'bg-warning/10 text-warning border-warning/20',
  'hard': 'bg-destructive/10 text-destructive border-destructive/20'
};

const difficultyLabels = {
  'easy': '简单',
  'medium': '中等',
  'hard': '困难'
};

export default function QuestionCard({ question, onClick, isAttempted, isCorrect }: QuestionCardProps) {
  const Icon = categoryIcons[question.category];

  return (
    <Card
      onClick={onClick}
      className={cn(
        'p-4 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1',
        isAttempted && isCorrect && 'border-success/50 bg-success/5',
        isAttempted && !isCorrect && 'border-destructive/50 bg-destructive/5'
      )}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Icon className="h-5 w-5 text-primary flex-shrink-0" />
            <h3 className="font-semibold text-foreground truncate">{question.title}</h3>
          </div>
          {isAttempted && (
            <Badge variant={isCorrect ? 'default' : 'destructive'} className="flex-shrink-0">
              {isCorrect ? '已正确' : '已错误'}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs">
            {categoryLabels[question.category]}
          </Badge>
          <Badge className={cn('text-xs border', difficultyColors[question.difficulty])}>
            {difficultyLabels[question.difficulty]}
          </Badge>
          {question.tags?.slice(0, 2).map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2">
          {question.content}
        </p>
      </div>
    </Card>
  );
}
