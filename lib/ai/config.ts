/**
 * AI Configuration
 * Supports OpenAI and Anthropic (Claude)
 */

export const AI_CONFIG = {
  // Choose provider: 'openai' or 'anthropic'
  provider: (process.env.AI_PROVIDER || 'openai') as 'openai' | 'anthropic',
  
  // API Keys
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
  },
  
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    model: process.env.ANTHROPIC_MODEL || 'claude-3-opus-20240229',
  },
  
  // Feature flags
  features: {
    summarization: true,
    legalAnalysis: true,
    riskAssessment: true,
    fieldValidation: true,
    crossDocumentAnalysis: true,
  },
};

export function isAIConfigured(): boolean {
  if (AI_CONFIG.provider === 'openai') {
    return !!AI_CONFIG.openai.apiKey;
  }
  return !!AI_CONFIG.anthropic.apiKey;
}

export function getAIProvider(): 'openai' | 'anthropic' {
  return AI_CONFIG.provider;
}

