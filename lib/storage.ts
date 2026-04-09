import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Conversation, ModelConfig, DEFAULT_MODEL_CONFIG } from './types';

const CONVERSATIONS_KEY = 'hermes_conversations';
const MODEL_CONFIG_KEY = 'hermes_model_config';
const API_KEY_SECURE = 'hermes_api_key';

// ─── Conversations ────────────────────────────────────────────────────────────

export async function loadConversations(): Promise<Conversation[]> {
  try {
    const raw = await AsyncStorage.getItem(CONVERSATIONS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Conversation[];
  } catch {
    return [];
  }
}

export async function saveConversations(conversations: Conversation[]): Promise<void> {
  await AsyncStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
}

export async function deleteConversation(id: string): Promise<void> {
  const convs = await loadConversations();
  await saveConversations(convs.filter((c) => c.id !== id));
}

export async function clearAllConversations(): Promise<void> {
  await AsyncStorage.removeItem(CONVERSATIONS_KEY);
}

// ─── Model Config ─────────────────────────────────────────────────────────────

export async function loadModelConfig(): Promise<ModelConfig> {
  try {
    const raw = await AsyncStorage.getItem(MODEL_CONFIG_KEY);
    const config: ModelConfig = raw ? { ...DEFAULT_MODEL_CONFIG, ...JSON.parse(raw) } : { ...DEFAULT_MODEL_CONFIG };
    // Load API key from secure store
    const apiKey = await SecureStore.getItemAsync(API_KEY_SECURE);
    config.apiKey = apiKey ?? '';
    return config;
  } catch {
    return { ...DEFAULT_MODEL_CONFIG };
  }
}

export async function saveModelConfig(config: ModelConfig): Promise<void> {
  // Save API key separately in secure store
  await SecureStore.setItemAsync(API_KEY_SECURE, config.apiKey);
  const { apiKey: _apiKey, ...rest } = config;
  await AsyncStorage.setItem(MODEL_CONFIG_KEY, JSON.stringify(rest));
}
