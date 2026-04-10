import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  ActivityIndicator, TextInput, Alert, Modal,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';
import { useApp } from '@/lib/app-context';
import { testModelConnection, ModelTestResult } from '@/lib/ai';
import { MODEL_PRESETS, ModelPreset } from '@/lib/model-presets';

// ─── Types ────────────────────────────────────────────────────────────────────

type TestStatus = 'idle' | 'testing' | 'success' | 'error';
type ApiType = 'openai' | 'anthropic' | 'google';

interface ModelTestState {
  status: TestStatus;
  result?: ModelTestResult;
}

interface CustomModel {
  name: string;
  baseUrl: string;
  model: string;
  apiType: ApiType;
}

const API_TYPES: { value: ApiType; label: string }[] = [
  { value: 'openai', label: 'OpenAI Compatible' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'google', label: 'Google (Gemini)' },
];

// ─── Provider grouping ────────────────────────────────────────────────────────

function getProvider(baseUrl: string): string {
  if (baseUrl.includes('openai.com')) return 'OpenAI';
  if (baseUrl.includes('anthropic.com')) return 'Anthropic';
  if (baseUrl.includes('googleapis.com') || baseUrl.includes('generativelanguage')) return 'Google';
  if (baseUrl.includes('mistral.ai')) return 'Mistral';
  if (baseUrl.includes('openrouter.ai')) return 'OpenRouter';
  if (baseUrl.includes('groq.com')) return 'Groq';
  if (baseUrl.includes('together.xyz')) return 'Together AI';
  if (baseUrl.includes('replicate.com')) return 'Replicate';
  if (baseUrl.includes('edgefn.net')) return 'EdgeFn';
  if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) return 'Local';
  return 'Custom';
}

// ─── Fetch available models from /models endpoint ────────────────────────────

async function fetchAvailableModels(baseUrl: string, apiKey: string): Promise<string[]> {
  try {
    const url = baseUrl.replace(/\/$/, '') + '/models';
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    // OpenAI-compatible format: { data: [{ id: '...' }] }
    if (Array.isArray(data.data)) {
      return data.data.map((m: any) => m.id || m.name).filter(Boolean);
    }
    // Some APIs return { models: [...] }
    if (Array.isArray(data.models)) {
      return data.models.map((m: any) => (typeof m === 'string' ? m : m.id || m.name)).filter(Boolean);
    }
    return [];
  } catch (e: any) {
    throw new Error(e.message || '获取失败');
  }
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
  preset, testState, apiKey, onTest, onUse, isCurrentModel,
}: {
  preset: ModelPreset; testState: ModelTestState; apiKey: string;
  onTest: () => void; onUse: () => void; isCurrentModel: boolean;
}) {
  const colors = useColors();
  const { status, result } = testState;
  return (
    <View style={[
      styles.card,
      { backgroundColor: colors.surface, borderColor: isCurrentModel ? colors.primary : colors.border },
      isCurrentModel && { borderWidth: 1.5 },
    ]}>
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
      <Text style={[styles.cardModel, { color: colors.muted }]} numberOfLines={1}>
        {preset.model}
      </Text>
      {status === 'error' && result?.message && (
        <Text style={[styles.errorMsg, { color: '#DC2626' }]} numberOfLines={2}>{result.message}</Text>
      )}
      {status === 'success' && result?.preview && (
        <Text style={[styles.previewMsg, { color: colors.muted }]} numberOfLines={1}>
          回复预览: "{result.preview}"
        </Text>
      )}
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

// ─── Add Model Modal ──────────────────────────────────────────────────────────

function AddModelModal({
  visible, onClose, onAdd,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (m: CustomModel) => void;
}) {
  const colors = useColors();
  const [name, setName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [modelId, setModelId] = useState('');
  const [apiType, setApiType] = useState<ApiType>('openai');

  const handleAdd = () => {
    if (!baseUrl.trim() || !modelId.trim()) {
      Alert.alert('提示', '请填写 Base URL 和模型 ID');
      return;
    }
    onAdd({
      name: name.trim() || modelId.trim(),
      baseUrl: baseUrl.trim(),
      model: modelId.trim(),
      apiType,
    });
    setName(''); setBaseUrl(''); setModelId(''); setApiType('openai');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>手动添加模型</Text>
          <Pressable onPress={onClose} style={({ pressed }) => [styles.modalClose, pressed && { opacity: 0.6 }]}>
            <IconSymbol name="xmark.circle.fill" size={24} color={colors.muted} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
          {/* Name */}
          <Text style={[styles.inputLabel, { color: colors.foreground }]}>名称（可选）</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="自定义名称"
            placeholderTextColor={colors.muted}
            style={[styles.modalInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
            autoCapitalize="none"
          />
          {/* Base URL */}
          <Text style={[styles.inputLabel, { color: colors.foreground }]}>Base URL</Text>
          <TextInput
            value={baseUrl}
            onChangeText={setBaseUrl}
            placeholder="https://api.example.com/v1"
            placeholderTextColor={colors.muted}
            style={[styles.modalInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
            autoCapitalize="none"
            keyboardType="url"
          />
          {/* API Type */}
          <Text style={[styles.inputLabel, { color: colors.foreground }]}>API 类型</Text>
          <View style={[styles.apiTypeRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {API_TYPES.map((t) => (
              <Pressable
                key={t.value}
                onPress={() => setApiType(t.value)}
                style={[
                  styles.apiTypeBtn,
                  apiType === t.value && { backgroundColor: colors.primary },
                ]}
              >
                <Text style={[
                  styles.apiTypeBtnText,
                  { color: apiType === t.value ? '#FFFFFF' : colors.foreground },
                ]}>
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>
          {/* Model ID */}
          <Text style={[styles.inputLabel, { color: colors.foreground }]}>模型 ID</Text>
          <TextInput
            value={modelId}
            onChangeText={setModelId}
            placeholder="gpt-4o / claude-3-5-sonnet-20241022"
            placeholderTextColor={colors.muted}
            style={[styles.modalInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
            autoCapitalize="none"
          />
          {/* Add button */}
          <Pressable
            onPress={handleAdd}
            style={({ pressed }) => [styles.modalAddBtn, { backgroundColor: colors.primary }, pressed && { opacity: 0.8 }]}
          >
            <IconSymbol name="plus.circle.fill" size={18} color="#FFFFFF" />
            <Text style={styles.modalAddBtnText}>添加模型</Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ModelsScreen() {
  const colors = useColors();
  const { state, updateModelConfig } = useApp();

  // ── Connection test config ──
  const [testApiKey, setTestApiKey] = useState(state.modelConfig.apiKey);
  const [testBaseUrl, setTestBaseUrl] = useState(state.modelConfig.baseUrl);
  const [testModelId, setTestModelId] = useState(state.modelConfig.model);
  const [testApiType, setTestApiType] = useState<ApiType>('openai');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Sync from context once loaded (SecureStore apiKey is async)
  useEffect(() => {
    if (state.isLoaded && !hasInitialized) {
      setTestApiKey(state.modelConfig.apiKey);
      setTestBaseUrl(state.modelConfig.baseUrl);
      setTestModelId(state.modelConfig.model);
      setHasInitialized(true);
    }
  }, [state.isLoaded, state.modelConfig, hasInitialized]);

  // ── Model list ──
  const [customModels, setCustomModels] = useState<ModelPreset[]>([]);
  const [testStates, setTestStates] = useState<Record<string, ModelTestState>>({});
  const [isTestingAll, setIsTestingAll] = useState(false);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'error'>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  const currentModel = state.modelConfig.model;
  const allPresets: ModelPreset[] = useMemo(() => [...MODEL_PRESETS, ...customModels], [customModels]);

  const filteredPresets = useMemo(() => {
    let list = allPresets;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.model.toLowerCase().includes(q));
    }
    if (filterStatus === 'success') list = list.filter((p) => testStates[p.model]?.status === 'success');
    else if (filterStatus === 'error') list = list.filter((p) => testStates[p.model]?.status === 'error');
    return list;
  }, [searchQuery, filterStatus, testStates, allPresets]);

  // Group by provider
  const groupedPresets = useMemo(() => {
    const groups: Record<string, ModelPreset[]> = {};
    filteredPresets.forEach((p) => {
      const provider = getProvider(p.baseUrl);
      if (!groups[provider]) groups[provider] = [];
      groups[provider].push(p);
    });
    return groups;
  }, [filteredPresets]);

  const setModelState = useCallback((model: string, s: ModelTestState) => {
    setTestStates((prev) => ({ ...prev, [model]: s }));
  }, []);

  // ── Fetch available models from /models endpoint ──
  const handleFetchModels = useCallback(async () => {
    const url = testBaseUrl.trim() || state.modelConfig.baseUrl;
    const key = testApiKey.trim() || state.modelConfig.apiKey;
    if (!url || !key) {
      Alert.alert('提示', '请先填写 Base URL 和 API Key');
      return;
    }
    setIsFetchingModels(true);
    try {
      const models = await fetchAvailableModels(url, key);
      if (models.length === 0) {
        Alert.alert('提示', '未获取到可用模型，请检查 Base URL 和 API Key');
      } else {
        // Add fetched models as custom entries (skip duplicates)
        const existingIds = new Set(allPresets.map((p) => p.model));
        const newModels: ModelPreset[] = models
          .filter((id) => !existingIds.has(id))
          .map((id) => ({
            name: id,
            baseUrl: url,
            model: id,
            description: `从 ${getProvider(url)} 获取`,
          }));
        if (newModels.length > 0) {
          setCustomModels((prev) => [...prev, ...newModels]);
          Alert.alert('成功', `获取到 ${models.length} 个模型，新增 ${newModels.length} 个`);
        } else {
          Alert.alert('提示', `获取到 ${models.length} 个模型，均已在列表中`);
        }
      }
    } catch (e: any) {
      Alert.alert('获取失败', e.message || '请检查 Base URL 和 API Key');
    } finally {
      setIsFetchingModels(false);
    }
  }, [testBaseUrl, testApiKey, state.modelConfig, allPresets]);

  // ── Test single preset model ──
  const handleTestOne = useCallback(async (preset: ModelPreset) => {
    const key = testApiKey.trim() || state.modelConfig.apiKey;
    if (!key) {
      Alert.alert('提示', '请先填写 API Key');
      return;
    }
    // Auto-detect API type from baseUrl
    let apiType: 'openai' | 'anthropic' | 'google' = 'openai';
    if (preset.baseUrl.includes('anthropic.com')) apiType = 'anthropic';
    else if (preset.baseUrl.includes('googleapis.com') || preset.baseUrl.includes('generativelanguage')) apiType = 'google';
    setModelState(preset.model, { status: 'testing' });
    const result = await testModelConnection({ baseUrl: preset.baseUrl, apiKey: key, model: preset.model, apiType });
    setModelState(preset.model, { status: result.ok ? 'success' : 'error', result });
  }, [testApiKey, state.modelConfig.apiKey, setModelState]);

  // ── Test custom connection (from top form) ──
  const handleTestCustom = useCallback(async () => {
    const url = testBaseUrl.trim() || state.modelConfig.baseUrl;
    const key = testApiKey.trim() || state.modelConfig.apiKey;
    const model = testModelId.trim() || state.modelConfig.model;
    if (!url || !key || !model) {
      Alert.alert('提示', '请填写 Base URL、API Key 和模型 ID');
      return;
    }
    const tempKey = `__custom__${model}`;
    setModelState(tempKey, { status: 'testing' });
    const result = await testModelConnection({ baseUrl: url, apiKey: key, model, apiType: testApiType });
    setModelState(tempKey, { status: result.ok ? 'success' : 'error', result });
    Alert.alert(
      result.ok ? '✅ 连接成功' : '❌ 连接失败',
      result.ok
        ? `延迟: ${result.latencyMs}ms\n回复预览: "${result.preview}"`
        : result.message || '未知错误'
    );
  }, [testBaseUrl, testApiKey, testModelId, state.modelConfig, setModelState]);

  // ── Save and use (from top form) ──
  const handleSaveAndUse = useCallback(() => {
    const url = testBaseUrl.trim() || state.modelConfig.baseUrl;
    const key = testApiKey.trim() || state.modelConfig.apiKey;
    const model = testModelId.trim() || state.modelConfig.model;
    if (!url || !model) {
      Alert.alert('提示', '请填写 Base URL 和模型 ID');
      return;
    }
    updateModelConfig({
      ...state.modelConfig,
      baseUrl: url,
      apiKey: key || state.modelConfig.apiKey,
      model,
    });
    Alert.alert('✅ 已保存', `模型已切换为:\n${model}`);
  }, [testBaseUrl, testApiKey, testModelId, state.modelConfig, updateModelConfig]);

  // ── Test all presets ──
  const handleTestAll = useCallback(async () => {
    const key = testApiKey.trim() || state.modelConfig.apiKey;
    if (!key || isTestingAll) {
      if (!key) Alert.alert('提示', '请先填写 API Key');
      return;
    }
    setIsTestingAll(true);
    const reset: Record<string, ModelTestState> = {};
    allPresets.forEach((p) => { reset[p.model] = { status: 'idle' }; });
    setTestStates(reset);
    const BATCH = 4;
    for (let i = 0; i < allPresets.length; i += BATCH) {
      const batch = allPresets.slice(i, i + BATCH);
      batch.forEach((p) => setModelState(p.model, { status: 'testing' }));
      await Promise.all(batch.map(async (p) => {
        let apiType: 'openai' | 'anthropic' | 'google' = 'openai';
        if (p.baseUrl.includes('anthropic.com')) apiType = 'anthropic';
        else if (p.baseUrl.includes('googleapis.com') || p.baseUrl.includes('generativelanguage')) apiType = 'google';
        const result = await testModelConnection({ baseUrl: p.baseUrl, apiKey: key, model: p.model, apiType });
        setModelState(p.model, { status: result.ok ? 'success' : 'error', result });
      }));
    }
    setIsTestingAll(false);
  }, [testApiKey, state.modelConfig.apiKey, isTestingAll, allPresets, setModelState]);

  const handleUseModel = useCallback((preset: ModelPreset) => {
    updateModelConfig({ ...state.modelConfig, baseUrl: preset.baseUrl, model: preset.model });
    Alert.alert('✅ 已切换', `当前模型: ${preset.name}`);
  }, [state.modelConfig, updateModelConfig]);

  const handleAddCustom = useCallback((m: CustomModel) => {
    setCustomModels((prev) => [...prev, {
      name: m.name,
      baseUrl: m.baseUrl,
      model: m.model,
      description: `${m.apiType} · 手动添加`,
    }]);
  }, []);

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
          <Text style={[styles.title, { color: colors.foreground }]}>选择模型</Text>
        </View>
        {testedCount > 0 && (
          <View style={styles.statsRow}>
            <Text style={[styles.statText, { color: '#16A34A' }]}>{successCount}✓</Text>
            <Text style={[styles.statText, { color: colors.muted }]}> / </Text>
            <Text style={[styles.statText, { color: '#DC2626' }]}>{errorCount}✗</Text>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* ── Search ── */}
        <View style={[styles.searchWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <IconSymbol name="magnifyingglass" size={16} color={colors.muted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="搜索模型..."
            placeholderTextColor={colors.muted}
            style={[styles.searchInput, { color: colors.foreground }]}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <IconSymbol name="xmark.circle.fill" size={16} color={colors.muted} />
            </Pressable>
          )}
        </View>

        {/* ── Action buttons row ── */}
        <View style={styles.actionRow}>
          <Pressable
            onPress={handleFetchModels}
            disabled={isFetchingModels}
            style={({ pressed }) => [
              styles.halfBtn,
              { backgroundColor: colors.surface, borderColor: colors.border },
              pressed && { opacity: 0.7 },
            ]}
          >
            {isFetchingModels
              ? <ActivityIndicator size={15} color={colors.primary} />
              : <Text style={styles.halfBtnEmoji}>🔍</Text>
            }
            <Text style={[styles.halfBtnText, { color: colors.foreground }]}>
              {isFetchingModels ? '获取中...' : '获取可用模型'}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setShowAddModal(true)}
            style={({ pressed }) => [
              styles.halfBtn,
              { backgroundColor: colors.surface, borderColor: colors.border },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={styles.halfBtnEmoji}>✏️</Text>
            <Text style={[styles.halfBtnText, { color: colors.foreground }]}>手动添加</Text>
          </Pressable>
        </View>

        {/* ── Advanced options (collapsible) ── */}
        <Pressable
          onPress={() => setShowAdvanced((v) => !v)}
          style={({ pressed }) => [
            styles.advancedToggle,
            { backgroundColor: colors.surface, borderColor: colors.border },
            pressed && { opacity: 0.8 },
          ]}
        >
          <Text style={[styles.advancedToggleText, { color: colors.foreground }]}>高级选项</Text>
          <IconSymbol name={showAdvanced ? 'chevron.up' : 'chevron.down'} size={16} color={colors.muted} />
        </Pressable>

        {showAdvanced && (
          <View style={[styles.advancedPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {/* Base URL */}
            <Text style={[styles.inputLabel, { color: colors.muted }]}>Base URL</Text>
            <TextInput
              value={testBaseUrl}
              onChangeText={setTestBaseUrl}
              placeholder="https://api.openai.com/v1"
              placeholderTextColor={colors.muted}
              style={[styles.advInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
              autoCapitalize="none"
              keyboardType="url"
            />

            {/* API Key */}
            <Text style={[styles.inputLabel, { color: colors.muted }]}>API Key</Text>
            <View style={[styles.advInputWrap, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <TextInput
                value={testApiKey}
                onChangeText={setTestApiKey}
                placeholder="留空则使用设置中已保存的 Key"
                placeholderTextColor={colors.muted}
                secureTextEntry={!showApiKey}
                style={[styles.advInputInner, { color: colors.foreground }]}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Pressable onPress={() => setShowApiKey((v) => !v)} style={styles.eyeBtn}>
                <IconSymbol name={showApiKey ? 'eye.slash' : 'eye'} size={16} color={colors.muted} />
              </Pressable>
            </View>

            {/* API Type */}
            <Text style={[styles.inputLabel, { color: colors.muted }]}>API 类型</Text>
            <View style={[styles.apiTypeRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
              {API_TYPES.map((t) => (
                <Pressable
                  key={t.value}
                  onPress={() => setTestApiType(t.value)}
                  style={[
                    styles.apiTypeBtn,
                    testApiType === t.value && { backgroundColor: colors.primary },
                  ]}
                >
                  <Text style={[
                    styles.apiTypeBtnText,
                    { color: testApiType === t.value ? '#FFFFFF' : colors.foreground },
                  ]}>
                    {t.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Model ID */}
            <Text style={[styles.inputLabel, { color: colors.muted }]}>模型 ID</Text>
            <TextInput
              value={testModelId}
              onChangeText={setTestModelId}
              placeholder="gpt-4o / claude-3-5-sonnet-20241022"
              placeholderTextColor={colors.muted}
              style={[styles.advInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
              autoCapitalize="none"
            />

            {/* Test + Save buttons */}
            <Pressable
              onPress={handleTestCustom}
              style={({ pressed }) => [
                styles.testConnBtn,
                { backgroundColor: colors.surface, borderColor: colors.border },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={styles.testConnBtnEmoji}>🔗</Text>
              <Text style={[styles.testConnBtnText, { color: colors.foreground }]}>测试连接</Text>
            </Pressable>

            <Pressable
              onPress={handleSaveAndUse}
              style={({ pressed }) => [
                styles.saveUseBtn,
                { backgroundColor: colors.primary },
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={styles.saveUseBtnText}>保存并使用</Text>
            </Pressable>
          </View>
        )}

        {/* ── Test All button ── */}
        <Pressable
          onPress={handleTestAll}
          disabled={isTestingAll}
          style={({ pressed }) => [
            styles.testAllBtn,
            { backgroundColor: isTestingAll ? colors.surface : colors.primary },
            pressed && { opacity: 0.85 },
          ]}
        >
          {isTestingAll
            ? <ActivityIndicator size={15} color={colors.primary} />
            : <IconSymbol name="wifi" size={15} color="#FFFFFF" />
          }
          <Text style={[styles.testAllBtnText, { color: isTestingAll ? colors.muted : '#FFFFFF' }]}>
            {isTestingAll ? '测试中...' : `测试全部 ${allPresets.length} 个模型`}
          </Text>
        </Pressable>

        {/* ── Filter row ── */}
        <View style={styles.filterRow}>
          {(['all', 'success', 'error'] as const).map((f) => (
            <Pressable
              key={f}
              onPress={() => setFilterStatus(f)}
              style={[
                styles.filterBtn,
                {
                  backgroundColor: filterStatus === f ? colors.primary : colors.surface,
                  borderColor: filterStatus === f ? colors.primary : colors.border,
                },
              ]}
            >
              <Text style={[styles.filterBtnText, { color: filterStatus === f ? '#FFFFFF' : colors.muted }]}>
                {f === 'all' ? '全部' : f === 'success' ? '✓ 成功' : '✗ 失败'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ── Model list grouped by provider ── */}
        {Object.keys(groupedPresets).length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="magnifyingglass" size={32} color={colors.muted} />
            <Text style={[styles.emptyText, { color: colors.muted }]}>没有匹配的模型</Text>
          </View>
        ) : (
          Object.entries(groupedPresets).map(([provider, presets]) => (
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
                  apiKey={testApiKey}
                  onTest={() => handleTestOne(preset)}
                  onUse={() => handleUseModel(preset)}
                  isCurrentModel={preset.model === currentModel}
                />
              ))}
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Model Modal */}
      <AddModelModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddCustom}
      />
    </ScreenContainer>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 18, fontWeight: '700' },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statText: { fontSize: 13, fontWeight: '600' },

  scroll: { padding: 16, paddingBottom: 40 },

  // Search
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 12,
    borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, gap: 8, marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 15 },

  // Action row
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  halfBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1,
  },
  halfBtnEmoji: { fontSize: 15 },
  halfBtnText: { fontSize: 13, fontWeight: '500' },

  // Advanced toggle
  advancedToggle: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, borderWidth: 1, marginBottom: 2,
  },
  advancedToggleText: { fontSize: 15, fontWeight: '500' },

  // Advanced panel
  advancedPanel: {
    borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 12, gap: 4,
  },
  inputLabel: { fontSize: 12, fontWeight: '500', marginBottom: 4, marginTop: 8 },
  advInput: {
    borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, marginBottom: 2,
  },
  advInputWrap: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 10, borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 2,
  },
  advInputInner: { flex: 1, fontSize: 14 },
  eyeBtn: { padding: 4 },

  // API type selector
  apiTypeRow: {
    flexDirection: 'row', borderRadius: 10, borderWidth: 1, overflow: 'hidden', marginBottom: 2,
  },
  apiTypeBtn: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  apiTypeBtnText: { fontSize: 12, fontWeight: '500' },

  // Test connection button
  testConnBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 13, borderRadius: 12, borderWidth: 1, marginTop: 12,
  },
  testConnBtnEmoji: { fontSize: 16 },
  testConnBtnText: { fontSize: 15, fontWeight: '500' },

  // Save and use button
  saveUseBtn: {
    paddingVertical: 15, borderRadius: 14, alignItems: 'center', marginTop: 8,
  },
  saveUseBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },

  // Test all button
  testAllBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 13, borderRadius: 12, marginBottom: 12, marginTop: 8,
  },
  testAllBtnText: { fontSize: 14, fontWeight: '600' },

  // Filter row
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1 },
  filterBtnText: { fontSize: 12, fontWeight: '500' },

  // Provider group
  providerGroup: { marginBottom: 8 },
  providerHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  providerName: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  providerDivider: { flex: 1, height: 1 },

  // Model card
  card: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 8, gap: 6 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  cardName: { fontSize: 14, fontWeight: '600', flex: 1 },
  currentBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  currentBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '600' },
  cardModel: { fontSize: 11, fontFamily: 'monospace' },
  errorMsg: { fontSize: 11, lineHeight: 16 },
  previewMsg: { fontSize: 11, fontStyle: 'italic' },
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1,
  },
  actionBtnText: { fontSize: 12, fontWeight: '500' },

  // Status badge
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1,
  },
  badgeText: { fontSize: 11, fontWeight: '500' },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyText: { fontSize: 14 },

  // Modal
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 0.5,
  },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalClose: { padding: 4 },
  modalScroll: { padding: 20, paddingBottom: 60 },
  modalInput: {
    borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, marginBottom: 4,
  },
  modalAddBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 15, borderRadius: 14, marginTop: 20,
  },
  modalAddBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
