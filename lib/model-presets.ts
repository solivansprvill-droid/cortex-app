export interface ModelPreset {
  name: string;
  baseUrl: string;
  model: string;
  description: string;
}

export const MODEL_PRESETS: ModelPreset[] = [
  // EdgeFn (推荐)
  {
    name: 'EdgeFn (Hermes)',
    baseUrl: 'https://api.edgefn.net/v1',
    model: 'nousresearch/hermes-3-llama-3.1-405b',
    description: 'Nous Research Hermes 3 via EdgeFn',
  },

  // OpenAI
  {
    name: 'OpenAI GPT-4o',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o',
    description: 'OpenAI GPT-4 Omni',
  },
  {
    name: 'OpenAI GPT-4 Turbo',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4-turbo',
    description: 'OpenAI GPT-4 Turbo',
  },
  {
    name: 'OpenAI GPT-3.5 Turbo',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-3.5-turbo',
    description: 'OpenAI GPT-3.5 Turbo',
  },

  // Anthropic Claude
  {
    name: 'Claude 3.5 Sonnet',
    baseUrl: 'https://api.anthropic.com/v1',
    model: 'claude-3-5-sonnet-20241022',
    description: 'Anthropic Claude 3.5 Sonnet',
  },
  {
    name: 'Claude 3 Opus',
    baseUrl: 'https://api.anthropic.com/v1',
    model: 'claude-3-opus-20240229',
    description: 'Anthropic Claude 3 Opus',
  },

  // Google Gemini
  {
    name: 'Gemini 2.0 Flash',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    model: 'gemini-2.0-flash',
    description: 'Google Gemini 2.0 Flash',
  },
  {
    name: 'Gemini 1.5 Pro',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    model: 'gemini-1.5-pro',
    description: 'Google Gemini 1.5 Pro',
  },

  // Mistral
  {
    name: 'Mistral Large',
    baseUrl: 'https://api.mistral.ai/v1',
    model: 'mistral-large-latest',
    description: 'Mistral Large',
  },
  {
    name: 'Mistral Medium',
    baseUrl: 'https://api.mistral.ai/v1',
    model: 'mistral-medium-latest',
    description: 'Mistral Medium',
  },

  // Nous Research (via OpenRouter)
  {
    name: 'Nous Hermes 3 (OpenRouter)',
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'nousresearch/hermes-3-llama-3.1-405b',
    description: 'Nous Research Hermes 3 via OpenRouter',
  },
  {
    name: 'Nous Hermes 2 (OpenRouter)',
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'nousresearch/nous-hermes-2-mixtral-8x7b-dpo',
    description: 'Nous Research Hermes 2 Mixtral via OpenRouter',
  },

  // Meta Llama (via OpenRouter)
  {
    name: 'Llama 3.1 405B (OpenRouter)',
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'meta-llama/llama-3.1-405b-instruct',
    description: 'Meta Llama 3.1 405B via OpenRouter',
  },
  {
    name: 'Llama 3.1 70B (OpenRouter)',
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'meta-llama/llama-3.1-70b-instruct',
    description: 'Meta Llama 3.1 70B via OpenRouter',
  },

  // Qwen (via OpenRouter)
  {
    name: 'Qwen 2 72B (OpenRouter)',
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'qwen/qwen-2-72b-instruct',
    description: 'Alibaba Qwen 2 72B via OpenRouter',
  },

  // DeepSeek (via OpenRouter)
  {
    name: 'DeepSeek V3 (OpenRouter)',
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'deepseek/deepseek-chat',
    description: 'DeepSeek V3 via OpenRouter',
  },

  // Groq
  {
    name: 'Mixtral 8x7B (Groq)',
    baseUrl: 'https://api.groq.com/openai/v1',
    model: 'mixtral-8x7b-32768',
    description: 'Mixtral 8x7B via Groq',
  },
  {
    name: 'Llama 3 70B (Groq)',
    baseUrl: 'https://api.groq.com/openai/v1',
    model: 'llama-3-70b-8192',
    description: 'Llama 3 70B via Groq',
  },

  // Together AI
  {
    name: 'Llama 2 70B (Together)',
    baseUrl: 'https://api.together.xyz/v1',
    model: 'meta-llama/Llama-2-70b-chat-hf',
    description: 'Meta Llama 2 70B via Together AI',
  },

  // Replicate
  {
    name: 'Llama 2 70B (Replicate)',
    baseUrl: 'https://api.replicate.com/v1',
    model: 'meta/llama-2-70b-chat',
    description: 'Meta Llama 2 70B via Replicate',
  },

  // Local Ollama
  {
    name: 'Local Ollama',
    baseUrl: 'http://localhost:11434/v1',
    model: 'llama2',
    description: 'Local Ollama instance',
  },
];

export function getPresetByModel(model: string): ModelPreset | undefined {
  return MODEL_PRESETS.find((p) => p.model === model);
}

export function getPresetsByBaseUrl(baseUrl: string): ModelPreset[] {
  return MODEL_PRESETS.filter((p) => p.baseUrl === baseUrl);
}
