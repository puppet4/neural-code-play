import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { storage } from '@/lib/storage';
import { AIConfigService } from '@/lib/ai-config';
import { AIConfig, AI_MODELS, AIProvider } from '@/types/ai';
import { Trash2, Download, Upload, AlertTriangle, Bot, Save, Eye, EyeOff } from 'lucide-react';
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
  const [aiConfig, setAiConfig] = useState<AIConfig>(() => AIConfigService.getConfig());
  const [showApiKey, setShowApiKey] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    setAiConfig(AIConfigService.getConfig());
  }, []);

  const handleAiConfigChange = (field: keyof AIConfig, value: string) => {
    const newConfig = { ...aiConfig, [field]: value };

    // 切换provider时重置模型
    if (field === 'provider') {
      const provider = value as AIProvider;
      const availableModels = AI_MODELS[provider] || [];
      newConfig.model = availableModels[0] || '';
    }

    setAiConfig(newConfig);
    setErrors([]);
  };

  const handleSaveAiConfig = () => {
    const validationErrors = AIConfigService.validateConfig(aiConfig);

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      toast.error('配置验证失败，请检查输入');
      return;
    }

    try {
      AIConfigService.saveConfig(aiConfig);
      toast.success('AI配置已保存');
      setErrors([]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '保存配置失败');
    }
  };

  const providerLabels = {
    openai: 'OpenAI',
    deepseek: 'DeepSeek',
    qwen: 'Qwen (千问)',
    custom: '自定义服务'
  };

  const handleClearAnswers = () => {
    storage.clearAnswers();
    toast.success('答题记录已清空');
  };

  const handleResetAll = () => {
    storage.resetAll();
    toast.success('所有数据已重置');
    window.location.reload();
  };

  const handleExport = async () => {
    const questions = await storage.getQuestions();
    const answers = await storage.getAnswers();
    const data = {
      questions,
      answers,
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

        <Tabs defaultValue="ai" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ai" className="gap-2">
              <Bot className="h-4 w-4" />
              AI 配置
            </TabsTrigger>
            <TabsTrigger value="data">数据管理</TabsTrigger>
          </TabsList>

          <TabsContent value="ai" className="mt-6">
            <Card className="p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-4 text-foreground">AI 服务配置</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  配置AI服务以启用智能问答功能。你的API密钥将安全存储在本地浏览器中。
                </p>

                {errors.length > 0 && (
                  <Card className="p-4 bg-destructive/10 border-destructive/20 mb-6">
                    <div className="space-y-1">
                      {errors.map((error, index) => (
                        <p key={index} className="text-sm text-destructive">• {error}</p>
                      ))}
                    </div>
                  </Card>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="provider">AI 服务提供商</Label>
                    <Select value={aiConfig.provider} onValueChange={(value) => handleAiConfigChange('provider', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择AI服务提供商" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(providerLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="apiKey">API 密钥</Label>
                    <div className="flex gap-2">
                      <Input
                        id="apiKey"
                        type={showApiKey ? 'text' : 'password'}
                        value={aiConfig.apiKey}
                        onChange={(e) => handleAiConfigChange('apiKey', e.target.value)}
                        placeholder="请输入您的API密钥"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="model">模型</Label>
                    <Select value={aiConfig.model} onValueChange={(value) => handleAiConfigChange('model', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择模型" />
                      </SelectTrigger>
                      <SelectContent>
                        {(AI_MODELS[aiConfig.provider] || []).map((model) => (
                          <SelectItem key={model} value={model}>
                            {model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="includeAnswerPolicy">答案包含策略</Label>
                    <Select value={aiConfig.includeAnswerPolicy} onValueChange={(value) => handleAiConfigChange('includeAnswerPolicy', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择答案包含策略" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="never">从不包含答案</SelectItem>
                        <SelectItem value="after_submit">提交后包含答案</SelectItem>
                        <SelectItem value="always">始终包含答案</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      控制AI问答时是否向模型提供题目的正确答案和解析
                    </p>
                  </div>

                  {(aiConfig.provider === 'custom' || aiConfig.baseUrl) && (
                    <div className="space-y-2">
                      <Label htmlFor="baseUrl">API 地址 (可选)</Label>
                      <Input
                        id="baseUrl"
                        value={aiConfig.baseUrl || ''}
                        onChange={(e) => handleAiConfigChange('baseUrl', e.target.value)}
                        placeholder="https://api.example.com/v1"
                      />
                      <p className="text-xs text-muted-foreground">
                        留空将使用默认API地址。自定义服务必须填写。
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleSaveAiConfig} className="gap-2">
                      <Save className="h-4 w-4" />
                      保存配置
                    </Button>
                    {AIConfigService.isConfigured() && (
                      <div className="flex items-center gap-2 text-sm text-success">
                        ✓ 配置已启用
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-medium mb-3">支持的服务商</h3>
                <div className="grid gap-3 text-sm">
                  <div className="flex justify-between">
                    <span>OpenAI</span>
                    <span className="text-muted-foreground">支持 GPT-4, GPT-3.5 等模型</span>
                  </div>
                  <div className="flex justify-between">
                    <span>DeepSeek</span>
                    <span className="text-muted-foreground">支持 DeepSeek-Chat, DeepSeek-Coder 等模型</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Qwen</span>
                    <span className="text-muted-foreground">支持 Qwen-Turbo, Qwen-Plus, Qwen-Max 等模型</span>
                  </div>
                  <div className="flex justify-between">
                    <span>自定义</span>
                    <span className="text-muted-foreground">支持兼容 OpenAI API 的服务</span>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="data" className="mt-6">
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
          </TabsContent>
        </Tabs>

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