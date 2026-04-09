import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  View, Text, FlatList, Pressable, StyleSheet, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { MessageBubble } from '@/components/message-bubble';
import { ChatInput } from '@/components/chat-input';
import { useApp } from '@/lib/app-context';
import { useColors } from '@/hooks/use-colors';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { streamChat } from '@/lib/ai';
import { Message } from '@/lib/types';
import { sendTelegram, sendHomeAssistant } from '@/lib/gateway';

export default function ChatScreen() {
  const colors = useColors();
  const router = useRouter();
  const {
    state, activeConversation, createConversation,
    addMessage, updateLastMessage, setActive,
  } = useApp();

  const flatListRef = useRef<FlatList>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  // Auto-create a conversation on first load
  useEffect(() => {
    if (state.isLoaded && !state.activeConversationId) {
      createConversation();
    }
  }, [state.isLoaded]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages.length]);

  const handleSend = useCallback(async (text: string) => {
    if (!activeConversation) return;

    const { modelConfig, gatewayConfig } = state;

    if (!modelConfig.apiKey) {
      Alert.alert(
        'API Key Required',
        'Please configure your API key in Settings before chatting.',
        [{ text: 'Go to Settings', onPress: () => router.push('/settings') }]
      );
      return;
    }

    const userMsg: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: Date.now(),
    };
    addMessage(activeConversation.id, userMsg);

    const aiMsg: Message = {
      id: `msg_${Date.now() + 1}`,
      role: 'assistant',
      content: '',
      createdAt: Date.now(),
      isStreaming: true,
    };
    addMessage(activeConversation.id, aiMsg);
    setIsStreaming(true);
    scrollToBottom();

    const allMessages = [...activeConversation.messages, userMsg];
    let fullContent = '';

    const controller = streamChat(allMessages, modelConfig, {
      onChunk: (chunk) => {
        fullContent += chunk;
        updateLastMessage(activeConversation.id, fullContent, true);
        scrollToBottom();
      },
      onDone: async () => {
        updateLastMessage(activeConversation.id, fullContent, false);
        setIsStreaming(false);

        // Push to gateways if enabled
        try {
          if (gatewayConfig.telegram.enabled && gatewayConfig.telegram.botToken && gatewayConfig.telegram.chatId) {
            await sendTelegram(
              gatewayConfig.telegram.botToken,
              gatewayConfig.telegram.chatId,
              `*Cortex:* ${fullContent.slice(0, 4000)}`
            );
          }
          if (gatewayConfig.homeAssistant.enabled && gatewayConfig.homeAssistant.token) {
            await sendHomeAssistant(
              gatewayConfig.homeAssistant.url,
              gatewayConfig.homeAssistant.token,
              gatewayConfig.homeAssistant.notifyService,
              fullContent.slice(0, 2000),
              'Cortex'
            );
          }
        } catch (e) {
          // Gateway errors are non-fatal
          console.warn('Gateway push failed:', e);
        }
      },
      onError: (err) => {
        updateLastMessage(activeConversation.id, `Error: ${err.message}`, false);
        setIsStreaming(false);
      },
    });

    abortRef.current = controller;
  }, [activeConversation, state, addMessage, updateLastMessage, scrollToBottom, router]);

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
    if (activeConversation) {
      updateLastMessage(activeConversation.id, activeConversation.messages[activeConversation.messages.length - 1]?.content ?? '', false);
    }
    setIsStreaming(false);
  }, [activeConversation, updateLastMessage]);

  const handleNewChat = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
    createConversation();
  }, [createConversation]);

  const messages = activeConversation?.messages ?? [];
  const isConfigured = !!state.modelConfig.apiKey;

  return (
    <ScreenContainer containerClassName="bg-background" edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <Pressable
          onPress={() => router.push('/history')}
          style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.6 }]}
        >
          <IconSymbol name="clock.fill" size={22} color={colors.muted} />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
            {activeConversation?.title ?? 'Cortex'}
          </Text>
          <View style={[styles.modelBadge, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modelBadgeText, { color: colors.muted }]} numberOfLines={1}>
              {state.modelConfig.model.split('/').pop() ?? state.modelConfig.model}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={handleNewChat}
          style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.6 }]}
        >
          <IconSymbol name="plus" size={24} color={colors.primary} />
        </Pressable>
      </View>

      {/* Messages */}
      {messages.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyAvatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.emptyAvatarText}>C</Text>
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Cortex</Text>
          <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
            {isConfigured
              ? 'Your intelligent AI assistant.\nStart a conversation below.'
              : 'Configure your API key in Settings to get started.'}
          </Text>
          {!isConfigured && (
            <Pressable
              onPress={() => router.push('/settings')}
              style={({ pressed }) => [styles.setupBtn, { backgroundColor: colors.primary }, pressed && { opacity: 0.8 }]}
            >
              <Text style={styles.setupBtnText}>Configure API Key</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MessageBubble message={item} />}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
        />
      )}

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        onStop={handleStop}
        isStreaming={isStreaming}
        disabled={!isConfigured}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  modelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    maxWidth: 180,
  },
  modelBadgeText: {
    fontSize: 11,
  },
  messageList: {
    paddingVertical: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyAvatarText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  setupBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  setupBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
});
