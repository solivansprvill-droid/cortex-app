import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TextInput, Pressable, StyleSheet, Alert, Modal,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { IconSymbol } from '@/components/ui/icon-symbol';
import {
  Memory, UserProfile, MemoryEntry,
  loadMemory, saveMemory, loadUserProfile, saveUserProfile,
  saveMemoryEntry, deleteMemoryEntry, clearMemory,
} from '@/lib/memory';

type Tab = 'memory' | 'profile';

const CATEGORY_COLORS: Record<string, string> = {
  fact: '#6366f1',
  preference: '#f59e0b',
  context: '#10b981',
  goal: '#f43f5e',
};

export default function MemoryScreen() {
  const colors = useColors();
  const [tab, setTab] = useState<Tab>('memory');
  const [memory, setMemory] = useState<Memory>({ entries: [], updatedAt: 0 });
  const [profile, setProfile] = useState<UserProfile>({ customFields: {}, updatedAt: 0 });
  const [showAddModal, setShowAddModal] = useState(false);
  const [editEntry, setEditEntry] = useState<MemoryEntry | null>(null);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryEntry['category']>('fact');

  useEffect(() => {
    loadMemory().then(setMemory);
    loadUserProfile().then(setProfile);
  }, []);

  const handleSaveEntry = useCallback(async () => {
    if (!newKey.trim() || !newValue.trim()) return;
    await saveMemoryEntry(newKey.trim(), newValue.trim(), newCategory);
    const updated = await loadMemory();
    setMemory(updated);
    setShowAddModal(false);
    setNewKey('');
    setNewValue('');
    setNewCategory('fact');
    setEditEntry(null);
  }, [newKey, newValue, newCategory]);

  const handleDeleteEntry = useCallback(async (key: string) => {
    Alert.alert('Delete Memory', `Remove "${key}" from memory?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await deleteMemoryEntry(key);
          const updated = await loadMemory();
          setMemory(updated);
        }
      },
    ]);
  }, []);

  const handleClearAll = useCallback(() => {
    Alert.alert('Clear All Memory', 'This will delete all stored memories. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear All', style: 'destructive', onPress: async () => {
          await clearMemory();
          setMemory({ entries: [], updatedAt: Date.now() });
        }
      },
    ]);
  }, []);

  const handleEditEntry = (entry: MemoryEntry) => {
    setEditEntry(entry);
    setNewKey(entry.key);
    setNewValue(entry.value);
    setNewCategory(entry.category ?? 'fact');
    setShowAddModal(true);
  };

  const handleSaveProfile = useCallback(async (updates: Partial<UserProfile>) => {
    const updated = { ...profile, ...updates };
    setProfile(updated);
    await saveUserProfile(updated);
  }, [profile]);

  return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Memory</Text>
        {tab === 'memory' && memory.entries.length > 0 && (
          <Pressable onPress={handleClearAll} style={({ pressed }) => [styles.clearBtn, pressed && { opacity: 0.6 }]}>
            <Text style={{ color: '#ef4444', fontSize: 13, fontWeight: '600' }}>Clear All</Text>
          </Pressable>
        )}
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        {(['memory', 'profile'] as Tab[]).map((t) => (
          <Pressable key={t} style={[styles.tab, tab === t && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, { color: tab === t ? colors.primary : colors.muted }]}>
              {t === 'memory' ? `Memory (${memory.entries.length})` : 'User Profile'}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === 'memory' ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Add button */}
          <Pressable
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            onPress={() => { setEditEntry(null); setNewKey(''); setNewValue(''); setNewCategory('fact'); setShowAddModal(true); }}
          >
            <IconSymbol name="plus" size={18} color="#fff" />
            <Text style={styles.addBtnText}>Add Memory</Text>
          </Pressable>

          {memory.entries.length === 0 ? (
            <View style={styles.empty}>
              <IconSymbol name="brain" size={48} color={colors.border} />
              <Text style={[styles.emptyTitle, { color: colors.muted }]}>No memories yet</Text>
              <Text style={[styles.emptyDesc, { color: colors.muted }]}>
                The AI can remember facts about you across conversations. Add memories manually or enable the Memory tool to let the AI save them automatically.
              </Text>
            </View>
          ) : (
            memory.entries.map((entry) => (
              <View key={entry.key} style={[styles.entryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.entryHeader}>
                  <View style={[styles.categoryDot, { backgroundColor: CATEGORY_COLORS[entry.category ?? 'fact'] }]} />
                  <Text style={[styles.entryKey, { color: colors.foreground }]}>{entry.key}</Text>
                  <Text style={[styles.entryCategory, { color: colors.muted }]}>{entry.category ?? 'fact'}</Text>
                </View>
                <Text style={[styles.entryValue, { color: colors.muted }]}>{entry.value}</Text>
                <View style={styles.entryActions}>
                  <Pressable onPress={() => handleEditEntry(entry)} style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.6 }]}>
                    <IconSymbol name="square.and.pencil" size={16} color={colors.primary} />
                    <Text style={[styles.actionText, { color: colors.primary }]}>Edit</Text>
                  </Pressable>
                  <Pressable onPress={() => handleDeleteEntry(entry.key)} style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.6 }]}>
                    <IconSymbol name="trash.fill" size={16} color="#ef4444" />
                    <Text style={[styles.actionText, { color: '#ef4444' }]}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            ))
          )}
          <View style={{ height: 32 }} />
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={[styles.sectionLabel, { color: colors.muted }]}>BASIC INFO</Text>
          {[
            { label: 'Name', key: 'name', placeholder: 'Your name' },
            { label: 'Occupation', key: 'occupation', placeholder: 'Your job or role' },
            { label: 'Language', key: 'language', placeholder: 'Preferred language (e.g. Chinese)' },
            { label: 'Timezone', key: 'timezone', placeholder: 'e.g. Asia/Shanghai' },
          ].map(({ label, key, placeholder }) => (
            <View key={key} style={[styles.fieldCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.fieldLabel, { color: colors.muted }]}>{label}</Text>
              <TextInput
                style={[styles.fieldInput, { color: colors.foreground }]}
                placeholder={placeholder}
                placeholderTextColor={colors.muted}
                value={(profile as Record<string, string>)[key] ?? ''}
                onChangeText={(v) => handleSaveProfile({ [key]: v })}
              />
            </View>
          ))}

          <Text style={[styles.sectionLabel, { color: colors.muted, marginTop: 16 }]}>INTERESTS</Text>
          <View style={[styles.fieldCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.fieldLabel, { color: colors.muted }]}>Interests (comma separated)</Text>
            <TextInput
              style={[styles.fieldInput, { color: colors.foreground }]}
              placeholder="e.g. coding, AI, music"
              placeholderTextColor={colors.muted}
              value={(profile.interests ?? []).join(', ')}
              onChangeText={(v) => handleSaveProfile({ interests: v.split(',').map((s) => s.trim()).filter(Boolean) })}
            />
          </View>

          <View style={[styles.infoBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <IconSymbol name="info.circle.fill" size={16} color={colors.muted} />
            <Text style={[styles.infoText, { color: colors.muted }]}>
              Profile information is automatically injected into every conversation so the AI knows who you are.
            </Text>
          </View>
          <View style={{ height: 32 }} />
        </ScrollView>
      )}

      {/* Add/Edit Memory Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              {editEntry ? 'Edit Memory' : 'Add Memory'}
            </Text>

            <Text style={[styles.inputLabel, { color: colors.muted }]}>Key</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
              placeholder="e.g. user_name, favorite_color"
              placeholderTextColor={colors.muted}
              value={newKey}
              onChangeText={setNewKey}
              editable={!editEntry}
            />

            <Text style={[styles.inputLabel, { color: colors.muted }]}>Value</Text>
            <TextInput
              style={[styles.modalInput, styles.modalTextarea, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
              placeholder="The value to remember"
              placeholderTextColor={colors.muted}
              value={newValue}
              onChangeText={setNewValue}
              multiline
              numberOfLines={3}
            />

            <Text style={[styles.inputLabel, { color: colors.muted }]}>Category</Text>
            <View style={styles.categoryRow}>
              {(['fact', 'preference', 'context', 'goal'] as MemoryEntry['category'][]).map((cat) => (
                <Pressable
                  key={cat}
                  style={[styles.catChip, { borderColor: newCategory === cat ? CATEGORY_COLORS[cat!] : colors.border, backgroundColor: newCategory === cat ? CATEGORY_COLORS[cat!] + '20' : 'transparent' }]}
                  onPress={() => setNewCategory(cat)}
                >
                  <Text style={[styles.catChipText, { color: newCategory === cat ? CATEGORY_COLORS[cat!] : colors.muted }]}>{cat}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => setShowAddModal(false)}>
                <Text style={[styles.modalBtnText, { color: colors.muted }]}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, { backgroundColor: colors.primary }]} onPress={handleSaveEntry}>
                <Text style={[styles.modalBtnText, { color: '#fff' }]}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5 },
  headerTitle: { fontSize: 20, fontWeight: '700', flex: 1 },
  clearBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  tabs: { flexDirection: 'row', borderBottomWidth: 0.5 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabText: { fontSize: 14, fontWeight: '600' },
  content: { padding: 16, gap: 10 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12 },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600' },
  emptyDesc: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  entryCard: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 8 },
  entryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  categoryDot: { width: 8, height: 8, borderRadius: 4 },
  entryKey: { fontSize: 14, fontWeight: '700', flex: 1 },
  entryCategory: { fontSize: 11, fontWeight: '500' },
  entryValue: { fontSize: 13, lineHeight: 19 },
  entryActions: { flexDirection: 'row', gap: 16, marginTop: 4 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: 13, fontWeight: '500' },
  sectionLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.8 },
  fieldCard: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 4 },
  fieldLabel: { fontSize: 12, fontWeight: '500' },
  fieldInput: { fontSize: 15, paddingVertical: 4 },
  infoBox: { flexDirection: 'row', gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, alignItems: 'flex-start' },
  infoText: { fontSize: 12, lineHeight: 18, flex: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, padding: 20, gap: 12 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  inputLabel: { fontSize: 12, fontWeight: '500' },
  modalInput: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  modalTextarea: { minHeight: 80, textAlignVertical: 'top' },
  categoryRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  catChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  catChipText: { fontSize: 13, fontWeight: '500' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  modalBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  modalBtnText: { fontWeight: '600', fontSize: 15 },
});
