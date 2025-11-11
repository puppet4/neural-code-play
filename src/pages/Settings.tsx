import Layout from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { storage } from '@/lib/storage';
import { Trash2, Download, Upload, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function Settings() {
  const handleClearAnswers = () => {
    storage.clearAnswers();
    toast.success('答题记录已清空');
  };

  const handleResetAll = () => {
    storage.resetAll();
    toast.success('所有数据已重置');
    window.location.reload();
  };

  const handleExport = () => {
    const data = {
      questions: storage.getQuestions(),
      answers: storage.getAnswers(),
      exportTime: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `codequiz-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('数据已导出');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target?.result as string);
            if (data.questions) {
              storage.saveQuestions(data.questions);
            }
            toast.success('数据已导入');
            window.location.reload();
          } catch (error) {
            toast.error('导入失败：文件格式错误');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-foreground">设置</h1>
          <p className="text-muted-foreground mt-1">管理你的数据和应用配置</p>
        </div>

        <Card className="p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-4 text-foreground">数据管理</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <p className="font-medium text-foreground">导出数据</p>
                  <p className="text-sm text-muted-foreground">导出题库和答题记录</p>
                </div>
                <Button variant="outline" onClick={handleExport} className="gap-2">
                  <Download className="h-4 w-4" />
                  导出
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <p className="font-medium text-foreground">导入数据</p>
                  <p className="text-sm text-muted-foreground">从文件导入题库</p>
                </div>
                <Button variant="outline" onClick={handleImport} className="gap-2">
                  <Upload className="h-4 w-4" />
                  导入
                </Button>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4 text-foreground">危险操作</h2>
            <div className="space-y-3">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <div className="flex items-center justify-between p-4 rounded-lg border border-warning/20 bg-warning/5">
                    <div>
                      <p className="font-medium text-foreground">清空答题记录</p>
                      <p className="text-sm text-muted-foreground">删除所有答题历史，不影响题库</p>
                    </div>
                    <Button variant="outline" className="gap-2 border-warning text-warning hover:bg-warning/10">
                      <Trash2 className="h-4 w-4" />
                      清空
                    </Button>
                  </div>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-warning" />
                      确认清空答题记录？
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      此操作将删除所有答题历史记录，但不会影响题库。此操作不可撤销。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>取消</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearAnswers}>确认清空</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/20 bg-destructive/5">
                    <div>
                      <p className="font-medium text-foreground">重置所有数据</p>
                      <p className="text-sm text-muted-foreground">删除所有数据并恢复默认题库</p>
                    </div>
                    <Button variant="destructive" className="gap-2">
                      <Trash2 className="h-4 w-4" />
                      重置
                    </Button>
                  </div>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      确认重置所有数据？
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      此操作将删除所有题库和答题记录，并恢复到初始状态。此操作不可撤销！
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>取消</AlertDialogCancel>
                    <AlertDialogAction onClick={handleResetAll} className="bg-destructive text-destructive-foreground">
                      确认重置
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4 text-foreground">关于</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>CodeQuiz AI - 智能刷题助手</p>
            <p>版本 1.0.0</p>
            <p>一个帮助程序员高效刷题的智能学习平台</p>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
