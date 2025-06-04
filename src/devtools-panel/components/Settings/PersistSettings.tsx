import { createSignal } from 'solid-js';

const LOCAL_STORAGE_KEY = 'twine-dugger-settings';

export interface SettingsData {
  fontSize: number;
  diffLogSeparation: boolean;
  // Add other settings here
}

const defaultSettings: SettingsData = {
  fontSize: 14,
  diffLogSeparation: false,
};

function loadSettings(): SettingsData {
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return defaultSettings;
    }
  }
  return defaultSettings;
}

function saveSettings(settings: SettingsData) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
}

const [settings, setSettings] = createSignal<SettingsData>(loadSettings());

function updateSetting<K extends keyof SettingsData>(key: K, value: SettingsData[K]) {
  const current = settings();
  const updated = { ...current, [key]: value };
  setSettings(updated);
  saveSettings(updated);
}

export function getSettings() {
  return settings();
}

export function getSetting<K extends keyof SettingsData>(key: K): SettingsData[K] {
  return settings()[key];
}

export function setSetting<K extends keyof SettingsData>(key: K, value: SettingsData[K]) {
  updateSetting(key, value);
}
