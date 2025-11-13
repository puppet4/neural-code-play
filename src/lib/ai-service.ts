import {
  AIMessage,
  AIResponse,
  StreamAIResponse,
  ChatCompletionRequest,
  OpenAIResponse,
  DeepSeekResponse,
  QwenResponse,
  AIProvider
} from '@/types/ai';
import { Question } from '@/types/question';
import { AIConfigService } from './ai-config';

export class AIService {
  // 解析流式响应的辅助函数
  private static async* parseStreamResponse(response: Response, provider: AIProvider): AsyncGenerator<string, void, unknown> {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    if (!reader) {
      throw new Error('无法读取流式响应');
    }

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;

          const data = trimmedLine.slice(6); // 移除 'data: ' 前缀
          if (data === '[DONE]') return;

          try {
            const parsed = JSON.parse(data);
            let content = '';

            // 根据不同provider解析流式响应格式
            switch (provider) {
              case 'openai':
              case 'deepseek':
              case 'custom':
                content = parsed.choices?.[0]?.delta?.content || '';
                break;
              case 'qwen':
                content = parsed.output?.choices?.[0]?.message?.content || '';
                break;
            }

            if (content) {
              yield content;
            }
          } catch (e) {
            // 忽略JSON解析错误，继续处理下一行
            continue;
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  private static async makeRequest(url: string, options: RequestInit): Promise<Response> {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API调用失败 (${response.status}): ${error}`);
    }

    return response;
  }

  // 流式调用OpenAI/DeepSeek API
  private static async callOpenAIStream(messages: AIMessage[], model: string, apiKey: string, baseUrl: string): Promise<StreamAIResponse> {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API调用失败 (${response.status}): ${error}`);
    }

    const contentGenerator = this.parseStreamResponse(response.clone(), 'openai');
    let fullContent = '';

    const fullContentPromise = (async () => {
      for await (const chunk of this.parseStreamResponse(response.clone(), 'openai')) {
        fullContent += chunk;
      }
      return fullContent;
    })();

    return {
      content: contentGenerator,
      fullContent: fullContentPromise
    };
  }

  // 流式调用Qwen API
  private static async callQwenStream(messages: AIMessage[], model: string, apiKey: string, baseUrl: string): Promise<StreamAIResponse> {
    const response = await fetch(`${baseUrl}/services/aigc/text-generation/generation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-DashScope-SSE': 'enable',
      },
      body: JSON.stringify({
        model,
        input: {
          messages
        },
        parameters: {
          temperature: 0.7,
          max_tokens: 2000,
          incremental_output: true
        }
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API调用失败 (${response.status}): ${error}`);
    }

    const contentGenerator = this.parseStreamResponse(response.clone(), 'qwen');
    let fullContent = '';

    const fullContentPromise = (async () => {
      for await (const chunk of this.parseStreamResponse(response.clone(), 'qwen')) {
        fullContent += chunk;
      }
      return fullContent;
    })();

    return {
      content: contentGenerator,
      fullContent: fullContentPromise
    };
  }

  private static async callOpenAI(messages: AIMessage[], model: string, apiKey: string, baseUrl: string): Promise<AIResponse> {
    const response = await this.makeRequest(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    const data: OpenAIResponse = await response.json();

    return {
      content: data.choices[0]?.message?.content || '',
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      } : undefined,
    };
  }

  private static async callDeepSeek(messages: AIMessage[], model: string, apiKey: string, baseUrl: string): Promise<AIResponse> {
    // DeepSeek使用OpenAI兼容的API格式
    const response = await this.makeRequest(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    const data: DeepSeekResponse = await response.json();

    return {
      content: data.choices[0]?.message?.content || '',
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      } : undefined,
    };
  }

  private static async callQwen(messages: AIMessage[], model: string, apiKey: string, baseUrl: string): Promise<AIResponse> {
    // 阿里云千问API格式
    const response = await this.makeRequest(`${baseUrl}/services/aigc/text-generation/generation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        input: {
          messages
        },
        parameters: {
          temperature: 0.7,
          max_tokens: 2000,
        }
      }),
    });

    const data: QwenResponse = await response.json();

    return {
      content: data.output?.choices[0]?.message?.content || '',
      usage: data.usage ? {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.total_tokens,
      } : undefined,
    };
  }

  private static async callCustomAPI(messages: AIMessage[], model: string, apiKey: string, baseUrl: string): Promise<AIResponse> {
    // 假设自定义API使用OpenAI兼容格式
    return this.callOpenAI(messages, model, apiKey, baseUrl);
  }

  // 非流式聊天方法
  static async chat(question: string, context?: string): Promise<AIResponse> {
    const config = AIConfigService.getConfig();

    if (!AIConfigService.isConfigured()) {
      throw new Error('请先在设置中配置AI服务');
    }

    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `你是一个专业的编程学习助手。用户会向你询问关于编程题目的问题。${context ? `题目信息：${context}` : ''}`
      },
      {
        role: 'user',
        content: question
      }
    ];

    const baseUrl = config.baseUrl || AIConfigService.getProviderBaseUrl(config.provider, config.baseUrl);

    try {
      switch (config.provider) {
        case 'openai':
          return await this.callOpenAI(messages, config.model, config.apiKey, baseUrl);
        case 'deepseek':
          return await this.callDeepSeek(messages, config.model, config.apiKey, baseUrl);
        case 'qwen':
          return await this.callQwen(messages, config.model, config.apiKey, baseUrl);
        case 'custom':
          return await this.callCustomAPI(messages, config.model, config.apiKey, baseUrl);
        default:
          throw new Error(`不支持的AI提供商: ${config.provider}`);
      }
    } catch (error) {
      console.error('AI API调用失败:', error);
      throw new Error(error instanceof Error ? error.message : 'AI服务暂时不可用，请稍后重试');
    }
  }

  // 流式聊天方法
  static async chatStream(question: string, context?: string): Promise<StreamAIResponse> {
    const config = AIConfigService.getConfig();

    if (!AIConfigService.isConfigured()) {
      throw new Error('请先在设置中配置AI服务');
    }

    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `你是一个专业的编程学习助手。用户会向你询问关于编程题目的问题。${context ? `题目信息：${context}` : ''}`
      },
      {
        role: 'user',
        content: question
      }
    ];

    const baseUrl = config.baseUrl || AIConfigService.getProviderBaseUrl(config.provider, config.baseUrl);

    try {
      switch (config.provider) {
        case 'openai':
          return await this.callOpenAIStream(messages, config.model, config.apiKey, baseUrl);
        case 'deepseek':
          return await this.callOpenAIStream(messages, config.model, config.apiKey, baseUrl);
        case 'qwen':
          return await this.callQwenStream(messages, config.model, config.apiKey, baseUrl);
        case 'custom':
          return await this.callOpenAIStream(messages, config.model, config.apiKey, baseUrl);
        default:
          throw new Error(`不支持的AI提供商: ${config.provider}`);
      }
    } catch (error) {
      console.error('AI流式调用失败:', error);
      throw new Error(error instanceof Error ? error.message : 'AI服务暂时不可用，请稍后重试');
    }
  }

  // 生成题目上下文，根据配置决定是否包含答案
  private static generateQuestionContext(
    question: Question,
    isSubmitted: boolean,
    includeAnswerPolicy: 'never' | 'after_submit' | 'always'
  ): string {
    let context = `题目标题：${question.title}\n题目内容：${question.content}`;

    // 添加选择项（如果有的话）
    if (question.options && question.options.length > 0) {
      context += '\n选项：\n' + question.options.map((opt, idx) =>
        `${String.fromCharCode(65 + idx)}. ${opt}`
      ).join('\n');
    }

    // 根据策略决定是否包含答案
    let shouldIncludeAnswer = false;
    switch (includeAnswerPolicy) {
      case 'always':
        shouldIncludeAnswer = true;
        break;
      case 'after_submit':
        shouldIncludeAnswer = isSubmitted;
        break;
      case 'never':
        shouldIncludeAnswer = false;
        break;
    }

    if (shouldIncludeAnswer) {
      const answerText = Array.isArray(question.correctAnswer)
        ? question.correctAnswer.join('、')
        : question.correctAnswer;
      context += `\n正确答案：${answerText}`;

      if (question.explanation) {
        context += `\n答案解析：${question.explanation}`;
      }
    }

    return context;
  }

  static async askAboutQuestion(question: string, questionTitle: string, questionContent: string): Promise<AIResponse> {
    const context = `题目标题：${questionTitle}\n题目内容：${questionContent}`;
    return this.chat(question, context);
  }

  static async askAboutQuestionStream(question: string, questionTitle: string, questionContent: string): Promise<StreamAIResponse> {
    const context = `题目标题：${questionTitle}\n题目内容：${questionContent}`;
    return this.chatStream(question, context);
  }

  // 新的智能问答方法，支持完整题目对象和提交状态
  static async askAboutQuestionWithContext(
    userQuestion: string,
    question: Question,
    isSubmitted: boolean
  ): Promise<AIResponse> {
    const config = AIConfigService.getConfig();
    const context = this.generateQuestionContext(question, isSubmitted, config.includeAnswerPolicy);
    return this.chat(userQuestion, context);
  }

  static async askAboutQuestionWithContextStream(
    userQuestion: string,
    question: Question,
    isSubmitted: boolean
  ): Promise<StreamAIResponse> {
    const config = AIConfigService.getConfig();
    const context = this.generateQuestionContext(question, isSubmitted, config.includeAnswerPolicy);
    return this.chatStream(userQuestion, context);
  }
}