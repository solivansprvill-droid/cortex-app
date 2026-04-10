import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, ScrollView, Pressable,
  StyleSheet, Switch, Alert, ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '@/components/screen-container';
import { useApp } from '@/lib/app-context';
import { useColors } from '@/hooks/use-colors';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ModelConfig, GatewayConfig } from '@/lib/types';
import { testTelegramBot, testHomeAssistantConnection } from '@/lib/gateway';
import { changeLanguage, getSavedLanguage, SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/lib/i18n';

// ─── Reusable field components ────────────────────────────────────────────────

function SectionHeader({ title, icon }: { title: string; icon: string }) {
  const colors = useColors();
  return (
    <View style={styles.sectionHeader}>
      <IconSymbol name={icon as any} size={16} color={colors.primary} />
      <Text style={[styles.sectionTitle, { color: colors.primary }]}>{title}</Text>
    </View>
  );
}

function FieldLabel({ label, hint }: { label: string; hint?: string }) {
  const colors = useColors();
  return (
    <View style={styles.fieldLabelRow}>
      <Text style={[styles.fieldLabel, { color: colors.foreground }]}>{label}</Text>
      {hint && <Text style={[styles.fieldHint, { color: colors.muted }]}>{hint}</Text>}
    </View>
  );
}

function TextRow({
  label, hint, value, onChangeText, placeholder, secureTextEntry, multiline, keyboardType,
}: {
  label: string; hint?: string; value: string;
  onChangeText: (v: string) => void; placeholder?: string;
  secureTextEntry?: boolean; multiline?: boolean; keyboardType?: any;
}) {
  const colors = useColors();
  const [show, setShow] = useState(!secureTextEntry);
  return (
    <View style={styles.fieldGroup}>
      <FieldLabel label={label} hint={hint} />
      <View style={[styles.inputWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          secureTextEntry={secureTextEntry && !show}
          multiline={multiline}
          keyboardType={keyboardType}
          style={[styles.textInput, { color: colors.foreground }, multiline && { minHeight: 80 }]}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {secureTextEntry && (
          <Pressable onPress={() => setShow((s) => !s)} style={styles.eyeBtn}>
            <IconSymbol name={show ? 'eye.slash' : 'eye'} size={18} color={colors.muted} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

function SliderRow({ label, value, min, max, onChangeText, unit }: {
  label: string; value: number; min: number; max: number; step: number;
  onChangeText: (v: string) => void; unit?: string;
}) {
  const colors = useColors();
  return (
    <View style={styles.fieldGroup}>
      <View style={styles.fieldLabelRow}>
        <Text style={[styles.fieldLabel, { color: colors.foreground }]}>{label}</Text>
        <Text style={[styles.fieldValue, { color: colors.primary }]}>{value}{unit}</Text>
      </View>
      <TextInput
        value={String(value)}
        onChangeText={onChangeText}
        keyboardType="numeric"
        style={[styles.textInput, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }]}
        placeholder={`${min} – ${max}`}
        placeholderTextColor={colors.muted}
      />
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const colors = useColors();
  const { t, i18n } = useTranslation();
  const { state, updateModelConfig, updateGatewayConfig } = useApp();

  const [model, setModel] = useState<ModelConfig>(state.modelConfig);
  const [gateway, setGateway] = useState<GatewayConfig>(state.gatewayConfig);
  const [tgTesting, setTgTesting] = useState(false);
  const [haTesting, setHaTesting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>('auto');

  useEffect(() => { setModel(state.modelConfig); }, [state.modelConfig]);
  useEffect(() => { setGateway(state.gatewayConfig); }, [state.gatewayConfig]);
  useEffect(() => {
    getSavedLanguage().then(setCurrentLang);
  }, []);

  const handleSave = () => {
    updateModelConfig(model);
    updateGatewayConfig(gateway);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLangChange = async (lang: SupportedLanguage) => {
    setCurrentLang(lang);
    await changeLanguage(lang);
  };

  const handleTestTelegram = async () => {
    if (!gateway.telegram.botToken) {
      Alert.alert(t('common.error'), t('settings.botToken') + ' required');
      return;
    }
    setTgTesting(true);
    const result = await testTelegramBot(gateway.telegram.botToken);
    setTgTesting(false);
    Alert.alert(result.ok ? '✅ ' + t('common.success') : '❌ ' + t('common.error'), result.message);
  };

  const handleTestHA = async () => {
    if (!gateway.homeAssistant.url || !gateway.homeAssistant.token) {
      Alert.alert(t('common.error'), t('settings.haUrl') + ' & ' + t('settings.haToken') + ' required');
      return;
    }
    setHaTesting(true);
    const result = await testHomeAssistantConnection(gateway.homeAssistant.url, gateway.homeAssistant.token);
    setHaTesting(false);
    Alert.alert(result.ok ? '✅ ' + t('common.success') : '❌ ' + t('common.error'), result.message);
  };

  return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>{t('settings.title')}</Text>
        <Pressable
          onPress={handleSave}
          style={({ pressed }) => [styles.saveBtn, { backgroundColor: saved ? colors.success : colors.primary }, pressed && { opacity: 0.8 }]}
        >
          <IconSymbol name={saved ? 'checkmark' : 'paperplane.fill'} size={16} color="#FFFFFF" />
          <Text style={styles.saveBtnText}>{saved ? t('settings.configSaved') : t('settings.saveConfig')}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Language ── */}
        <SectionHeader title={t('settings.language')} icon="globe" />
        <View style={[styles.langRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {SUPPORTED_LANGUAGES.map((lang) => (
            <Pressable
              key={lang.code}
              onPress={() => handleLangChange(lang.code)}
              style={({ pressed }) => [
                styles.langBtn,
                currentLang === lang.code && { backgroundColor: colors.primary },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text style={[
                styles.langBtnText,
                { color: currentLang === lang.code ? '#FFFFFF' : colors.foreground },
              ]}>
                {lang.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ── Model Configuration ── */}
        <SectionHeader title={t('settings.modelConfig')} icon="gearshape.fill" />

        <TextRow
          label={t('settings.baseUrl')}
          hint={t('settings.baseUrlHint')}
          value={model.baseUrl}
          onChangeText={(v) => setModel((m) => ({ ...m, baseUrl: v }))}
          placeholder="https://openrouter.ai/api/v1"
          keyboardType="url"
        />
        <TextRow
          label={t('settings.apiKey')}
          hint={t('settings.apiKeyHint')}
          value={model.apiKey}
          onChangeText={(v) => setModel((m) => ({ ...m, apiKey: v }))}
          placeholder={t('settings.apiKeyPlaceholder')}
          secureTextEntry
        />
        <TextRow
          label={t('settings.model')}
          hint={t('settings.modelHint')}
          value={model.model}
          onChangeText={(v) => setModel((m) => ({ ...m, model: v }))}
          placeholder={t('settings.modelPlaceholder')}
        />

        <SliderRow
          label={t('settings.temperature')}
          value={model.temperature}
          min={0} max={2} step={0.1}
          onChangeText={(v) => {
            const n = parseFloat(v);
            if (!isNaN(n) && n >= 0 && n <= 2) setModel((m) => ({ ...m, temperature: n }));
          }}
        />
        <SliderRow
          label={t('settings.maxTokens')}
          value={model.maxTokens}
          min={100} max={1000000} step={128}
          onChangeText={(v) => {
            const n = parseInt(v, 10);
            if (!isNaN(n) && n >= 100) setModel((m) => ({ ...m, maxTokens: n }));
          }}
          unit=" tokens"
        />

        <TextRow
          label={t('settings.systemPrompt')}
          hint={t('settings.systemPromptHint')}
          value={model.systemPrompt}
          onChangeText={(v) => setModel((m) => ({ ...m, systemPrompt: v }))}
          placeholder={t('settings.systemPromptPlaceholder')}
          multiline
        />

        {/* ── Telegram Gateway ── */}
        <View style={styles.divider} />
        <SectionHeader title={t('settings.telegram')} icon="paperplane.fill" />

        <View style={[styles.toggleRow, { borderColor: colors.border }]}>
          <View>
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>{t('settings.telegram')}</Text>
            <Text style={[styles.fieldHint, { color: colors.muted }]}>{t('settings.telegramDesc')}</Text>
          </View>
          <Switch
            value={gateway.telegram.enabled}
            onValueChange={(v) => setGateway((g) => ({ ...g, telegram: { ...g.telegram, enabled: v } }))}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        {gateway.telegram.enabled && (
          <>
            <TextRow
              label={t('settings.botToken')}
              hint={t('settings.botTokenHint')}
              value={gateway.telegram.botToken}
              onChangeText={(v) => setGateway((g) => ({ ...g, telegram: { ...g.telegram, botToken: v } }))}
              placeholder={t('settings.botTokenPlaceholder')}
              secureTextEntry
            />
            <TextRow
              label={t('settings.chatId')}
              hint={t('settings.chatIdHint')}
              value={gateway.telegram.chatId}
              onChangeText={(v) => setGateway((g) => ({ ...g, telegram: { ...g.telegram, chatId: v } }))}
              placeholder={t('settings.chatIdPlaceholder')}
              keyboardType="numbers-and-punctuation"
            />
            <Pressable
              onPress={handleTestTelegram}
              style={({ pressed }) => [styles.testBtn, { borderColor: colors.primary }, pressed && { opacity: 0.7 }]}
            >
              {tgTesting ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <IconSymbol name="checkmark" size={14} color={colors.primary} />
                  <Text style={[styles.testBtnText, { color: colors.primary }]}>{t('settings.testConnection')}</Text>
                </>
              )}
            </Pressable>
          </>
        )}

        {/* ── Home Assistant Gateway ── */}
        <View style={styles.divider} />
        <SectionHeader title={t('settings.homeAssistant')} icon="house.fill" />

        <View style={[styles.toggleRow, { borderColor: colors.border }]}>
          <View>
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>{t('settings.homeAssistant')}</Text>
            <Text style={[styles.fieldHint, { color: colors.muted }]}>{t('settings.homeAssistantDesc')}</Text>
          </View>
          <Switch
            value={gateway.homeAssistant.enabled}
            onValueChange={(v) => setGateway((g) => ({ ...g, homeAssistant: { ...g.homeAssistant, enabled: v } }))}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        {gateway.homeAssistant.enabled && (
          <>
            <TextRow
              label={t('settings.haUrl')}
              hint={t('settings.haUrlHint')}
              value={gateway.homeAssistant.url}
              onChangeText={(v) => setGateway((g) => ({ ...g, homeAssistant: { ...g.homeAssistant, url: v } }))}
              placeholder={t('settings.haUrlHint')}
              keyboardType="url"
            />
            <TextRow
              label={t('settings.haToken')}
              hint={t('settings.haTokenHint')}
              value={gateway.homeAssistant.token}
              onChangeText={(v) => setGateway((g) => ({ ...g, homeAssistant: { ...g.homeAssistant, token: v } }))}
              placeholder={t('settings.haTokenPlaceholder')}
              secureTextEntry
            />
            <TextRow
              label={t('settings.notifyService')}
              hint={t('settings.notifyServiceHint')}
              value={gateway.homeAssistant.notifyService}
              onChangeText={(v) => setGateway((g) => ({ ...g, homeAssistant: { ...g.homeAssistant, notifyService: v } }))}
              placeholder="notify.notify"
            />
            <Pressable
              onPress={handleTestHA}
              style={({ pressed }) => [styles.testBtn, { borderColor: colors.primary }, pressed && { opacity: 0.7 }]}
            >
              {haTesting ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <IconSymbol name="checkmark" size={14} color={colors.primary} />
                  <Text style={[styles.testBtnText, { color: colors.primary }]}>{t('settings.testConnection')}</Text>
                </>
              )}
            </Pressable>
          </>
        )}

        {/* About */}
        <View style={styles.divider} />
        <View style={styles.about}>
          <Text style={[styles.aboutText, { color: colors.muted }]}>Cortex v1.0.0</Text>
          <Text style={[styles.aboutText, { color: colors.muted }]}>{t('settings.poweredBy')}</Text>
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>
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
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  scroll: { paddingHorizontal: 16, paddingTop: 8 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  fieldGroup: { marginBottom: 14 },
  fieldLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  fieldLabel: { fontSize: 14, fontWeight: '500' },
  fieldHint: { fontSize: 12 },
  fieldValue: { fontSize: 14, fontWeight: '600' },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  textInput: { flex: 1, fontSize: 14, paddingVertical: 10 },
  eyeBtn: { padding: 6 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    marginBottom: 14,
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 4,
    marginBottom: 8,
  },
  testBtnText: { fontSize: 14, fontWeight: '500' },
  divider: { height: 1, backgroundColor: 'transparent', marginTop: 8 },
  langRow: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 8,
  },
  langBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langBtnText: { fontSize: 13, fontWeight: '500' },
  about: { alignItems: 'center', gap: 4, marginTop: 16 },
  aboutText: { fontSize: 12 },
  bottomPad: { height: 40 },
});
