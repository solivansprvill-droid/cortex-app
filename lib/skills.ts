import AsyncStorage from '@react-native-async-storage/async-storage';

const SKILLS_KEY = 'cortex_skills';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface Skill {
  id: string;
  name: string;
  description: string;
  category: SkillCategory;
  prompt: string;          // The system prompt or instruction injected when skill is active
  icon: string;
  isBuiltin: boolean;
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
  /** Slash command trigger, e.g. "translate" → /translate */
  command?: string;
}

export type SkillCategory =
  | 'writing'
  | 'coding'
  | 'analysis'
  | 'language'
  | 'productivity'
  | 'creative'
  | 'custom';

// ─── Built-in Skills ──────────────────────────────────────────────────────────

export const BUILTIN_SKILLS: Skill[] = [
  {
    id: 'translate',
    name: 'Translator',
    description: 'Translate text between languages accurately',
    category: 'language',
    icon: 'globe',
    isBuiltin: true,
    enabled: true,
    command: 'translate',
    prompt: 'You are a professional translator. When given text, translate it accurately to the requested target language. If no target language is specified, detect the source language and translate to English (or to Chinese if the source is English). Preserve formatting, tone, and nuance. Output only the translation without explanations unless asked.',
    createdAt: 0,
    updatedAt: 0,
  },
  {
    id: 'summarize',
    name: 'Summarizer',
    description: 'Create concise summaries of long texts',
    category: 'writing',
    icon: 'doc.text',
    isBuiltin: true,
    enabled: true,
    command: 'summarize',
    prompt: 'You are an expert summarizer. Create clear, concise summaries that capture the key points, main arguments, and important details. Structure the summary with bullet points for key points. Keep summaries to 20% of the original length unless otherwise specified.',
    createdAt: 0,
    updatedAt: 0,
  },
  {
    id: 'code',
    name: 'Code Assistant',
    description: 'Write, review, and debug code',
    category: 'coding',
    icon: 'chevron.left.forwardslash.chevron.right',
    isBuiltin: true,
    enabled: true,
    command: 'code',
    prompt: 'You are an expert software engineer. Write clean, efficient, well-commented code. When reviewing code, identify bugs, security issues, and performance problems. Always explain your code choices. Use best practices for the language being used. Format code in proper markdown code blocks with language tags.',
    createdAt: 0,
    updatedAt: 0,
  },
  {
    id: 'analyze',
    name: 'Data Analyst',
    description: 'Analyze data, find patterns, and provide insights',
    category: 'analysis',
    icon: 'chart.bar',
    isBuiltin: true,
    enabled: true,
    command: 'analyze',
    prompt: 'You are a skilled data analyst. When given data or information, identify patterns, trends, anomalies, and key insights. Structure your analysis clearly with sections for: Overview, Key Findings, Patterns & Trends, Recommendations. Use tables and bullet points for clarity.',
    createdAt: 0,
    updatedAt: 0,
  },
  {
    id: 'write',
    name: 'Writing Assistant',
    description: 'Help write and improve any type of content',
    category: 'writing',
    icon: 'pencil',
    isBuiltin: true,
    enabled: true,
    command: 'write',
    prompt: 'You are a professional writer and editor. Help users write compelling content, improve their writing, fix grammar and style issues, and adapt tone for different audiences. When editing, explain your changes. When writing from scratch, ask clarifying questions about audience, tone, and purpose if not specified.',
    createdAt: 0,
    updatedAt: 0,
  },
  {
    id: 'brainstorm',
    name: 'Brainstormer',
    description: 'Generate creative ideas and solutions',
    category: 'creative',
    icon: 'lightbulb',
    isBuiltin: true,
    enabled: true,
    command: 'brainstorm',
    prompt: 'You are a creative brainstorming partner. Generate diverse, innovative ideas without self-censorship. Think outside the box and combine unexpected concepts. Present ideas in numbered lists with brief explanations. Encourage building on ideas and exploring tangents. Aim for quantity first, then refine.',
    createdAt: 0,
    updatedAt: 0,
  },
  {
    id: 'plan',
    name: 'Planner',
    description: 'Create structured plans and roadmaps',
    category: 'productivity',
    icon: 'list.bullet.clipboard',
    isBuiltin: true,
    enabled: true,
    command: 'plan',
    prompt: 'You are a strategic planner. Create detailed, actionable plans with clear phases, milestones, and steps. Break down complex goals into manageable tasks. Consider dependencies, risks, and resources. Format plans with clear sections: Goal, Phases, Timeline, Key Milestones, Risks & Mitigations.',
    createdAt: 0,
    updatedAt: 0,
  },
  {
    id: 'explain',
    name: 'Teacher',
    description: 'Explain complex topics in simple terms',
    category: 'analysis',
    icon: 'graduationcap',
    isBuiltin: true,
    enabled: true,
    command: 'explain',
    prompt: 'You are a patient, knowledgeable teacher. Explain complex topics clearly and accessibly. Use analogies, examples, and step-by-step breakdowns. Adapt your explanation level to the user\'s apparent expertise. Check for understanding and offer to elaborate on specific parts. Use the Feynman technique: explain as if to a curious beginner.',
    createdAt: 0,
    updatedAt: 0,
  },
  {
    id: 'review',
    name: 'Reviewer',
    description: 'Critically review documents, code, or ideas',
    category: 'analysis',
    icon: 'checkmark.seal',
    isBuiltin: true,
    enabled: true,
    command: 'review',
    prompt: 'You are a thorough, constructive reviewer. Provide balanced feedback covering: Strengths, Areas for Improvement, Specific Issues (with line references for code), and Actionable Recommendations. Be direct but constructive. Prioritize issues by severity. Always acknowledge what works well before suggesting improvements.',
    createdAt: 0,
    updatedAt: 0,
  },
  {
    id: 'debug',
    name: 'Debugger',
    description: 'Diagnose and fix bugs in code',
    category: 'coding',
    icon: 'ant',
    isBuiltin: true,
    enabled: true,
    command: 'debug',
    prompt: 'You are an expert debugger. Systematically diagnose issues by: 1) Identifying the error type and location, 2) Tracing the root cause, 3) Explaining why the bug occurs, 4) Providing a fix with explanation, 5) Suggesting how to prevent similar bugs. Ask for error messages, stack traces, and minimal reproducible examples when needed.',
    createdAt: 0,
    updatedAt: 0,
  },
];

// ─── Storage ──────────────────────────────────────────────────────────────────

export async function loadSkills(): Promise<Skill[]> {
  try {
    const raw = await AsyncStorage.getItem(SKILLS_KEY);
    if (!raw) return BUILTIN_SKILLS;

    const customSkills: Skill[] = JSON.parse(raw);
    // Merge: builtin skills + custom skills, with saved enabled states
    const customMap = new Map(customSkills.map((s) => [s.id, s]));

    const merged = BUILTIN_SKILLS.map((s) => {
      const saved = customMap.get(s.id);
      return saved ? { ...s, enabled: saved.enabled } : s;
    });

    // Add custom (non-builtin) skills
    const customOnly = customSkills.filter((s) => !s.isBuiltin);
    return [...merged, ...customOnly];
  } catch {
    return BUILTIN_SKILLS;
  }
}

export async function saveSkills(skills: Skill[]): Promise<void> {
  // Only save custom skills and enabled states
  const toSave = skills.map((s) => ({
    id: s.id,
    enabled: s.enabled,
    ...(s.isBuiltin ? {} : s),
  }));
  await AsyncStorage.setItem(SKILLS_KEY, JSON.stringify(toSave));
}

export async function createSkill(skill: Omit<Skill, 'id' | 'createdAt' | 'updatedAt' | 'isBuiltin'>): Promise<Skill> {
  const skills = await loadSkills();
  const newSkill: Skill = {
    ...skill,
    id: `skill_${Date.now()}`,
    isBuiltin: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await saveSkills([...skills, newSkill]);
  return newSkill;
}

export async function updateSkill(id: string, updates: Partial<Skill>): Promise<void> {
  const skills = await loadSkills();
  const updated = skills.map((s) => s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s);
  await saveSkills(updated);
}

export async function deleteSkill(id: string): Promise<void> {
  const skills = await loadSkills();
  const filtered = skills.filter((s) => s.id !== id || s.isBuiltin);
  await saveSkills(filtered);
}

/** Find a skill by slash command, e.g. "/translate" → Translator skill */
export function findSkillByCommand(input: string, skills: Skill[]): { skill: Skill; rest: string } | null {
  if (!input.startsWith('/')) return null;
  const parts = input.slice(1).split(' ');
  const cmd = parts[0].toLowerCase();
  const rest = parts.slice(1).join(' ');
  const skill = skills.find((s) => s.enabled && s.command === cmd);
  return skill ? { skill, rest } : null;
}
