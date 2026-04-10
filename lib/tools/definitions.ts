import { Toolset } from './types';

export const BUILTIN_TOOLSETS: Toolset[] = [
  {
    id: 'search',
    name: 'Web Search',
    description: 'Search the web using DuckDuckGo',
    category: 'search',
    icon: 'magnifyingglass',
    enabled: true,
    tools: [
      {
        name: 'web_search',
        description: 'Search the web for information. Use this for current events, facts, or any information you are unsure about.',
        category: 'search',
        parameters: {
          query: {
            type: 'string',
            description: 'The search query',
            required: true,
          },
          max_results: {
            type: 'number',
            description: 'Maximum number of results to return (1-10)',
          },
        },
        requiredParams: ['query'],
      },
    ],
  },
  {
    id: 'math',
    name: 'Calculator',
    description: 'Perform mathematical calculations',
    category: 'math',
    icon: 'function',
    enabled: true,
    tools: [
      {
        name: 'calculator',
        description: 'Evaluate a mathematical expression. Supports basic arithmetic, trigonometry, logarithms, and more.',
        category: 'math',
        parameters: {
          expression: {
            type: 'string',
            description: 'The mathematical expression to evaluate, e.g. "2 + 2", "sqrt(16)", "sin(PI/2)"',
            required: true,
          },
        },
        requiredParams: ['expression'],
      },
    ],
  },
  {
    id: 'datetime',
    name: 'Date & Time',
    description: 'Get current date, time, and perform date calculations',
    category: 'datetime',
    icon: 'clock',
    enabled: true,
    tools: [
      {
        name: 'get_datetime',
        description: 'Get the current date and time, or calculate date differences.',
        category: 'datetime',
        parameters: {
          timezone: {
            type: 'string',
            description: 'Optional timezone, e.g. "Asia/Shanghai", "America/New_York". Defaults to device timezone.',
          },
          format: {
            type: 'string',
            description: 'Optional format: "full", "date", "time", "iso". Defaults to "full".',
            enum: ['full', 'date', 'time', 'iso'],
          },
        },
        requiredParams: [],
      },
    ],
  },
  {
    id: 'web',
    name: 'Web Fetch',
    description: 'Fetch and read content from web pages',
    category: 'web',
    icon: 'globe',
    enabled: true,
    tools: [
      {
        name: 'url_fetch',
        description: 'Fetch the content of a URL and return it as text. Useful for reading articles, documentation, or any web page.',
        category: 'web',
        parameters: {
          url: {
            type: 'string',
            description: 'The URL to fetch',
            required: true,
          },
          max_chars: {
            type: 'number',
            description: 'Maximum characters to return (default 3000)',
          },
        },
        requiredParams: ['url'],
      },
    ],
  },
  {
    id: 'weather',
    name: 'Weather',
    description: 'Get current weather information',
    category: 'weather',
    icon: 'cloud.sun',
    enabled: false,
    tools: [
      {
        name: 'get_weather',
        description: 'Get current weather for a location using Open-Meteo (free, no API key required).',
        category: 'weather',
        parameters: {
          location: {
            type: 'string',
            description: 'City name or "lat,lon" coordinates, e.g. "Beijing" or "39.9,116.4"',
            required: true,
          },
          units: {
            type: 'string',
            description: 'Temperature units: "celsius" or "fahrenheit"',
            enum: ['celsius', 'fahrenheit'],
          },
        },
        requiredParams: ['location'],
      },
    ],
  },
  {
    id: 'memory',
    name: 'Memory',
    description: 'Read and write persistent memory',
    category: 'memory',
    icon: 'brain',
    enabled: true,
    tools: [
      {
        name: 'memory_read',
        description: 'Read the current persistent memory (facts about the user and important context).',
        category: 'memory',
        parameters: {},
        requiredParams: [],
      },
      {
        name: 'memory_write',
        description: 'Add or update a fact in persistent memory.',
        category: 'memory',
        parameters: {
          key: {
            type: 'string',
            description: 'A short identifier for this memory, e.g. "user_name", "preferred_language"',
            required: true,
          },
          value: {
            type: 'string',
            description: 'The value to store',
            required: true,
          },
        },
        requiredParams: ['key', 'value'],
      },
    ],
  },
];
