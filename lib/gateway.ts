import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { GatewayConfig, DEFAULT_GATEWAY_CONFIG } from './types';

const GATEWAY_CONFIG_KEY = 'hermes_gateway_config';
const TG_TOKEN_KEY = 'hermes_tg_token';
const HA_TOKEN_KEY = 'hermes_ha_token';

// ─── Persistence ──────────────────────────────────────────────────────────────

export async function loadGatewayConfig(): Promise<GatewayConfig> {
  try {
    const raw = await AsyncStorage.getItem(GATEWAY_CONFIG_KEY);
    const base: GatewayConfig = raw
      ? { ...DEFAULT_GATEWAY_CONFIG, ...JSON.parse(raw) }
      : { ...DEFAULT_GATEWAY_CONFIG };

    const tgToken = await SecureStore.getItemAsync(TG_TOKEN_KEY);
    const haToken = await SecureStore.getItemAsync(HA_TOKEN_KEY);
    base.telegram.botToken = tgToken ?? '';
    base.homeAssistant.token = haToken ?? '';
    return base;
  } catch {
    return { ...DEFAULT_GATEWAY_CONFIG };
  }
}

export async function saveGatewayConfig(config: GatewayConfig): Promise<void> {
  await SecureStore.setItemAsync(TG_TOKEN_KEY, config.telegram.botToken);
  await SecureStore.setItemAsync(HA_TOKEN_KEY, config.homeAssistant.token);

  const sanitized: GatewayConfig = {
    telegram: { ...config.telegram, botToken: '' },
    homeAssistant: { ...config.homeAssistant, token: '' },
  };
  await AsyncStorage.setItem(GATEWAY_CONFIG_KEY, JSON.stringify(sanitized));
}

// ─── Telegram ─────────────────────────────────────────────────────────────────

/**
 * Send a message to a Telegram chat via the Bot API.
 * Supports Markdown V2 formatting.
 */
export async function sendTelegram(
  botToken: string,
  chatId: string,
  text: string
): Promise<void> {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Telegram API error ${res.status}: ${body}`);
  }
}

/**
 * Fetch the latest message updates from the Telegram bot.
 * Returns the most recent message text if available.
 */
export async function fetchTelegramUpdates(
  botToken: string,
  offset?: number
): Promise<{ updateId: number; text: string; chatId: string }[]> {
  const params = new URLSearchParams({ timeout: '0', limit: '10' });
  if (offset !== undefined) params.set('offset', String(offset));
  const url = `https://api.telegram.org/bot${botToken}/getUpdates?${params}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Telegram getUpdates error ${res.status}`);
  const json = await res.json();
  return (json.result ?? [])
    .filter((u: any) => u.message?.text)
    .map((u: any) => ({
      updateId: u.update_id as number,
      text: u.message.text as string,
      chatId: String(u.message.chat.id),
    }));
}

// ─── Home Assistant ───────────────────────────────────────────────────────────

/**
 * Send a notification via Home Assistant notify service.
 */
export async function sendHomeAssistant(
  haUrl: string,
  token: string,
  notifyService: string,
  message: string,
  title?: string
): Promise<void> {
  const base = haUrl.replace(/\/$/, '');
  // notifyService format: "notify.mobile_app_phone" → domain="notify", service="mobile_app_phone"
  const [domain, ...rest] = notifyService.split('.');
  const service = rest.join('.');
  const url = `${base}/api/services/${domain}/${service}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      message,
      title: title ?? 'Hermes Agent',
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Home Assistant API error ${res.status}: ${body}`);
  }
}

/**
 * Test Home Assistant connection by fetching the API status.
 */
export async function testHomeAssistantConnection(
  haUrl: string,
  token: string
): Promise<{ ok: boolean; message: string }> {
  try {
    const base = haUrl.replace(/\/$/, '');
    const res = await fetch(`${base}/api/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      return { ok: true, message: 'Connected successfully' };
    }
    return { ok: false, message: `HTTP ${res.status}` };
  } catch (e: any) {
    return { ok: false, message: e?.message ?? 'Connection failed' };
  }
}

/**
 * Test Telegram bot token by calling getMe.
 */
export async function testTelegramBot(
  botToken: string
): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const json = await res.json();
    if (json.ok) {
      return { ok: true, message: `Bot: @${json.result.username}` };
    }
    return { ok: false, message: json.description ?? 'Invalid token' };
  } catch (e: any) {
    return { ok: false, message: e?.message ?? 'Connection failed' };
  }
}
