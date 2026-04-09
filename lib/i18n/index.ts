import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './en.json';
import zh from './zh.json';

const LANGUAGE_KEY = 'cortex_language';

export type SupportedLanguage = 'auto' | 'en' | 'zh';

export const SUPPORTED_LANGUAGES: { code: SupportedLanguage; label: string }[] = [
  { code: 'auto', label: 'Follow System / 跟随系统' },
  { code: 'en', label: 'English' },
  { code: 'zh', label: '中文简体' },
];

function getSystemLanguage(): string {
  const locale = Localization.getLocales()[0]?.languageCode ?? 'en';
  if (locale.startsWith('zh')) return 'zh';
  return 'en';
}

export async function getSavedLanguage(): Promise<SupportedLanguage> {
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (saved === 'en' || saved === 'zh' || saved === 'auto') return saved;
  } catch {}
  return 'auto';
}

export async function saveLanguage(lang: SupportedLanguage): Promise<void> {
  await AsyncStorage.setItem(LANGUAGE_KEY, lang);
}

export async function changeLanguage(lang: SupportedLanguage): Promise<void> {
  await saveLanguage(lang);
  const resolved = lang === 'auto' ? getSystemLanguage() : lang;
  await i18n.changeLanguage(resolved);
}

export async function initI18n(): Promise<void> {
  const saved = await getSavedLanguage();
  const resolved = saved === 'auto' ? getSystemLanguage() : saved;

  await i18n
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
        zh: { translation: zh },
      },
      lng: resolved,
      fallbackLng: 'en',
      interpolation: { escapeValue: false },
      compatibilityJSON: 'v4',
    });
}

export default i18n;
