import { AIConfig, AIProvider } from '@/types/ai';

const AI_CONFIG_KEY = 'ai_config';

const DEFAULT_CONFIG: AIConfig = {
  provider: 'openai',
  apiKey: '',
  model: 'gpt-4o-mini',
  includeAnswerPolicy: 'after_submit'
};

export class AIConfigService {
  static getConfig(): AIConfig {
    try {
      const saved = localStorage.getItem(AI_CONFIG_KEY);
      if (saved) {
        const config = JSON.parse(saved) as AIConfig;
        return { ...DEFAULT_CONFIG, ...config };
      }
    } catch (error) {
      console.error('Failed to load AI config:', error);
    }
    return DEFAULT_CONFIG;
  }

  static saveConfig(config: AIConfig): void {
    try {
      localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(config));
    } catch (error) {
      console.error('Failed to save AI config:', error);
      throw new Error('保存AI配置失败');
    }
  }

  static isConfigured(): boolean {
    const config = this.getConfig();
    return !!config.apiKey;
  }

  static getProviderBaseUrl(provider: AIProvider, customUrl?: string): string {
    if (customUrl) return customUrl;

    switch (provider) {
      case 'openai':
        return 'https://api.openai.com/v1';
      case 'deepseek':
        return 'https://api.deepseek.com/v1';
      case 'qwen':
        return 'https://dashscope.aliyuncs.com/api/v1';
      case 'custom':
        return '';
      default:
        throw new Error(`未支持的AI提供商: ${provider}`);
    }
  }

  static validateConfig(config: Partial<AIConfig>): string[] {
    const errors: string[] = [];

    if (!config.provider) {
      errors.push('请选择AI服务提供商');
    }

    if (!config.apiKey?.trim()) {
      errors.push('请填写API密钥');
    }

    if (!config.model?.trim()) {
      errors.push('请选择模型');
    }

    if (config.provider === 'custom' && !config.baseUrl?.trim()) {
      errors.push('自定义服务需要填写API地址');
    }

    return errors;
  }
}