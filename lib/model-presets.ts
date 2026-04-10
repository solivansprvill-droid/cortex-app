export interface ModelPreset {
  name: string;
  baseUrl: string;
  model: string;
  description: string;
  /** API 协议类型，默认 openai-compatible */
  apiType?: 'openai' | 'anthropic' | 'google';
}

export const MODEL_PRESETS: ModelPreset[] = [
  // ── OpenRouter (聚合平台，推荐) ──────────────────────────────────────────────
  {
    name: 'OpenRouter Auto',
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'auto',
    description: 'OpenRouter 自动路由',
    apiType: 'openai',
  },
  {
    name: 'DeepSeek R1 (Free)',
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'deepseek/deepseek-r1:free',
    description: 'DeepSeek R1 免费版 via OpenRouter',
    apiType: 'openai',
  },
  {
    name: 'Gemini 2.5 Flash (Free)',
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'google/gemini-2.5-flash-preview:thinking',
    description: 'Gemini 2.5 Flash 免费版 via OpenRouter',
    apiType: 'openai',
  },
  {
    name: 'Claude Sonnet 4 (OpenRouter)',
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'anthropic/claude-sonnet-4',
    description: 'Claude Sonnet 4 via OpenRouter',
    apiType: 'openai',
  },
  {
    name: 'GPT-4.1 (OpenRouter)',
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'openai/gpt-4.1',
    description: 'GPT-4.1 via OpenRouter',
    apiType: 'openai',
  },
  {
    name: 'Nous Hermes 3 (OpenRouter)',
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'nousresearch/hermes-3-llama-3.1-405b',
    description: 'Nous Hermes 3 via OpenRouter',
    apiType: 'openai',
  },
  {
    name: 'Llama 3.1 405B (OpenRouter)',
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'meta-llama/llama-3.1-405b-instruct',
    description: 'Meta Llama 3.1 405B via OpenRouter',
    apiType: 'openai',
  },

  // ── OpenAI ───────────────────────────────────────────────────────────────────
  {
    name: 'GPT-4.1',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4.1',
    description: 'OpenAI GPT-4.1',
    apiType: 'openai',
  },
  {
    name: 'GPT-4.1 Mini',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4.1-mini',
    description: 'OpenAI GPT-4.1 Mini',
    apiType: 'openai',
  },
  {
    name: 'GPT-4o',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o',
    description: 'OpenAI GPT-4 Omni',
    apiType: 'openai',
  },
  {
    name: 'o4 Mini',
    baseUrl: 'https://api.openai.com/v1',
    model: 'o4-mini',
    description: 'OpenAI o4 Mini (推理)',
    apiType: 'openai',
  },

  // ── Anthropic Claude ─────────────────────────────────────────────────────────
  {
    name: 'Claude Sonnet 4.6',
    baseUrl: 'https://api.anthropic.com/v1',
    model: 'claude-sonnet-4-6',
    description: 'Anthropic Claude Sonnet 4.6',
    apiType: 'anthropic',
  },
  {
    name: 'Claude Haiku 4.5',
    baseUrl: 'https://api.anthropic.com/v1',
    model: 'claude-haiku-4-5',
    description: 'Anthropic Claude Haiku 4.5',
    apiType: 'anthropic',
  },
  {
    name: 'Claude 3.5 Sonnet',
    baseUrl: 'https://api.anthropic.com/v1',
    model: 'claude-3-5-sonnet-20241022',
    description: 'Anthropic Claude 3.5 Sonnet',
    apiType: 'anthropic',
  },

  // ── Google Gemini (OpenAI-compat endpoint) ───────────────────────────────────
  {
    name: 'Gemini 2.5 Flash',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    model: 'gemini-2.5-flash-preview-04-17',
    description: 'Google Gemini 2.5 Flash (OpenAI 兼容)',
    apiType: 'openai',
  },
  {
    name: 'Gemini 2.5 Pro',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    model: 'gemini-2.5-pro-preview-03-25',
    description: 'Google Gemini 2.5 Pro (OpenAI 兼容)',
    apiType: 'openai',
  },
  {
    name: 'Gemini 2.0 Flash',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    model: 'gemini-2.0-flash',
    description: 'Google Gemini 2.0 Flash (OpenAI 兼容)',
    apiType: 'openai',
  },

  // ── DeepSeek ─────────────────────────────────────────────────────────────────
  {
    name: 'DeepSeek V3',
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    description: 'DeepSeek V3',
    apiType: 'openai',
  },
  {
    name: 'DeepSeek R1',
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-reasoner',
    description: 'DeepSeek R1 (推理)',
    apiType: 'openai',
  },

  // ── xAI Grok ─────────────────────────────────────────────────────────────────
  {
    name: 'Grok 3',
    baseUrl: 'https://api.x.ai/v1',
    model: 'grok-3',
    description: 'xAI Grok 3',
    apiType: 'openai',
  },
  {
    name: 'Grok 3 Mini',
    baseUrl: 'https://api.x.ai/v1',
    model: 'grok-3-mini',
    description: 'xAI Grok 3 Mini (推理)',
    apiType: 'openai',
  },

  // ── Mistral ──────────────────────────────────────────────────────────────────
  {
    name: 'Mistral Large',
    baseUrl: 'https://api.mistral.ai/v1',
    model: 'mistral-large-latest',
    description: 'Mistral Large',
    apiType: 'openai',
  },

  // ── Groq ─────────────────────────────────────────────────────────────────────
  {
    name: 'Llama 3.3 70B (Groq)',
    baseUrl: 'https://api.groq.com/openai/v1',
    model: 'llama-3.3-70b-versatile',
    description: 'Llama 3.3 70B via Groq',
    apiType: 'openai',
  },
  {
    name: 'DeepSeek R1 (Groq)',
    baseUrl: 'https://api.groq.com/openai/v1',
    model: 'deepseek-r1-distill-llama-70b',
    description: 'DeepSeek R1 Distill via Groq',
    apiType: 'openai',
  },

  // ── Local Ollama ─────────────────────────────────────────────────────────────
  {
    name: 'Local Ollama',
    baseUrl: 'http://localhost:11434/v1',
    model: 'llama3',
    description: '本地 Ollama 实例',
    apiType: 'openai',
  },
];

export function getPresetByModel(model: string): ModelPreset | undefined {
  return MODEL_PRESETS.find((p) => p.model === model);
}

export function getPresetsByBaseUrl(baseUrl: string): ModelPreset[] {
  return MODEL_PRESETS.filter((p) => p.baseUrl === baseUrl);
}
