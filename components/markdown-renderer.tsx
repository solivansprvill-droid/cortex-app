import React from 'react';
import { StyleSheet, View } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useColors } from '@/hooks/use-colors';

interface MarkdownRendererProps {
  content: string;
  isUser?: boolean;
}

export function MarkdownRenderer({ content, isUser = false }: MarkdownRendererProps) {
  const colors = useColors();

  const textColor = isUser ? '#FFFFFF' : colors.foreground;
  const codeBackground = isUser ? 'rgba(0,0,0,0.2)' : colors.border;
  const codeBorder = isUser ? 'rgba(255,255,255,0.2)' : colors.border;

  const styles = StyleSheet.create({
    body: {
      color: textColor,
      fontSize: 15,
      lineHeight: 22,
    },
    heading1: { color: textColor, fontSize: 20, fontWeight: '700', marginBottom: 8, marginTop: 4 },
    heading2: { color: textColor, fontSize: 18, fontWeight: '700', marginBottom: 6, marginTop: 4 },
    heading3: { color: textColor, fontSize: 16, fontWeight: '600', marginBottom: 4, marginTop: 4 },
    strong: { fontWeight: '700', color: textColor },
    em: { fontStyle: 'italic', color: textColor },
    code_inline: {
      backgroundColor: codeBackground,
      color: isUser ? '#E0E0FF' : colors.primary,
      fontFamily: 'monospace',
      fontSize: 13,
      paddingHorizontal: 4,
      paddingVertical: 1,
      borderRadius: 4,
    },
    fence: {
      backgroundColor: codeBackground,
      borderColor: codeBorder,
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      marginVertical: 6,
    },
    code_block: {
      backgroundColor: codeBackground,
      borderColor: codeBorder,
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      marginVertical: 6,
      fontFamily: 'monospace',
      fontSize: 13,
      color: isUser ? '#E0E0FF' : colors.foreground,
    },
    blockquote: {
      borderLeftColor: isUser ? 'rgba(255,255,255,0.5)' : colors.primary,
      borderLeftWidth: 3,
      paddingLeft: 12,
      marginLeft: 0,
      opacity: 0.85,
    },
    bullet_list: { marginVertical: 4 },
    ordered_list: { marginVertical: 4 },
    list_item: { marginVertical: 2 },
    bullet_list_icon: { color: textColor, marginRight: 6 },
    ordered_list_icon: { color: textColor, marginRight: 6 },
    link: { color: isUser ? '#A0D4FF' : colors.accent, textDecorationLine: 'underline' },
    hr: { backgroundColor: codeBorder, height: 1, marginVertical: 8 },
    table: { borderWidth: 1, borderColor: codeBorder, borderRadius: 6, marginVertical: 6 },
    th: { backgroundColor: codeBackground, padding: 6, fontWeight: '700', color: textColor },
    td: { padding: 6, color: textColor },
    tr: { borderBottomWidth: 1, borderBottomColor: codeBorder },
    paragraph: { marginVertical: 2, color: textColor },
  });

  return (
    <View>
      <Markdown style={styles as any}>{content}</Markdown>
    </View>
  );
}
