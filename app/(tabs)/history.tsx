import React from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useApp } from '@/lib/app-context';
import { useColors } from '@/hooks/use-colors';
import { IconSymbol } from '@/components/ui/icon-symbol';

function formatDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function HistoryScreen() {
  const colors = useColors();
  const router = useRouter();
  const { state, setActive, removeConversation, clearAll } = useApp();

  const handleSelect = (id: string) => {
    setActive(id);
    router.push('/');
  };

  const handleDelete = (id: string, title: string) => {
    Alert.alert('Delete Conversation', `Delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeConversation(id) },
    ]);
  };

  const handleClearAll = () => {
    Alert.alert('Clear All Conversations', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear All', style: 'destructive', onPress: () => clearAll() },
    ]);
  };

  return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>History</Text>
        {state.conversations.length > 0 && (
          <Pressable
            onPress={handleClearAll}
            style={({ pressed }) => [styles.clearBtn, pressed && { opacity: 0.6 }]}
          >
            <Text style={[styles.clearText, { color: colors.error }]}>Clear All</Text>
          </Pressable>
        )}
      </View>

      {state.conversations.length === 0 ? (
        <View style={styles.empty}>
          <IconSymbol name="clock.fill" size={48} color={colors.border} />
          <Text style={[styles.emptyText, { color: colors.muted }]}>No conversations yet</Text>
        </View>
      ) : (
        <FlatList
          data={state.conversations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => handleSelect(item.id)}
              style={({ pressed }) => [
                styles.item,
                {
                  backgroundColor: item.id === state.activeConversationId ? colors.surface : colors.background,
                  borderColor: colors.border,
                },
                pressed && { opacity: 0.7 },
              ]}
            >
              <View style={styles.itemLeft}>
                <View style={[styles.itemIcon, { backgroundColor: colors.primary + '22' }]}>
                  <IconSymbol name="message.fill" size={16} color={colors.primary} />
                </View>
                <View style={styles.itemText}>
                  <Text style={[styles.itemTitle, { color: colors.foreground }]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={[styles.itemPreview, { color: colors.muted }]} numberOfLines={1}>
                    {item.messages[item.messages.length - 1]?.content?.slice(0, 60) ?? 'No messages'}
                  </Text>
                </View>
              </View>
              <View style={styles.itemRight}>
                <Text style={[styles.itemDate, { color: colors.muted }]}>{formatDate(item.updatedAt)}</Text>
                <Pressable
                  onPress={() => handleDelete(item.id, item.title)}
                  style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.6 }]}
                >
                  <IconSymbol name="trash.fill" size={16} color={colors.error} />
                </Pressable>
              </View>
            </Pressable>
          )}
          ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: colors.border }]} />}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  title: { fontSize: 20, fontWeight: '700' },
  clearBtn: { paddingVertical: 4, paddingHorizontal: 8 },
  clearText: { fontSize: 14, fontWeight: '500' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 15 },
  list: { paddingVertical: 4 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  itemLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  itemText: { flex: 1 },
  itemTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  itemPreview: { fontSize: 13 },
  itemRight: { alignItems: 'flex-end', gap: 6, marginLeft: 8 },
  itemDate: { fontSize: 12 },
  deleteBtn: { padding: 4 },
  separator: { height: 0.5 },
});
