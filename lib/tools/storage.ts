import AsyncStorage from '@react-native-async-storage/async-storage';
import { Toolset } from './types';
import { BUILTIN_TOOLSETS } from './definitions';

const TOOLSETS_KEY = 'cortex_toolsets_config';

export async function loadToolsets(): Promise<Toolset[]> {
  try {
    const raw = await AsyncStorage.getItem(TOOLSETS_KEY);
    if (!raw) return BUILTIN_TOOLSETS;

    const saved: Record<string, boolean> = JSON.parse(raw);
    // Merge saved enabled states with builtin definitions
    return BUILTIN_TOOLSETS.map((ts) => ({
      ...ts,
      enabled: saved[ts.id] !== undefined ? saved[ts.id] : ts.enabled,
    }));
  } catch {
    return BUILTIN_TOOLSETS;
  }
}

export async function saveToolsets(toolsets: Toolset[]): Promise<void> {
  const config: Record<string, boolean> = {};
  for (const ts of toolsets) config[ts.id] = ts.enabled;
  await AsyncStorage.setItem(TOOLSETS_KEY, JSON.stringify(config));
}

export async function getEnabledTools(toolsets: Toolset[]) {
  return toolsets
    .filter((ts) => ts.enabled)
    .flatMap((ts) => ts.tools);
}

/** Convert tool definitions to OpenAI function calling format */
export function toOpenAITools(toolsets: Toolset[]) {
  const enabledTools = toolsets.filter((ts) => ts.enabled).flatMap((ts) => ts.tools);
  return enabledTools.map((tool) => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: {
        type: 'object',
        properties: Object.fromEntries(
          Object.entries(tool.parameters).map(([key, param]) => [
            key,
            {
              type: param.type,
              description: param.description,
              ...(param.enum ? { enum: param.enum } : {}),
            },
          ])
        ),
        required: tool.requiredParams,
      },
    },
  }));
}
