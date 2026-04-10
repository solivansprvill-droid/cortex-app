import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, Switch, Pressable, StyleSheet, Alert,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Toolset } from '@/lib/tools/types';
import { loadToolsets, saveToolsets } from '@/lib/tools/storage';

const CATEGORY_ICONS: Record<string, string> = {
  search: 'magnifyingglass',
  math: 'function',
  datetime: 'clock.fill',
  web: 'globe',
  weather: 'cloud.sun',
  memory: 'brain',
  skills: 'wand.and.stars',
  mcp: 'network',
  system: 'gearshape.fill',
};

export default function ToolsScreen() {
  const colors = useColors();
  const [toolsets, setToolsets] = useState<Toolset[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    loadToolsets().then(setToolsets);
  }, []);

  const toggleToolset = useCallback(async (id: string, value: boolean) => {
    const updated = toolsets.map((ts) => ts.id === id ? { ...ts, enabled: value } : ts);
    setToolsets(updated);
    await saveToolsets(updated);
  }, [toolsets]);

  const enabledCount = toolsets.filter((ts) => ts.enabled).length;
  const totalTools = toolsets.filter((ts) => ts.enabled).reduce((acc, ts) => acc + ts.tools.length, 0);

  return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Tools</Text>
        <View style={[styles.badge, { backgroundColor: colors.primary + '20' }]}>
          <Text style={[styles.badgeText, { color: colors.primary }]}>
            {totalTools} active
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Summary */}
        <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <IconSymbol name="wrench.and.screwdriver.fill" size={20} color={colors.primary} />
          <Text style={[styles.summaryText, { color: colors.foreground }]}>
            <Text style={{ fontWeight: '700' }}>{enabledCount}</Text> of {toolsets.length} toolsets enabled
            {' · '}<Text style={{ fontWeight: '700' }}>{totalTools}</Text> tools available
          </Text>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.muted }]}>TOOLSETS</Text>

        {toolsets.map((toolset) => (
          <View
            key={toolset.id}
            style={[styles.card, { backgroundColor: colors.surface, borderColor: toolset.enabled ? colors.primary + '40' : colors.border }]}
          >
            {/* Toolset Header */}
            <Pressable
              style={styles.cardHeader}
              onPress={() => setExpanded(expanded === toolset.id ? null : toolset.id)}
            >
              <View style={[styles.iconWrap, { backgroundColor: toolset.enabled ? colors.primary + '20' : colors.border + '40' }]}>
                <IconSymbol
                  name={CATEGORY_ICONS[toolset.category] ?? 'hammer.fill'}
                  size={20}
                  color={toolset.enabled ? colors.primary : colors.muted}
                />
              </View>
              <View style={styles.cardInfo}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>{toolset.name}</Text>
                <Text style={[styles.cardDesc, { color: colors.muted }]} numberOfLines={1}>
                  {toolset.description}
                </Text>
              </View>
              <View style={styles.cardRight}>
                <Text style={[styles.toolCount, { color: colors.muted }]}>
                  {toolset.tools.length} {toolset.tools.length === 1 ? 'tool' : 'tools'}
                </Text>
                <Switch
                  value={toolset.enabled}
                  onValueChange={(v) => toggleToolset(toolset.id, v)}
                  trackColor={{ false: colors.border, true: colors.primary + '80' }}
                  thumbColor={toolset.enabled ? colors.primary : colors.muted}
                />
              </View>
            </Pressable>

            {/* Expanded tool list */}
            {expanded === toolset.id && (
              <View style={[styles.toolList, { borderTopColor: colors.border }]}>
                {toolset.tools.map((tool) => (
                  <View key={tool.name} style={styles.toolItem}>
                    <View style={[styles.toolDot, { backgroundColor: toolset.enabled ? colors.primary : colors.muted }]} />
                    <View style={styles.toolInfo}>
                      <Text style={[styles.toolName, { color: colors.foreground }]}>{tool.name}</Text>
                      <Text style={[styles.toolDesc, { color: colors.muted }]}>{tool.description}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}

        {/* Info box */}
        <View style={[styles.infoBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <IconSymbol name="info.circle.fill" size={16} color={colors.muted} />
          <Text style={[styles.infoText, { color: colors.muted }]}>
            Enabled tools are automatically available to the AI during conversations. The AI decides when to use them based on your messages.
          </Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    gap: 10,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', flex: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  content: { padding: 16, gap: 10 },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 4,
  },
  summaryText: { fontSize: 14, flex: 1 },
  sectionLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.8, marginTop: 4 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1, gap: 2 },
  cardTitle: { fontSize: 15, fontWeight: '600' },
  cardDesc: { fontSize: 12 },
  cardRight: { alignItems: 'flex-end', gap: 4 },
  toolCount: { fontSize: 11 },
  toolList: {
    borderTopWidth: 0.5,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  toolItem: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  toolDot: { width: 6, height: 6, borderRadius: 3, marginTop: 5 },
  toolInfo: { flex: 1, gap: 2 },
  toolName: { fontSize: 13, fontWeight: '600' },
  toolDesc: { fontSize: 12, lineHeight: 17 },
  infoBox: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
    alignItems: 'flex-start',
  },
  infoText: { fontSize: 12, lineHeight: 18, flex: 1 },
});
