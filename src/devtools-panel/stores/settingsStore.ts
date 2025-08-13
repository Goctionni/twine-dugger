import { createEffect } from 'solid-js';
import { createStore } from 'solid-js/store';

interface SettingsState {
  diffLog: {
    fontSize: number;
    pollingInterval: number;
    headingStyle: 'default' | 'distinct';
  };
}

const LS_KEY = 'twine-dugger-settings';
const storedSettings = JSON.parse(localStorage.getItem(LS_KEY) || '{}') as Partial<SettingsState>;

const [settings, setSettings] = createStore<SettingsState>({
  ...storedSettings,
  diffLog: {
    fontSize: 14,
    pollingInterval: 200,
    headingStyle: 'default',
    ...storedSettings.diffLog,
  },
});

// Auto save changes
createEffect(() => localStorage.setItem(LS_KEY, JSON.stringify(settings)));

export const getDiffLogFontSize = () => settings.diffLog.fontSize;
export const getDiffLogPollingInterval = () => settings.diffLog.pollingInterval;
export const getDiffLogHeadingStyle = () => settings.diffLog.headingStyle;

export const setDiffLogFontSize = (newSize: number) => setSettings('diffLog', 'fontSize', newSize);

export const setDiffLogPollingInterval = (newInterval: number) =>
  setSettings('diffLog', 'pollingInterval', newInterval);

export const setDiffLogHeadingStyle = (newStyle: SettingsState['diffLog']['headingStyle']) =>
  setSettings('diffLog', 'headingStyle', newStyle);
