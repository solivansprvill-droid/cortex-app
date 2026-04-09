import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Clipboard, Platform } from 'react-native';
import { Message } from '@/lib/types';
import { MarkdownRenderer } from './markdown-renderer';
import { useColors } from '@/hooks/use-colors';
import { IconSymbol } from './ui/icon-symbol';

interface MessageBubbleProps {
  message: Message;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const colors = useColors();
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (Platform.OS !== 'web') {
      Clipboard.setString(message.content);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isUser) {
    return (
      <View style={styles.userRow}>
        <View style={[styles.userBubble, { backgroundColor: colors.primary }]}>
          <MarkdownRenderer content={message.content} isUser />
          <Text style={styles.userTime}>{formatTime(message.createdAt)}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.aiRow}>
      {/* Avatar */}
      <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
        <Text style={styles.avatarText}>H</Text>
      </View>

      <View style={styles.aiContent}>
        <View style={[styles.aiBubble, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {message.isStreaming && message.content === '' ? (
            <View style={styles.typingRow}>
              <View style={[styles.dot, { backgroundColor: colors.muted }]} />
              <View style={[styles.dot, { backgroundColor: colors.muted }]} />
              <View style={[styles.dot, { backgroundColor: colors.muted }]} />
            </View>
          ) : (
            <MarkdownRenderer content={message.content} isUser={false} />
          )}
        </View>

        {/* Actions row */}
        {!message.isStreaming && message.content.length > 0 && (
          <View style={styles.actionsRow}>
            <Text style={[styles.aiTime, { color: colors.muted }]}>{formatTime(message.createdAt)}</Text>
            <Pressable
              onPress={handleCopy}
              style={({ pressed }) => [styles.copyBtn, pressed && { opacity: 0.6 }]}
            >
              <IconSymbol
                name={copied ? 'checkmark' : 'doc.on.clipboard'}
                size={14}
                color={copied ? colors.success : colors.muted}
              />
              <Text style={[styles.copyText, { color: copied ? colors.success : colors.muted }]}>
                {copied ? 'Copied' : 'Copy'}
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  userRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  userBubble: {
    maxWidth: '80%',
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userTime: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    marginTop: 4,
    textAlign: 'right',
  },
  aiRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 2,
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  aiContent: {
    flex: 1,
  },
  aiBubble: {
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.7,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  aiTime: {
    fontSize: 11,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  copyText: {
    fontSize: 11,
  },
});
