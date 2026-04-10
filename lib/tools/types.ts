// ─── Tool System Types ─────────────────────────────────────────────────────────

export interface ToolParameter {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  enum?: string[];
  required?: boolean;
}

export interface ToolDefinition {
  name: string;
  description: string;
  category: ToolsetCategory;
  parameters: Record<string, ToolParameter>;
  requiredParams: string[];
  /** Whether this tool requires an external API key */
  requiresApiKey?: boolean;
  apiKeyEnvName?: string;
}

export type ToolsetCategory =
  | 'search'
  | 'math'
  | 'datetime'
  | 'weather'
  | 'web'
  | 'memory'
  | 'skills'
  | 'mcp'
  | 'system';

export interface Toolset {
  id: string;
  name: string;
  description: string;
  category: ToolsetCategory;
  icon: string;
  tools: ToolDefinition[];
  enabled: boolean;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  toolCallId: string;
  name: string;
  result: string;
  isError?: boolean;
}

export interface ToolExecutionState {
  toolCallId: string;
  name: string;
  arguments: Record<string, unknown>;
  status: 'running' | 'done' | 'error';
  result?: string;
  startedAt: number;
  doneAt?: number;
}
