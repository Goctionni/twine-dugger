import { createStore } from 'solid-js/store';
import { createEffect } from 'solid-js';

const LOCAL_STORAGE_KEY = 'twine-dugger-settings';

export interface SettingsState {
  diffLogFontSize: number;
  diffLogSeparation: boolean;
  // Add more settings here
}

const defaultSettings: SettingsState = {
  diffLogFontSize: 14,
  diffLogSeparation: false,
};

const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
const initial = saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;

const [settings, setSettings] = createStore<SettingsState>(initial);

createEffect(() => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
});

export function createGetter<K extends keyof SettingsState>(key: K): () => () => SettingsState[K] {
  return () => () => settings[key];
}

export function createSetter<K extends keyof SettingsState>(key: K): (value: SettingsState[K]) => void {
  return (value) => setSettings(key, value);
}

export const getDiffLogFontSize = createGetter('diffLogFontSize');
export const setDiffLogFontSize = createSetter('diffLogFontSize');

export const getDiffLogSeparation = createGetter('diffLogSeparation');
export const setDiffLogSeparation = createSetter('diffLogSeparation');