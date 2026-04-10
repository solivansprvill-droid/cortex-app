import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  ActivityIndicator, TextInput, FlatList,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';
import { useApp } from '@/lib/app-context';
import { testModelConnection, ModelTestResult } from '@/lib/ai';
import { MODEL_PRESETS, ModelPreset } from '@/lib/model-presets';

// ─── Types ────────────────────────────────────────────────────────────────────

type TestStatus = 'idle' | 'testing' | 'success' | 'error';

interface ModelTestState {
  status: TestStatus;
  result?: ModelTestResult;
}

// ─── Provider grouping ────────────────────────────────────────────────────────

function getProvider(baseUrl: string): string {
  if (baseUrl.includes('openai.com')) return 'OpenAI';
  if (baseUrl.includes('anthropic.com')) return 'Anthropic';
  if (baseUrl.includes('googleapis.com')) return 'Google';
  if (baseUrl.includes('mistral.ai')) return 'Mistral';
  if (baseUrl.includes('openrouter.ai')) return 'OpenRouter';
  if (baseUrl.includes('groq.com')) return 'Groq';
  if (baseUrl.includes('together.xyz')) return 'Together AI';
  if (baseUrl.includes('replicate.com')) return 'Replicate';
  if (baseUrl.includes('edgefn.net')) return 'EdgeFn';
  if (baseUrl.includes('localhost')) return 'Local';
  return 'Custom';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status, result }: { status: TestStatus; result?: ModelTestResult }) {
  const colors = useColors();

  if (status === 'idle') {
    return (
      <View style={[styles.badge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <IconSymbol name="minus.circle" size={13} color={colors.muted} />
        <Text style={[styles.badgeText, { color: colors.muted }]}>未测试</Text>
      </View>
    );
  }
  if (status === 'testing') {
    return (
      <View style={[styles.badge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <ActivityIndicator size={12} color={colors.primary} />
        <Text style={[styles.badgeText, { color: colors.primary }]}>测试中...</Text>
      </View>
    );
  }
  if (status === 'success') {
    return (
      <View style={[styles.badge, { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' }]}>
        <IconSymbol name="checkmark.circle.fill" size={13} color="#16A34A" />
        <Text style={[styles.badgeText, { color: '#16A34A' }]}>
          {result?.latencyMs != null ? `${result.latencyMs}ms` : '成功'}
        </Text>
      </View>
    );
  }
  return (
    <View style={[styles.badge, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}>
      <IconSymbol name="xmark.circle.fill" size={13} color="#DC2626" />
      <Text style={[styles.badgeText, { color: '#DC2626' }]} numberOfLines={1}>失败</Text>
    </View>
  );
}

function ModelCard({
  preset,
  testState,
  apiKey,
  onTest,
  onUse,
  isCurrentModel,
}: {
  preset: ModelPreset;
  testState: ModelTestState;
  apiKey: string;
  onTest: () => void;
  onUse: () => void;
  isCurrentModel: boolean;
}) {
  const colors = useColors();
  const { status, result } = testState;

  return (
    <View style={[
      styles.card,
      { backgroundColor: colors.surface, borderColor: isCurrentModel ? colors.primary : colors.border },
      isCurrentModel && { borderWidth: 1.5 },
    ]}>
      {/* Card header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Text style={[styles.cardName, { color: colors.foreground }]} numberOfLines={1}>
            {preset.name}
          </Text>
          {isCurrentModel && (
            <View style={[styles.currentBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.currentBadgeText}>当前</Text>
            </View>
          )}
        </View>
        <StatusBadge status={status} result={result} />
      </View>

      {/* Model ID */}
      <Text style={[styles.cardModel, { color: colors.muted }]} numberOfLines={1}>
        {preset.model}
      </Text>

      {/* Error / preview message */}
      {status === 'error' && result?.message && (
        <Text style={[styles.errorMsg, { color: '#DC2626' }]} numberOfLines={2}>
          {result.message}
        </Text>
      )}
      {status === 'success' && result?.preview && (
        <Text style={[styles.previewMsg, { color: colors.muted }]} numberOfLines={1}>
          回复预览: "{result.preview}"
        </Text>
      )}

      {/* Actions */}
      <View style={styles.cardActions}>
        <Pressable
          onPress={onTest}
          disabled={status === 'testing'}
          style={({ pressed }) => [
            styles.actionBtn,
            { backgroundColor: colors.background, borderColor: colors.border },
            pressed && { opacity: 0.7 },
            status === 'testing' && { opacity: 0.5 },
          ]}
        >
          {status === 'testing'
            ? <ActivityIndicator size={13} color={colors.primary} />
            : <IconSymbol name="wifi" size={13} color={colors.primary} />
          }
          <Text style={[styles.actionBtnText, { color: colors.primary }]}>
            {status === 'testing' ? '测试中' : '测试连接'}
          </Text>
        </Pressable>

        {!isCurrentModel && (
          <Pressable
            onPress={onUse}
            style={({ pressed }) => [
              styles.actionBtn,
              { backgroundColor: colors.primary, borderColor: colors.primary },
              pressed && { opacity: 0.8 },
            ]}
          >
            <IconSymbol name="checkmark" size={13} color="#FFFFFF" />
            <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>使用此模型</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ModelsScreen() {
  const colors = useColors();
  const { t } = useTranslation();
  const { state, updateModelConfig } = useApp();

  const [testStates, setTestStates] = useState<Record<string, ModelTestState>>({});
  const [apiKey, setApiKey] = useState(state.modelConfig.apiKey);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTestingAll, setIsTestingAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'error'>('all');

  const currentModel = state.modelConfig.model;

  const filteredPresets = useMemo(() => {
    let list = MODEL_PRESETS;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.model.toLowerCase().includes(q)
      );
    }
    if (filterStatus === 'success') {
      list = list.filter((p) => testStates[p.model]?.status === 'success');
    } else if (filterStatus === 'error') {
      list = list.filter((p) => testStates[p.model]?.status === 'error');
    }
    return list;
  }, [searchQuery, filterStatus, testStates]);

  const setModelState = useCallback((model: string, state: ModelTestState) => {
    setTestStates((prev) => ({ ...prev, [model]: state }));
  }, []);

  const handleTestOne = useCallback(async (preset: ModelPreset) => {
    if (!apiKey.trim()) return;
    setModelState(preset.model, { status: 'testing' });
    const result = await testModelConnection({
      baseUrl: preset.baseUrl,
      apiKey: apiKey.trim(),
      model: preset.model,
    });
    setModelState(preset.model, { status: result.ok ? 'success' : 'error', result });
  }, [apiKey, setModelState]);

  const handleTestAll = useCallback(async () => {
    if (!apiKey.trim() || isTestingAll) return;
    setIsTestingAll(true);

    // Reset all to idle first
    const reset: Record<string, ModelTestState> = {};
    MODEL_PRESETS.forEach((p) => { reset[p.model] = { status: 'idle' }; });
    setTestStates(reset);

    // Test concurrently in batches of 4 to avoid overwhelming the network
    const BATCH = 4;
    for (let i = 0; i < MODEL_PRESETS.length; i += BATCH) {
      const batch = MODEL_PRESETS.slice(i, i + BATCH);
      // Mark batch as testing
      batch.forEach((p) => setModelState(p.model, { status: 'testing' }));
      // Run batch concurrently
      await Promise.all(batch.map(async (p) => {
        const result = await testModelConnection({
          baseUrl: p.baseUrl,
          apiKey: apiKey.trim(),
          model: p.model,
        });
        setModelState(p.model, { status: result.ok ? 'success' : 'error', result });
      }));
    }
    setIsTestingAll(false);
  }, [apiKey, isTestingAll, setModelState]);

  const handleUseModel = useCallback((preset: ModelPreset) => {
    updateModelConfig({
      ...state.modelConfig,
      baseUrl: preset.baseUrl,
      model: preset.model,
    });
  }, [state.modelConfig, updateModelConfig]);

  // Stats
  const testedCount = Object.values(testStates).filter((s) => s.status !== 'idle').length;
  const successCount = Object.values(testStates).filter((s) => s.status === 'success').length;
  const errorCount = Object.values(testStates).filter((s) => s.status === 'error').length;

  return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <View style={styles.headerLeft}>
          <IconSymbol name="antenna.radiowaves.left.and.right" size={20} color={colors.primary} />
          <Text style={[styles.title, { color: colors.foreground }]}>模型测试</Text>
        </View>
        {testedCount > 0 && (
          <View style={styles.statsRow}>
            <Text style={[styles.statText, { color: '#16A34A' }]}>{successCount}✓</Text>
            <Text style={[styles.statText, { color: colors.muted }]}> / </Text>
            <Text style={[styles.statText, { color: '#DC2626' }]}>{errorCount}✗</Text>
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* API Key input */}
        <View style={[styles.apiKeySection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.apiKeyHeader}>
            <IconSymbol name="eye" size={14} color={colors.primary} />
            <Text style={[styles.apiKeyLabel, { color: colors.foreground }]}>API Key</Text>
            <Text style={[styles.apiKeyHint, { color: colors.muted }]}>（用于测试连接，不会修改已保存的配置）</Text>
          </View>
          <View style={[styles.apiKeyInputWrap, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <TextInput
              value={apiKey}
              onChangeText={setApiKey}
              placeholder="sk-... 或留空使用已保存的 Key"
              placeholderTextColor={colors.muted}
              secureTextEntry={!showApiKey}
              autoCapitalize="none"
              autoCorrect={false}
              style={[styles.apiKeyInput, { color: colors.foreground }]}
            />
            <Pressable onPress={() => setShowApiKey((v) => !v)} style={styles.eyeBtn}>
              <IconSymbol name={showApiKey ? 'eye.slash' : 'eye'} size={16} color={colors.muted} />
            </Pressable>
          </View>
          <Text style={[styles.apiKeyNote, { color: colors.muted }]}>
            💡 留空时使用设置中已保存的 API Key。不同服务商需要对应的 Key。
          </Text>
        </View>

        {/* Test All button */}
        <Pressable
          onPress={handleTestAll}
          disabled={isTestingAll}
          style={({ pressed }) => [
            styles.testAllBtn,
            { backgroundColor: isTestingAll ? colors.muted : colors.primary },
            pressed && { opacity: 0.85 },
          ]}
        >
          {isTestingAll
            ? <ActivityIndicator size={16} color="#FFFFFF" />
            : <IconSymbol name="play.circle.fill" size={18} color="#FFFFFF" />
          }
          <Text style={styles.testAllBtnText}>
            {isTestingAll ? `测试中... (${successCount + errorCount}/${MODEL_PRESETS.length})` : `测试全部 ${MODEL_PRESETS.length} 个模型`}
          </Text>
        </Pressable>

        {/* Search + filter */}
        <View style={styles.filterRow}>
          <View style={[styles.searchWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <IconSymbol name="ellipsis" size={14} color={colors.muted} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="搜索模型名称..."
              placeholderTextColor={colors.muted}
              style={[styles.searchInput, { color: colors.foreground }]}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <IconSymbol name="xmark" size={14} color={colors.muted} />
              </Pressable>
            )}
          </View>
          <View style={styles.filterBtns}>
            {(['all', 'success', 'error'] as const).map((f) => (
              <Pressable
                key={f}
                onPress={() => setFilterStatus(f)}
                style={[
                  styles.filterBtn,
                  { borderColor: colors.border, backgroundColor: filterStatus === f ? colors.primary : colors.surface },
                ]}
              >
                <Text style={[styles.filterBtnText, { color: filterStatus === f ? '#FFFFFF' : colors.muted }]}>
                  {f === 'all' ? '全部' : f === 'success' ? `✓ ${successCount}` : `✗ ${errorCount}`}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Model list grouped by provider */}
        {filteredPresets.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="wifi.slash" size={40} color={colors.muted} />
            <Text style={[styles.emptyText, { color: colors.muted }]}>没有匹配的模型</Text>
          </View>
        ) : (
          (() => {
            // Group by provider
            const groups: Record<string, ModelPreset[]> = {};
            filteredPresets.forEach((p) => {
              const provider = getProvider(p.baseUrl);
              if (!groups[provider]) groups[provider] = [];
              groups[provider].push(p);
            });

            return Object.entries(groups).map(([provider, presets]) => (
              <View key={provider} style={styles.providerGroup}>
                <View style={styles.providerHeader}>
                  <Text style={[styles.providerName, { color: colors.muted }]}>{provider}</Text>
                  <View style={[styles.providerDivider, { backgroundColor: colors.border }]} />
                </View>
                {presets.map((preset) => (
                  <ModelCard
                    key={preset.model}
                    preset={preset}
                    testState={testStates[preset.model] ?? { status: 'idle' }}
                    apiKey={apiKey}
                    onTest={() => handleTestOne(preset)}
                    onUse={() => handleUseModel(preset)}
                    isCurrentModel={preset.model === currentModel}
                  />
                ))}
              </View>
            ));
          })()
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // API Key section
  apiKeySection: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    gap: 8,
  },
  apiKeyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  apiKeyLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  apiKeyHint: {
    fontSize: 11,
    flex: 1,
  },
  apiKeyInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  apiKeyInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'monospace',
  },
  eyeBtn: {
    padding: 4,
  },
  apiKeyNote: {
    fontSize: 11,
    lineHeight: 16,
  },

  // Test All button
  testAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 12,
  },
  testAllBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },

  // Filter row
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
  },
  filterBtns: {
    flexDirection: 'row',
    gap: 4,
  },
  filterBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  filterBtnText: {
    fontSize: 11,
    fontWeight: '500',
  },

  // Provider group
  providerGroup: {
    marginBottom: 8,
  },
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  providerName: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  providerDivider: {
    flex: 1,
    height: 1,
  },

  // Model card
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 8,
    gap: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  cardName: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  currentBadge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  currentBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  cardModel: {
    fontSize: 11,
    fontFamily: 'monospace',
  },
  errorMsg: {
    fontSize: 11,
    lineHeight: 16,
  },
  previewMsg: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Status badge
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '500',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
  },
});
