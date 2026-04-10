import { Message, ModelConfig } from './types';

export interface ModelTestResult {
  ok: boolean;
  latencyMs?: number;
  message: string;
  /** First few chars of the model's reply, confirming it actually responded */
  preview?: string;
}

/**
 * Send a minimal chat request to test whether the model endpoint is reachable
 * and the API key is valid. Returns latency and a short preview of the reply.
 */
export async function testModelConnection(
  config: Pick<ModelConfig, 'baseUrl' | 'apiKey' | 'model'>
): Promise<ModelTestResult> {
  const baseUrl = config.baseUrl.replace(/\/$/, '');
  const start = Date.now();
  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
        'HTTP-Referer': 'https://hermes-agent.nousresearch.com',
        'X-Title': 'Cortex',
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 16,
        stream: false,
      }),
      signal: AbortSignal.timeout(15000),
    });

    const latencyMs = Date.now() - start;

    if (!response.ok) {
      let errBody = '';
      try { errBody = await response.text(); } catch { /* ignore */ }
      // Try to extract a clean error message from JSON
      try {
        const j = JSON.parse(errBody);
        const msg = j?.error?.message ?? j?.message ?? errBody;
        return { ok: false, latencyMs, message: `HTTP ${response.status}: ${msg}` };
      } catch {
        return { ok: false, latencyMs, message: `HTTP ${response.status}: ${errBody.slice(0, 120)}` };
      }
    }

    const json = await response.json();
    const preview = (json?.choices?.[0]?.message?.content ?? '').slice(0, 40);
    return { ok: true, latencyMs, message: 'Connected', preview };
  } catch (err: unknown) {
    const latencyMs = Date.now() - start;
    if (err instanceof Error) {
      if (err.name === 'TimeoutError' || err.name === 'AbortError') {
        return { ok: false, latencyMs, message: 'Timeout (15s)' };
      }
      return { ok: false, latencyMs, message: err.message };
    }
    return { ok: false, latencyMs, message: String(err) };
  }
}

export interface StreamCallbacks {
  onChunk: (text: string) => void;
  onDone: () => void;
  onError: (err: Error) => void;
}

/**
 * Send messages to an OpenAI-compatible API with streaming support.
 * Returns an AbortController so the caller can cancel the stream.
 */
export function streamChat(
  messages: Message[],
  config: ModelConfig,
  callbacks: StreamCallbacks
): AbortController {
  const controller = new AbortController();

  const apiMessages = [
    ...(config.systemPrompt
      ? [{ role: 'system', content: config.systemPrompt }]
      : []),
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  const baseUrl = config.baseUrl.replace(/\/$/, '');

  (async () => {
    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
          'HTTP-Referer': 'https://hermes-agent.nousresearch.com',
          'X-Title': 'Cortex',
        },
        body: JSON.stringify({
          model: config.model,
          messages: apiMessages,
          stream: true,
          temperature: config.temperature,
          max_tokens: config.maxTokens,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`API error ${response.status}: ${errText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;
          if (!trimmed.startsWith('data: ')) continue;

          try {
            const json = JSON.parse(trimmed.slice(6));
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) callbacks.onChunk(delta);
          } catch {
            // ignore malformed SSE lines
          }
        }
      }

      callbacks.onDone();
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      callbacks.onError(err instanceof Error ? err : new Error(String(err)));
    }
  })();

  return controller;
}
