import { ToolCall, ToolResult } from './types';

// ─── Web Search (DuckDuckGo Instant Answer API) ───────────────────────────────

async function executeWebSearch(args: Record<string, unknown>): Promise<string> {
  const query = String(args.query ?? '');
  const maxResults = Number(args.max_results ?? 5);

  try {
    // Use DuckDuckGo Instant Answer API (no API key required)
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const data = await res.json();

    const results: string[] = [];

    // Abstract (direct answer)
    if (data.Abstract) {
      results.push(`**Summary:** ${data.Abstract}`);
      if (data.AbstractURL) results.push(`Source: ${data.AbstractURL}`);
    }

    // Answer (instant answer)
    if (data.Answer) {
      results.push(`**Answer:** ${data.Answer}`);
    }

    // Related topics
    const topics = (data.RelatedTopics ?? []).slice(0, maxResults);
    if (topics.length > 0) {
      results.push('\n**Related Results:**');
      for (const topic of topics) {
        if (topic.Text && topic.FirstURL) {
          results.push(`- ${topic.Text}\n  ${topic.FirstURL}`);
        } else if (topic.Topics) {
          for (const sub of (topic.Topics ?? []).slice(0, 2)) {
            if (sub.Text) results.push(`- ${sub.Text}`);
          }
        }
      }
    }

    if (results.length === 0) {
      // Fallback: return a note that no instant results were found
      return `No instant answer found for "${query}". Try a more specific query or use url_fetch to read a specific page.`;
    }

    return results.join('\n');
  } catch (err) {
    return `Search failed: ${err instanceof Error ? err.message : String(err)}`;
  }
}

// ─── Calculator ───────────────────────────────────────────────────────────────

function executeCalculator(args: Record<string, unknown>): string {
  const expression = String(args.expression ?? '');
  try {
    // Safe math evaluation using Function constructor with limited scope
    // Only allow math operations, no arbitrary code
    const sanitized = expression
      .replace(/[^0-9+\-*/().,%^√πe\s]/gi, '')
      .replace(/π/g, 'Math.PI')
      .replace(/√/g, 'Math.sqrt')
      .replace(/\^/g, '**');

    // Provide math functions in scope
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
      // Format nicely
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
        return now.toLocaleDateString('en-US', { ...opts, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      case 'time':
        return now.toLocaleTimeString('en-US', { ...opts, hour: '2-digit', minute: '2-digit', second: '2-digit' });
      case 'iso':
        return now.toISOString();
      default: {
        const dateStr = now.toLocaleDateString('en-US', { ...opts, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const timeStr = now.toLocaleTimeString('en-US', { ...opts, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const tzStr = tz ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
        return `${dateStr} at ${timeStr} (${tzStr})`;
      }
    }
  } catch {
    return now.toString();
  }
}

// ─── URL Fetch ────────────────────────────────────────────────────────────────

async function executeUrlFetch(args: Record<string, unknown>): Promise<string> {
  const url = String(args.url ?? '');
  const maxChars = Number(args.max_chars ?? 3000);

  if (!url.startsWith('http')) {
    return 'Error: URL must start with http:// or https://';
  }

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(15000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CortexBot/1.0)' },
    });

    if (!res.ok) {
      return `HTTP ${res.status}: ${res.statusText}`;
    }

    const contentType = res.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      const json = await res.json();
      return JSON.stringify(json, null, 2).slice(0, maxChars);
    }

    const text = await res.text();
    // Strip HTML tags for cleaner output
    const stripped = text
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();

    return stripped.slice(0, maxChars) + (stripped.length > maxChars ? '\n...[truncated]' : '');
  } catch (err) {
    return `Fetch failed: ${err instanceof Error ? err.message : String(err)}`;
  }
}

// ─── Weather (Open-Meteo, free, no API key) ───────────────────────────────────

async function executeGetWeather(args: Record<string, unknown>): Promise<string> {
  const location = String(args.location ?? '');
  const units = String(args.units ?? 'celsius');
  const tempUnit = units === 'fahrenheit' ? 'fahrenheit' : 'celsius';
  const tempSymbol = tempUnit === 'fahrenheit' ? '°F' : '°C';

  try {
    // First geocode the location
    let lat: number, lon: number, locationName: string;

    if (/^-?\d+\.?\d*,-?\d+\.?\d*$/.test(location)) {
      [lat, lon] = location.split(',').map(Number);
      locationName = location;
    } else {
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`,
        { signal: AbortSignal.timeout(8000) }
      );
      const geoData = await geoRes.json();
      if (!geoData.results?.length) return `Location "${location}" not found.`;
      const place = geoData.results[0];
      lat = place.latitude;
      lon = place.longitude;
      locationName = `${place.name}${place.country ? ', ' + place.country : ''}`;
    }

    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,apparent_temperature&temperature_unit=${tempUnit}&wind_speed_unit=kmh&forecast_days=1`,
      { signal: AbortSignal.timeout(8000) }
    );
    const weather = await weatherRes.json();
    const c = weather.current;

    const weatherCodes: Record<number, string> = {
      0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
      45: 'Foggy', 48: 'Icy fog', 51: 'Light drizzle', 53: 'Moderate drizzle',
      55: 'Dense drizzle', 61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
      71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow', 80: 'Slight showers',
      81: 'Moderate showers', 82: 'Violent showers', 95: 'Thunderstorm',
    };

    const condition = weatherCodes[c.weather_code] ?? `Code ${c.weather_code}`;
    return [
      `**Weather in ${locationName}**`,
      `Condition: ${condition}`,
      `Temperature: ${c.temperature_2m}${tempSymbol} (feels like ${c.apparent_temperature}${tempSymbol})`,
      `Humidity: ${c.relative_humidity_2m}%`,
      `Wind: ${c.wind_speed_10m} km/h`,
    ].join('\n');
  } catch (err) {
    return `Weather fetch failed: ${err instanceof Error ? err.message : String(err)}`;
  }
}

// ─── Memory tools (delegated to memory module) ───────────────────────────────

import { loadMemory, saveMemoryEntry } from '../memory';

async function executeMemoryRead(): Promise<string> {
  const memory = await loadMemory();
  if (!memory.entries || memory.entries.length === 0) {
    return 'Memory is empty. No facts stored yet.';
  }
  const lines = memory.entries.map((e) => `- **${e.key}**: ${e.value}`);
  return `**Persistent Memory (${memory.entries.length} entries):**\n${lines.join('\n')}`;
}

async function executeMemoryWrite(args: Record<string, unknown>): Promise<string> {
  const key = String(args.key ?? '');
  const value = String(args.value ?? '');
  if (!key || !value) return 'Error: key and value are required';
  await saveMemoryEntry(key, value);
  return `Memory saved: **${key}** = ${value}`;
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
        result = `Unknown tool: ${name}`;
    }

    return { toolCallId: id, name, result };
  } catch (err) {
    return {
      toolCallId: id,
      name,
      result: `Tool error: ${err instanceof Error ? err.message : String(err)}`,
      isError: true,
    };
  }
}
