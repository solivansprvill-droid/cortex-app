import { Message, ModelConfig } from './types';

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
