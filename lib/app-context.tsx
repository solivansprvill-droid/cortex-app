import React, { createContext, useContext, useEffect, useReducer, useCallback, useRef } from 'react';
import {
  Conversation, Message, ModelConfig, GatewayConfig,
  DEFAULT_MODEL_CONFIG, DEFAULT_GATEWAY_CONFIG,
} from './types';
import {
  loadConversations, saveConversations, loadModelConfig, saveModelConfig,
  deleteConversation, clearAllConversations,
} from './storage';
import { loadGatewayConfig, saveGatewayConfig } from './gateway';

// ─── State ────────────────────────────────────────────────────────────────────

interface AppState {
  conversations: Conversation[];
  activeConversationId: string | null;
  modelConfig: ModelConfig;
  gatewayConfig: GatewayConfig;
  isLoaded: boolean;
}

type AppAction =
  | { type: 'LOAD'; conversations: Conversation[]; modelConfig: ModelConfig; gatewayConfig: GatewayConfig }
  | { type: 'SET_ACTIVE'; id: string | null }
  | { type: 'NEW_CONVERSATION'; conversation: Conversation }
  | { type: 'UPDATE_CONVERSATION'; conversation: Conversation }
  | { type: 'DELETE_CONVERSATION'; id: string }
  | { type: 'CLEAR_ALL' }
  | { type: 'SET_MODEL_CONFIG'; config: ModelConfig }
  | { type: 'SET_GATEWAY_CONFIG'; config: GatewayConfig };

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'LOAD':
      return { ...state, conversations: action.conversations, modelConfig: action.modelConfig, gatewayConfig: action.gatewayConfig, isLoaded: true };
    case 'SET_ACTIVE':
      return { ...state, activeConversationId: action.id };
    case 'NEW_CONVERSATION':
      return { ...state, conversations: [action.conversation, ...state.conversations], activeConversationId: action.conversation.id };
    case 'UPDATE_CONVERSATION':
      return { ...state, conversations: state.conversations.map((c) => c.id === action.conversation.id ? action.conversation : c) };
    case 'DELETE_CONVERSATION': {
      const filtered = state.conversations.filter((c) => c.id !== action.id);
      return { ...state, conversations: filtered, activeConversationId: state.activeConversationId === action.id ? (filtered[0]?.id ?? null) : state.activeConversationId };
    }
    case 'CLEAR_ALL':
      return { ...state, conversations: [], activeConversationId: null };
    case 'SET_MODEL_CONFIG':
      return { ...state, modelConfig: action.config };
    case 'SET_GATEWAY_CONFIG':
      return { ...state, gatewayConfig: action.config };
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface AppContextValue {
  state: AppState;
  activeConversation: Conversation | null;
  createConversation: () => Conversation;
  updateConversation: (conv: Conversation) => void;
  removeConversation: (id: string) => void;
  clearAll: () => void;
  setActive: (id: string | null) => void;
  updateModelConfig: (config: ModelConfig) => void;
  updateGatewayConfig: (config: GatewayConfig) => void;
  addMessage: (convId: string, message: Message) => void;
  updateLastMessage: (convId: string, content: string, isStreaming: boolean) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    conversations: [],
    activeConversationId: null,
    modelConfig: DEFAULT_MODEL_CONFIG,
    gatewayConfig: DEFAULT_GATEWAY_CONFIG,
    isLoaded: false,
  });

  // Keep a ref to always-current conversations for use in callbacks
  const convsRef = useRef<Conversation[]>(state.conversations);
  useEffect(() => { convsRef.current = state.conversations; }, [state.conversations]);

  useEffect(() => {
    (async () => {
      const [conversations, modelConfig, gatewayConfig] = await Promise.all([
        loadConversations(),
        loadModelConfig(),
        loadGatewayConfig(),
      ]);
      dispatch({ type: 'LOAD', conversations, modelConfig, gatewayConfig });
    })();
  }, []);

  useEffect(() => {
    if (state.isLoaded) saveConversations(state.conversations);
  }, [state.conversations, state.isLoaded]);

  const activeConversation = state.conversations.find((c) => c.id === state.activeConversationId) ?? null;

  const createConversation = useCallback((): Conversation => {
    const now = Date.now();
    const conv: Conversation = { id: `conv_${now}`, title: 'New Conversation', messages: [], createdAt: now, updatedAt: now };
    dispatch({ type: 'NEW_CONVERSATION', conversation: conv });
    return conv;
  }, []);

  const updateConversation = useCallback((conv: Conversation) => {
    dispatch({ type: 'UPDATE_CONVERSATION', conversation: conv });
  }, []);

  const removeConversation = useCallback((id: string) => {
    deleteConversation(id);
    dispatch({ type: 'DELETE_CONVERSATION', id });
  }, []);

  const clearAll = useCallback(() => {
    clearAllConversations();
    dispatch({ type: 'CLEAR_ALL' });
  }, []);

  const setActive = useCallback((id: string | null) => {
    dispatch({ type: 'SET_ACTIVE', id });
  }, []);

  const updateModelConfig = useCallback((config: ModelConfig) => {
    saveModelConfig(config);
    dispatch({ type: 'SET_MODEL_CONFIG', config });
  }, []);

  const updateGatewayConfig = useCallback((config: GatewayConfig) => {
    saveGatewayConfig(config);
    dispatch({ type: 'SET_GATEWAY_CONFIG', config });
  }, []);

  const addMessage = useCallback((convId: string, message: Message) => {
    const conv = convsRef.current.find((c) => c.id === convId);
    if (!conv) return;
    const updated: Conversation = {
      ...conv,
      messages: [...conv.messages, message],
      updatedAt: Date.now(),
      title: conv.messages.length === 0 && message.role === 'user'
        ? message.content.slice(0, 40) || 'New Conversation'
        : conv.title,
    };
    dispatch({ type: 'UPDATE_CONVERSATION', conversation: updated });
  }, []);

  const updateLastMessage = useCallback((convId: string, content: string, isStreaming: boolean) => {
    const conv = convsRef.current.find((c) => c.id === convId);
    if (!conv || conv.messages.length === 0) return;
    const messages = [...conv.messages];
    messages[messages.length - 1] = { ...messages[messages.length - 1], content, isStreaming };
    dispatch({ type: 'UPDATE_CONVERSATION', conversation: { ...conv, messages, updatedAt: Date.now() } });
  }, []);

  return (
    <AppContext.Provider value={{
      state, activeConversation,
      createConversation, updateConversation, removeConversation, clearAll,
      setActive, updateModelConfig, updateGatewayConfig, addMessage, updateLastMessage,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
