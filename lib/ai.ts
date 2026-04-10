import { Message, ModelConfig } from './types';
import { Toolset, ToolCall, ToolResult } from './tools/types';
import { toOpenAITools } from './tools/storage';
import { executeTool } from './tools/executor';

export interface ModelTestResult {
  ok: boolean;
  latencyMs?: number;
  message: string;
  preview?: string;
}

// ─── Polyfill: AbortSignal.timeout is not available in React Native / Hermes ──

function makeTimeoutSignal(ms: number): { signal: AbortSignal; clear: () => void } {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return {
    signal: controller.signal,
    clear: () => clearTimeout(id),
  };
}

// ─── Test model connection ────────────────────────────────────────────────────

export async function testModelConnection(
  config: Pick<ModelConfig, 'baseUrl' | 'apiKey' | 'model'> & { apiType?: 'openai' | 'anthropic' | 'google' }
): Promise<ModelTestResult> {
  const baseUrl = config.baseUrl.replace(/\/$/, '');
  const apiType = config.apiType ?? 'openai';
  const start = Date.now();
  const { signal, clear } = makeTimeoutSignal(15000);

  try {
    let url: string;
    let headers: Record<string, string>;
    let body: object;

    if (apiType === 'anthropic') {
      url = `${baseUrl}/messages`;
      headers = {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
      };
      body = {
        model: config.model,
        max_tokens: 16,
        messages: [{ role: 'user', content: 'Hi' }],
      };
    } else if (apiType === 'google') {
      const modelPath = config.model.startsWith('models/') ? config.model : `models/${config.model}`;
      url = `${baseUrl}/${modelPath}:generateContent?key=${config.apiKey}`;
      headers = { 'Content-Type': 'application/json' };
      body = { contents: [{ parts: [{ text: 'Hi' }] }] };
    } else {
      url = `${baseUrl}/chat/completions`;
      headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
        'HTTP-Referer': 'https://cortex-agent.app',
        'X-Title': 'Cortex',
      };
      body = {
        model: config.model,
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 16,
        stream: false,
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal,
    });

    clear();
    const latencyMs = Date.now() - start;

    if (!response.ok) {
      let errBody = '';
      try { errBody = await response.text(); } catch { /* ignore */ }
      try {
        const j = JSON.parse(errBody);
        const msg = j?.error?.message ?? j?.message ?? errBody;
        return { ok: false, latencyMs, message: `HTTP ${response.status}: ${msg}` };
      } catch {
        return { ok: false, latencyMs, message: `HTTP ${response.status}: ${errBody.slice(0, 120)}` };
      }
    }

    const json = await response.json();
    let preview = '';
    if (apiType === 'anthropic') {
      preview = (json?.content?.[0]?.text ?? '').slice(0, 40);
    } else if (apiType === 'google') {
      preview = (json?.candidates?.[0]?.content?.parts?.[0]?.text ?? '').slice(0, 40);
    } else {
      preview = (json?.choices?.[0]?.message?.content ?? '').slice(0, 40);
    }
    return { ok: true, latencyMs, message: '连接成功', preview };
  } catch (err: unknown) {
    clear();
    const latencyMs = Date.now() - start;
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        return { ok: false, latencyMs, message: '连接超时 (15s)' };
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
  onToolStart?: (toolCall: ToolCall) => void;
  onToolDone?: (result: ToolResult) => void;
}

// ─── Internal: simulate streaming by emitting chunks from a full response ────

async function emitChunks(
  text: string,
  onChunk: (t: string) => void,
  signal: AbortSignal
): Promise<void> {
  const CHUNK = 6;
  for (let i = 0; i < text.length; i += CHUNK) {
    if (signal.aborted) return;
    onChunk(text.slice(i, i + CHUNK));
    await new Promise((r) => setTimeout(r, 10));
  }
}

// ─── Internal: one non-streaming turn (for tool call loop) ───────────────────

async function chatOnce(
  messages: object[],
  config: ModelConfig,
  tools: object[],
  signal: AbortSignal
): Promise<{ content: string | null; toolCalls: ToolCall[] }> {
  const baseUrl = config.baseUrl.replace(/\/$/, '');
  const body: Record<string, unknown> = {
    model: config.model,
    messages,
    temperature: config.temperature,
    max_tokens: config.maxTokens,
    stream: false,
  };
  if (tools.length > 0) {
    body.tools = tools;
    body.tool_choice = 'auto';
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
      'HTTP-Referer': 'https://cortex-agent.app',
      'X-Title': 'Cortex',
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`API error ${response.status}: ${errText}`);
  }

  const json = await response.json();
  const choice = json.choices?.[0];
  const message = choice?.message;

  if (!message) throw new Error('No message in response');

  const toolCalls: ToolCall[] = (message.tool_calls ?? []).map((tc: {
    id: string;
    function: { name: string; arguments: string };
  }) => ({
    id: tc.id,
    name: tc.function.name,
    arguments: (() => {
      try { return JSON.parse(tc.function.arguments); } catch { return {}; }
    })(),
  }));

  return { content: message.content ?? null, toolCalls };
}

// ─── Main: chat with optional tool loop ──────────────────────────────────────
// NOTE: React Native's fetch does NOT support ReadableStream (response.body).
// We use stream:false and simulate streaming via emitChunks() for UX.

export function streamChat(
  messages: Message[],
  config: ModelConfig,
  callbacks: StreamCallbacks,
  toolsets?: Toolset[],
  extraSystemPrompt?: string
): AbortController {
  const controller = new AbortController();

  (async () => {
    try {
      const systemParts: string[] = [];
      if (config.systemPrompt) systemParts.push(config.systemPrompt);
      if (extraSystemPrompt) systemParts.push(extraSystemPrompt);
      const systemContent = systemParts.join('\n\n');

      const apiMessages: object[] = [
        ...(systemContent ? [{ role: 'system', content: systemContent }] : []),
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ];

      const tools = toolsets ? toOpenAITools(toolsets) : [];
      const hasTools = tools.length > 0;

      if (hasTools) {
        // ── Tool-enabled agent loop ──────────────────────────────────────────
        const MAX_ITERATIONS = 8;
        let iteration = 0;
        const loopMessages = [...apiMessages];

        while (iteration < MAX_ITERATIONS) {
          iteration++;
          const { content, toolCalls } = await chatOnce(loopMessages, config, tools, controller.signal);

          if (toolCalls.length === 0) {
            if (content) {
              await emitChunks(content, callbacks.onChunk, controller.signal);
            }
            callbacks.onDone();
            return;
          }

          loopMessages.push({
            role: 'assistant',
            content,
            tool_calls: toolCalls.map((tc) => ({
              id: tc.id,
              type: 'function',
              function: { name: tc.name, arguments: JSON.stringify(tc.arguments) },
            })),
          });

          for (const toolCall of toolCalls) {
            if (controller.signal.aborted) return;
            callbacks.onToolStart?.(toolCall);
            const result = await executeTool(toolCall);
            callbacks.onToolDone?.(result);
            loopMessages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: result.result,
            });
          }
        }

        callbacks.onChunk('\n\n[已达最大工具调用次数]');
        callbacks.onDone();
        return;
      }

      // ── No tools: non-streaming request + simulated streaming ───────────────
      const baseUrl = config.baseUrl.replace(/\/$/, '');
      const { signal, clear } = makeTimeoutSignal(120000); // 2 min timeout

      // Merge with abort controller so user can cancel
      controller.signal.addEventListener('abort', () => clear());

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
          'HTTP-Referer': 'https://cortex-agent.app',
          'X-Title': 'Cortex',
        },
        body: JSON.stringify({
          model: config.model,
          messages: apiMessages,
          stream: false,
          temperature: config.temperature,
          max_tokens: config.maxTokens,
        }),
        signal,
      });

      clear();

      if (controller.signal.aborted) return;

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`API error ${response.status}: ${errText}`);
      }

      const json = await response.json();
      const content = json?.choices?.[0]?.message?.content ?? '';

      if (!content) {
        callbacks.onDone();
        return;
      }

      // Simulate streaming for smooth UX
      await emitChunks(content, callbacks.onChunk, controller.signal);

      if (!controller.signal.aborted) {
        callbacks.onDone();
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      callbacks.onError(err instanceof Error ? err : new Error(String(err)));
    }
  })();

  return controller;
}
