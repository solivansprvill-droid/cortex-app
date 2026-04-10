import AsyncStorage from '@react-native-async-storage/async-storage';

const CONTEXT_FILES_KEY = 'cortex_context_files';
const MCP_SERVERS_KEY = 'cortex_mcp_servers';
const SCHEDULED_TASKS_KEY = 'cortex_scheduled_tasks';
const AI_PERSONA_KEY = 'cortex_ai_persona';

// ─── Context Files ─────────────────────────────────────────────────────────────

export interface ContextFile {
  id: string;
  name: string;
  content: string;
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}

export async function loadContextFiles(): Promise<ContextFile[]> {
  try {
    const raw = await AsyncStorage.getItem(CONTEXT_FILES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function saveContextFiles(files: ContextFile[]): Promise<void> {
  await AsyncStorage.setItem(CONTEXT_FILES_KEY, JSON.stringify(files));
}

export async function createContextFile(name: string, content: string): Promise<ContextFile> {
  const files = await loadContextFiles();
  const file: ContextFile = { id: `ctx_${Date.now()}`, name, content, enabled: true, createdAt: Date.now(), updatedAt: Date.now() };
  await saveContextFiles([...files, file]);
  return file;
}

export async function deleteContextFile(id: string): Promise<void> {
  const files = await loadContextFiles();
  await saveContextFiles(files.filter((f) => f.id !== id));
}

export async function buildContextFilesPrompt(): Promise<string> {
  const files = await loadContextFiles();
  const enabled = files.filter((f) => f.enabled);
  if (enabled.length === 0) return '';
  return enabled.map((f) => `## Context: ${f.name}\n${f.content}`).join('\n\n');
}

// ─── MCP Servers ──────────────────────────────────────────────────────────────

export interface MCPServer {
  id: string;
  name: string;
  url: string;
  apiKey?: string;
  enabled: boolean;
  description?: string;
  createdAt: number;
}

export async function loadMCPServers(): Promise<MCPServer[]> {
  try {
    const raw = await AsyncStorage.getItem(MCP_SERVERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function saveMCPServers(servers: MCPServer[]): Promise<void> {
  await AsyncStorage.setItem(MCP_SERVERS_KEY, JSON.stringify(servers));
}

export async function addMCPServer(server: Omit<MCPServer, 'id' | 'createdAt'>): Promise<MCPServer> {
  const servers = await loadMCPServers();
  const newServer: MCPServer = { ...server, id: `mcp_${Date.now()}`, createdAt: Date.now() };
  await saveMCPServers([...servers, newServer]);
  return newServer;
}

export async function deleteMCPServer(id: string): Promise<void> {
  const servers = await loadMCPServers();
  await saveMCPServers(servers.filter((s) => s.id !== id));
}

/** Discover tools from an MCP server via HTTP */
export async function discoverMCPTools(server: MCPServer): Promise<{ name: string; description: string }[]> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (server.apiKey) headers['Authorization'] = `Bearer ${server.apiKey}`;
    const res = await fetch(`${server.url}/tools`, { headers, signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data.tools) ? data.tools : Array.isArray(data) ? data : [];
  } catch (err) {
    throw new Error(`Failed to discover MCP tools: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ─── Scheduled Tasks ──────────────────────────────────────────────────────────

export type ScheduleType = 'once' | 'daily' | 'weekly' | 'interval';

export interface ScheduledTask {
  id: string;
  name: string;
  prompt: string;
  scheduleType: ScheduleType;
  /** For 'once': ISO date string. For 'daily': "HH:MM". For 'weekly': "weekday HH:MM". For 'interval': seconds */
  scheduleValue: string;
  enabled: boolean;
  lastRunAt?: number;
  nextRunAt?: number;
  createdAt: number;
}

export async function loadScheduledTasks(): Promise<ScheduledTask[]> {
  try {
    const raw = await AsyncStorage.getItem(SCHEDULED_TASKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function saveScheduledTasks(tasks: ScheduledTask[]): Promise<void> {
  await AsyncStorage.setItem(SCHEDULED_TASKS_KEY, JSON.stringify(tasks));
}

export async function createScheduledTask(task: Omit<ScheduledTask, 'id' | 'createdAt'>): Promise<ScheduledTask> {
  const tasks = await loadScheduledTasks();
  const newTask: ScheduledTask = { ...task, id: `task_${Date.now()}`, createdAt: Date.now() };
  await saveScheduledTasks([...tasks, newTask]);
  return newTask;
}

export async function deleteScheduledTask(id: string): Promise<void> {
  const tasks = await loadScheduledTasks();
  await saveScheduledTasks(tasks.filter((t) => t.id !== id));
}

// ─── AI Persona ───────────────────────────────────────────────────────────────

export interface AIPersona {
  name: string;
  systemPrompt: string;
  personality?: string;
  responseStyle?: 'concise' | 'detailed' | 'balanced';
  language?: string;
  enabled: boolean;
  updatedAt: number;
}

const DEFAULT_PERSONA: AIPersona = {
  name: 'Cortex',
  systemPrompt: 'You are Cortex, a helpful, intelligent, and versatile AI assistant. You provide accurate, thoughtful responses and adapt your communication style to the user\'s needs.',
  personality: 'helpful, intelligent, direct',
  responseStyle: 'balanced',
  enabled: true,
  updatedAt: 0,
};

export async function loadAIPersona(): Promise<AIPersona> {
  try {
    const raw = await AsyncStorage.getItem(AI_PERSONA_KEY);
    if (!raw) return DEFAULT_PERSONA;
    return { ...DEFAULT_PERSONA, ...JSON.parse(raw) };
  } catch { return DEFAULT_PERSONA; }
}

export async function saveAIPersona(persona: AIPersona): Promise<void> {
  await AsyncStorage.setItem(AI_PERSONA_KEY, JSON.stringify({ ...persona, updatedAt: Date.now() }));
}

export function getDefaultPersona(): AIPersona {
  return { ...DEFAULT_PERSONA };
}
