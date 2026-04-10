export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: number;
  isStreaming?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface ModelConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

export interface TelegramConfig {
  enabled: boolean;
  botToken: string;
  chatId: string;
}

export interface HomeAssistantConfig {
  enabled: boolean;
  url: string;          // e.g. http://homeassistant.local:8123
  token: string;        // Long-Lived Access Token
  notifyService: string; // e.g. notify.mobile_app_phone
}

export interface GatewayConfig {
  telegram: TelegramConfig;
  homeAssistant: HomeAssistantConfig;
}

export const DEFAULT_GATEWAY_CONFIG: GatewayConfig = {
  telegram: { enabled: false, botToken: '', chatId: '' },
  homeAssistant: { enabled: false, url: 'http://homeassistant.local:8123', token: '', notifyService: 'notify.notify' },
};

export const DEFAULT_MODEL_CONFIG: ModelConfig = {
  baseUrl: 'https://api.edgefn.net/v1',
  apiKey: '',
  model: 'nousresearch/hermes-3-llama-3.1-405b',
  temperature: 0.7,
  maxTokens: 8192,
  systemPrompt:
    'You are Cortex, a helpful and intelligent AI assistant. You are knowledgeable, thoughtful, and precise. Help users with their questions and tasks.',
};
