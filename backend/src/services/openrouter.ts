import axios from 'axios';

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenRouterService {
  private apiKey: string;
  private baseUrl: string = 'https://openrouter.ai/api/v1';
  private defaultModel: string = 'microsoft/wizardlm-2-8x22b'; // Free model with good performance

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENROUTER_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('OpenRouter API key is required');
    }
  }

  /**
   * Generate a response using OpenRouter API
   */
  async generateResponse(
    messages: OpenRouterMessage[],
    model?: string,
    options?: {
      temperature?: number;
      max_tokens?: number;
      top_p?: number;
    }
  ): Promise<string> {
    try {
      const modelToUse = model || this.defaultModel;
      console.log(`Generating response with OpenRouter model: ${modelToUse}`);

      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: modelToUse,
          messages: messages,
          temperature: options?.temperature || 0.7,
          max_tokens: options?.max_tokens || 1000,
          top_p: options?.top_p || 0.9,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://kiro-hackathon.vercel.app', // Optional: for tracking
            'X-Title': 'Kiro Hackathon App', // Optional: for tracking
          },
          timeout: 30000, // 30 second timeout
        }
      );

      if (response.data && response.data.choices && response.data.choices.length > 0) {
        const responseText = response.data.choices[0].message.content;
        console.log(`✓ Generated response: ${responseText.length} chars`);
        return responseText.trim();
      } else {
        throw new Error('No response generated from OpenRouter');
      }
    } catch (error) {
      console.error('OpenRouter API error:', error);
      throw new Error(`Failed to generate response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a simple text completion (for backward compatibility)
   */
  async generateText(
    prompt: string,
    model?: string,
    options?: {
      temperature?: number;
      max_tokens?: number;
    }
  ): Promise<string> {
    const messages: OpenRouterMessage[] = [
      {
        role: 'user',
        content: prompt,
      },
    ];

    return this.generateResponse(messages, model, options);
  }

  /**
   * Generate a summary using OpenRouter
   */
  async generateSummary(
    text: string,
    context?: string
  ): Promise<string> {
    const systemPrompt = `You are an expert at creating concise, accurate summaries. 
    Create a clear, well-structured summary that captures the main points and key information.
    Focus on the most important details and maintain the original meaning.`;

    const userPrompt = context 
      ? `Please summarize the following text. Context: ${context}\n\nText to summarize:\n${text}`
      : `Please summarize the following text:\n${text}`;

    const messages: OpenRouterMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    return this.generateResponse(messages, undefined, {
      temperature: 0.3, // Lower temperature for more consistent summaries
      max_tokens: 500,
    });
  }

  /**
   * Generate a chat response with context
   */
  async generateChatResponse(
    userMessage: string,
    context: string,
    systemPrompt?: string
  ): Promise<string> {
    const defaultSystemPrompt = `You are an expert video content assistant. Analyze the provided video information and give a comprehensive, detailed answer to the user's question.

INSTRUCTIONS:
1. **Be Comprehensive**: Provide a detailed explanation based on the video content
2. **Be Specific**: Reference actual content, concepts, and details from the videos
3. **Be Structured**: Organize your response logically with clear sections if needed
4. **Be Conversational**: Write in a helpful, engaging tone
5. **Be Complete**: Don't leave the user hanging - provide full explanations

SPECIAL GUIDELINES:
- If asked "what I actually did" or "what did I cover", explain the specific content, concepts, and topics covered in the video(s)
- If multiple videos are relevant, explain how they relate and what each covers
- Use the relevance scores to prioritize information from the most relevant videos
- Quote or paraphrase specific content from the videos to support your explanations
- If the user asks for details, provide thorough explanations with examples from the content`;

    const messages: OpenRouterMessage[] = [
      { role: 'system', content: systemPrompt || defaultSystemPrompt },
      { role: 'user', content: `Context:\n${context}\n\nUser Question: ${userMessage}` },
    ];

    return this.generateResponse(messages, undefined, {
      temperature: 0.7,
      max_tokens: 1000,
    });
  }

  /**
   * Check if the service is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      // Test with a simple request
      const response = await this.generateText('Hello', undefined, { max_tokens: 10 });
      return response.length > 0;
    } catch (error) {
      console.warn('OpenRouter service not available:', error);
      return false;
    }
  }

  /**
   * Get available models (simplified list of free/good models)
   */
  getAvailableModels(): string[] {
    return [
      'microsoft/wizardlm-2-8x22b', // Free, good performance
      'meta-llama/llama-3.1-8b-instruct', // Free, reliable
      'google/gemini-flash-1.5', // Free, fast
      'anthropic/claude-3-haiku', // Good performance
      'openai/gpt-3.5-turbo', // Reliable
    ];
  }
}
