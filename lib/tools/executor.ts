import { ToolCall, ToolResult } from './types';

// ─── Polyfill: AbortSignal.timeout is not available in React Native / Hermes ──

function makeTimeoutSignal(ms: number): { signal: AbortSignal; clear: () => void } {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(id) };
}

// ─── Web Search ───────────────────────────────────────────────────────────────
// Strategy:
// 1. Try DuckDuckGo Instant Answer API (good for facts/wiki)
// 2. Try DuckDuckGo HTML search scraping (for news/current events)
// Both are free and require no API key.

async function executeWebSearch(args: Record<string, unknown>): Promise<string> {
  const query = String(args.query ?? '');
  const maxResults = Math.min(Number(args.max_results ?? 5), 10);

  if (!query) return 'Error: query is required';

  const results: string[] = [];

  // ── Step 1: DuckDuckGo Instant Answer API ─────────────────────────────────
  try {
    const { signal, clear } = makeTimeoutSignal(10000);
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const res = await fetch(url, { signal });
    clear();
    const data = await res.json();

    if (data.Abstract) {
      results.push(`📖 **摘要:** ${data.Abstract}`);
      if (data.AbstractURL) results.push(`来源: ${data.AbstractURL}`);
    }
    if (data.Answer) {
      results.push(`✅ **直接答案:** ${data.Answer}`);
    }
    if (data.Definition) {
      results.push(`📚 **定义:** ${data.Definition}`);
    }

    const topics = (data.RelatedTopics ?? []).slice(0, Math.min(maxResults, 3));
    if (topics.length > 0) {
      results.push('\n**相关结果:**');
      for (const topic of topics) {
        if (topic.Text && topic.FirstURL) {
          results.push(`• ${topic.Text}\n  🔗 ${topic.FirstURL}`);
        } else if (topic.Topics) {
          for (const sub of (topic.Topics ?? []).slice(0, 2)) {
            if (sub.Text) results.push(`• ${sub.Text}`);
          }
        }
      }
    }
  } catch {
    // Instant API failed, continue to HTML scraping
  }

  // ── Step 2: DuckDuckGo HTML search (for news/current events) ─────────────
  try {
    const { signal, clear } = makeTimeoutSignal(12000);
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await fetch(searchUrl, {
      signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/120 Safari/537.36',
        'Accept': 'text/html',
      },
    });
    clear();

    if (res.ok) {
      const html = await res.text();

      // Extract result titles and snippets from DuckDuckGo HTML
      const titleMatches = html.matchAll(/class="result__title"[^>]*>[\s\S]*?<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi);
      const snippetMatches = html.matchAll(/class="result__snippet"[^>]*>([\s\S]*?)<\/[^>]+>/gi);

      const titles: { url: string; title: string }[] = [];
      for (const m of titleMatches) {
        const url = m[1]?.replace(/^\/\/duckduckgo\.com\/l\/\?uddg=/, '');
        const title = m[2]?.replace(/<[^>]+>/g, '').trim();
        if (url && title && url.startsWith('http')) {
          titles.push({ url: decodeURIComponent(url), title });
        }
      }

      const snippets: string[] = [];
      for (const m of snippetMatches) {
        const text = m[1]?.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
        if (text && text.length > 20) snippets.push(text);
      }

      const count = Math.min(titles.length, snippets.length, maxResults);
      if (count > 0) {
        if (results.length > 0) results.push('\n**网页搜索结果:**');
        else results.push('**搜索结果:**');

        for (let i = 0; i < count; i++) {
          results.push(`\n${i + 1}. **${titles[i].title}**`);
          if (snippets[i]) results.push(`   ${snippets[i]}`);
          results.push(`   🔗 ${titles[i].url}`);
        }
      }
    }
  } catch {
    // HTML scraping failed
  }

  if (results.length === 0) {
    return `未找到 "${query}" 的搜索结果。建议：\n1. 尝试更简短的关键词\n2. 使用 url_fetch 工具直接访问特定网页`;
  }

  return results.join('\n');
}

// ─── Calculator ───────────────────────────────────────────────────────────────

function executeCalculator(args: Record<string, unknown>): string {
  const expression = String(args.expression ?? '');
  try {
    const sanitized = expression
      .replace(/[^0-9+\-*/().,%^√πe\s]/gi, '')
      .replace(/π/g, 'Math.PI')
      .replace(/√/g, 'Math.sqrt')
      .replace(/\^/g, '**');

    const mathScope = {
      sin: Math.sin, cos: Math.cos, tan: Math.tan,
      asin: Math.asin, acos: Math.acos, atan: Math.atan, atan2: Math.atan2,
      sqrt: Math.sqrt, cbrt: Math.cbrt,
      abs: Math.abs, ceil: Math.ceil, floor: Math.floor, round: Math.round,
      log: Math.log, log2: Math.log2, log10: Math.log10,
      exp: Math.exp, pow: Math.pow,
      min: Math.min, max: Math.max,
      PI: Math.PI, E: Math.E,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as Record<string, any>;

    const keys = Object.keys(mathScope);
    const values = Object.values(mathScope);
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const fn = new Function(...keys, `return (${sanitized})`);
    const result = fn(...values);

    if (typeof result === 'number') {
      if (!isFinite(result)) return `Result: ${result}`;
      const formatted = Number.isInteger(result) ? result.toString() : result.toPrecision(10).replace(/\.?0+$/, '');
      return `${expression} = ${formatted}`;
    }
    return `Result: ${result}`;
  } catch (err) {
    return `Calculation error: ${err instanceof Error ? err.message : 'Invalid expression'}`;
  }
}

// ─── Date & Time ──────────────────────────────────────────────────────────────

function executeGetDatetime(args: Record<string, unknown>): string {
  const format = String(args.format ?? 'full');
  const now = new Date();

  try {
    const tz = args.timezone ? String(args.timezone) : undefined;
    const opts: Intl.DateTimeFormatOptions = tz ? { timeZone: tz } : {};

    switch (format) {
      case 'date':
        return now.toLocaleDateString('zh-CN', { ...opts, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      case 'time':
        return now.toLocaleTimeString('zh-CN', { ...opts, hour: '2-digit', minute: '2-digit', second: '2-digit' });
      case 'iso':
        return now.toISOString();
      default: {
        const dateStr = now.toLocaleDateString('zh-CN', { ...opts, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const timeStr = now.toLocaleTimeString('zh-CN', { ...opts, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const tzStr = tz ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
        return `${dateStr} ${timeStr} (${tzStr})`;
      }
    }
  } catch {
    return now.toString();
  }
}

// ─── URL Fetch ────────────────────────────────────────────────────────────────

async function executeUrlFetch(args: Record<string, unknown>): Promise<string> {
  const url = String(args.url ?? '');
  const maxChars = Number(args.max_chars ?? 4000);

  if (!url.startsWith('http')) {
    return 'Error: URL must start with http:// or https://';
  }

  const { signal, clear } = makeTimeoutSignal(20000);

  try {
    const res = await fetch(url, {
      signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
    });
    clear();

    if (!res.ok) {
      return `HTTP ${res.status}: ${res.statusText}`;
    }

    const contentType = res.headers.get('content-type') ?? '';

    if (contentType.includes('application/json')) {
      const json = await res.json();
      return JSON.stringify(json, null, 2).slice(0, maxChars);
    }

    const text = await res.text();

    // Extract title
    const titleMatch = text.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim() : '';

    // Strip scripts, styles, nav, footer
    const cleaned = text
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\s{2,}/g, ' ')
      .trim();

    const header = title ? `📄 **${title}**\n🔗 ${url}\n\n` : `🔗 ${url}\n\n`;
    const content = cleaned.slice(0, maxChars);
    const suffix = cleaned.length > maxChars ? '\n...[内容已截断]' : '';

    return header + content + suffix;
  } catch (err) {
    clear();
    if (err instanceof Error && err.name === 'AbortError') {
      return `请求超时 (20s): ${url}`;
    }
    return `获取失败: ${err instanceof Error ? err.message : String(err)}`;
  }
}

// ─── Weather (Open-Meteo, free, no API key) ───────────────────────────────────

async function executeGetWeather(args: Record<string, unknown>): Promise<string> {
  const location = String(args.location ?? '');
  const units = String(args.units ?? 'celsius');
  const tempUnit = units === 'fahrenheit' ? 'fahrenheit' : 'celsius';
  const tempSymbol = tempUnit === 'fahrenheit' ? '°F' : '°C';

  try {
    let lat: number, lon: number, locationName: string;

    if (/^-?\d+\.?\d*,-?\d+\.?\d*$/.test(location)) {
      [lat, lon] = location.split(',').map(Number);
      locationName = location;
    } else {
      const { signal: s1, clear: c1 } = makeTimeoutSignal(8000);
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=zh&format=json`,
        { signal: s1 }
      );
      c1();
      const geoData = await geoRes.json();
      if (!geoData.results?.length) return `未找到位置 "${location}"`;
      const place = geoData.results[0];
      lat = place.latitude;
      lon = place.longitude;
      locationName = `${place.name}${place.country ? ', ' + place.country : ''}`;
    }

    const { signal: s2, clear: c2 } = makeTimeoutSignal(8000);
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,apparent_temperature&temperature_unit=${tempUnit}&wind_speed_unit=kmh&forecast_days=1`,
      { signal: s2 }
    );
    c2();
    const weather = await weatherRes.json();
    const c = weather.current;

    const weatherCodes: Record<number, string> = {
      0: '晴天', 1: '大部晴朗', 2: '局部多云', 3: '阴天',
      45: '雾', 48: '冻雾', 51: '小毛毛雨', 53: '中毛毛雨',
      55: '大毛毛雨', 61: '小雨', 63: '中雨', 65: '大雨',
      71: '小雪', 73: '中雪', 75: '大雪', 80: '阵雨', 81: '中阵雨',
      82: '暴阵雨', 95: '雷暴',
    };

    const condition = weatherCodes[c.weather_code] ?? `天气代码 ${c.weather_code}`;
    return [
      `🌤 **${locationName} 当前天气**`,
      `天气: ${condition}`,
      `温度: ${c.temperature_2m}${tempSymbol} (体感 ${c.apparent_temperature}${tempSymbol})`,
      `湿度: ${c.relative_humidity_2m}%`,
      `风速: ${c.wind_speed_10m} km/h`,
    ].join('\n');
  } catch (err) {
    return `天气获取失败: ${err instanceof Error ? err.message : String(err)}`;
  }
}

// ─── Memory tools ─────────────────────────────────────────────────────────────

import { loadMemory, saveMemoryEntry } from '../memory';

async function executeMemoryRead(): Promise<string> {
  const memory = await loadMemory();
  if (!memory.entries || memory.entries.length === 0) {
    return '记忆为空，尚未存储任何信息。';
  }
  const lines = memory.entries.map((e) => `- **${e.key}**: ${e.value}`);
  return `**持久记忆 (${memory.entries.length} 条):**\n${lines.join('\n')}`;
}

async function executeMemoryWrite(args: Record<string, unknown>): Promise<string> {
  const key = String(args.key ?? '');
  const value = String(args.value ?? '');
  if (!key || !value) return '错误: key 和 value 都是必填项';
  await saveMemoryEntry(key, value);
  return `记忆已保存: **${key}** = ${value}`;
}

// ─── Main Executor ────────────────────────────────────────────────────────────

export async function executeTool(toolCall: ToolCall): Promise<ToolResult> {
  const { id, name, arguments: args } = toolCall;

  try {
    let result: string;

    switch (name) {
      case 'web_search':
        result = await executeWebSearch(args);
        break;
      case 'calculator':
        result = executeCalculator(args);
        break;
      case 'get_datetime':
        result = executeGetDatetime(args);
        break;
      case 'url_fetch':
        result = await executeUrlFetch(args);
        break;
      case 'get_weather':
        result = await executeGetWeather(args);
        break;
      case 'memory_read':
        result = await executeMemoryRead();
        break;
      case 'memory_write':
        result = await executeMemoryWrite(args);
        break;
      default:
        result = `未知工具: ${name}`;
    }

    return { toolCallId: id, name, result };
  } catch (err) {
    return {
      toolCallId: id,
      name,
      result: `工具执行错误: ${err instanceof Error ? err.message : String(err)}`,
      isError: true,
    };
  }
}
