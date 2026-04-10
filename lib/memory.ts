import AsyncStorage from '@react-native-async-storage/async-storage';

const MEMORY_KEY = 'cortex_memory';
const USER_PROFILE_KEY = 'cortex_user_profile';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface MemoryEntry {
  key: string;
  value: string;
  updatedAt: number;
  category?: 'fact' | 'preference' | 'context' | 'goal';
}

export interface Memory {
  entries: MemoryEntry[];
  updatedAt: number;
}

export interface UserProfile {
  name?: string;
  language?: string;
  occupation?: string;
  interests?: string[];
  timezone?: string;
  customFields: Record<string, string>;
  updatedAt: number;
}

// ─── Memory CRUD ──────────────────────────────────────────────────────────────

export async function loadMemory(): Promise<Memory> {
  try {
    const raw = await AsyncStorage.getItem(MEMORY_KEY);
    if (!raw) return { entries: [], updatedAt: Date.now() };
    return JSON.parse(raw) as Memory;
  } catch {
    return { entries: [], updatedAt: Date.now() };
  }
}

export async function saveMemory(memory: Memory): Promise<void> {
  await AsyncStorage.setItem(MEMORY_KEY, JSON.stringify({ ...memory, updatedAt: Date.now() }));
}

export async function saveMemoryEntry(key: string, value: string, category?: MemoryEntry['category']): Promise<void> {
  const memory = await loadMemory();
  const existing = memory.entries.findIndex((e) => e.key === key);
  const entry: MemoryEntry = { key, value, updatedAt: Date.now(), category: category ?? 'fact' };

  if (existing >= 0) {
    memory.entries[existing] = entry;
  } else {
    memory.entries.push(entry);
  }
  await saveMemory(memory);
}

export async function deleteMemoryEntry(key: string): Promise<void> {
  const memory = await loadMemory();
  memory.entries = memory.entries.filter((e) => e.key !== key);
  await saveMemory(memory);
}

export async function clearMemory(): Promise<void> {
  await AsyncStorage.removeItem(MEMORY_KEY);
}

// ─── User Profile ─────────────────────────────────────────────────────────────

export async function loadUserProfile(): Promise<UserProfile> {
  try {
    const raw = await AsyncStorage.getItem(USER_PROFILE_KEY);
    if (!raw) return { customFields: {}, updatedAt: Date.now() };
    return JSON.parse(raw) as UserProfile;
  } catch {
    return { customFields: {}, updatedAt: Date.now() };
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify({ ...profile, updatedAt: Date.now() }));
}

// ─── System Prompt Injection ──────────────────────────────────────────────────

export async function buildMemorySystemPrompt(): Promise<string> {
  const [memory, profile] = await Promise.all([loadMemory(), loadUserProfile()]);

  const parts: string[] = [];

  // User profile section
  const profileLines: string[] = [];
  if (profile.name) profileLines.push(`Name: ${profile.name}`);
  if (profile.occupation) profileLines.push(`Occupation: ${profile.occupation}`);
  if (profile.language) profileLines.push(`Preferred language: ${profile.language}`);
  if (profile.timezone) profileLines.push(`Timezone: ${profile.timezone}`);
  if (profile.interests?.length) profileLines.push(`Interests: ${profile.interests.join(', ')}`);
  Object.entries(profile.customFields).forEach(([k, v]) => profileLines.push(`${k}: ${v}`));

  if (profileLines.length > 0) {
    parts.push(`## User Profile\n${profileLines.join('\n')}`);
  }

  // Memory entries section
  if (memory.entries.length > 0) {
    const memLines = memory.entries.map((e) => `- ${e.key}: ${e.value}`);
    parts.push(`## Persistent Memory\n${memLines.join('\n')}`);
  }

  return parts.length > 0 ? parts.join('\n\n') : '';
}
