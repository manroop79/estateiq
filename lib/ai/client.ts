/**
 * AI Client for OpenAI and Anthropic
 */

import { AI_CONFIG } from './config';

interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Call OpenAI API
 */
async function callOpenAI(prompt: string): Promise<AIResponse> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AI_CONFIG.openai.apiKey}`,
    },
    body: JSON.stringify({
      model: AI_CONFIG.openai.model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert real estate document analyst. Provide accurate, structured responses in JSON format.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent outputs
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  
  return {
    content: data.choices[0].message.content,
    usage: {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens,
    },
  };
}

/**
 * Call Anthropic API
 */
async function callAnthropic(prompt: string): Promise<AIResponse> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': AI_CONFIG.anthropic.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: AI_CONFIG.anthropic.model,
      max_tokens: 4096,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Anthropic API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  
  return {
    content: data.content[0].text,
    usage: {
      promptTokens: data.usage.input_tokens,
      completionTokens: data.usage.output_tokens,
      totalTokens: data.usage.input_tokens + data.usage.output_tokens,
    },
  };
}

/**
 * Main AI call function - routes to appropriate provider
 */
export async function callAI(prompt: string): Promise<AIResponse> {
  console.log(`Calling ${AI_CONFIG.provider} AI...`);
  
  if (AI_CONFIG.provider === 'openai') {
    return callOpenAI(prompt);
  } else {
    return callAnthropic(prompt);
  }
}

/**
 * Parse JSON response from AI
 */
export function parseAIResponse<T>(response: AIResponse): T {
  try {
    return JSON.parse(response.content);
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    console.error('Raw response:', response.content);
    throw new Error('AI returned invalid JSON response');
  }
}

/**
 * Call AI and parse response in one go
 */
export async function callAndParseAI<T>(prompt: string): Promise<T> {
  const response = await callAI(prompt);
  return parseAIResponse<T>(response);
}

