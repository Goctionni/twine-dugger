import { createMemo } from 'solid-js';
import { getSetting, setSetting } from './PersistSettings';
import { MagnifyingGlassMinusIcon } from '../../Layout/MagnifyingGlassMinusIcon';
import { MagnifyingGlassPlusIcon } from '../../Layout/MagnifyingGlassPlusIcon';
import type { SettingsData } from './PersistSettings';

type NumericSettingKey = {
  [K in keyof SettingsData]: SettingsData[K] extends number ? K : never;
}[keyof SettingsData];

interface FontSizeControlsProps<K extends NumericSettingKey> {
  settingKey: K;
  min?: number;
  max?: number;
}

export function FontSizeControls<K extends NumericSettingKey>(props: FontSizeControlsProps<K>) {
  const { settingKey, min = -Infinity, max = Infinity } = props;

  const fontSize = createMemo(() => getSetting(settingKey));

  const increase = () => {
    const newSize = Math.min(fontSize() + 1, max);
    setSetting(settingKey, newSize);
  };

  const decrease = () => {
    const newSize = Math.max(fontSize() - 1, min);
    setSetting(settingKey, newSize);
  };

  return (
    <div class="flex items-center gap-2 ml-2">
      <button onClick={decrease} class="text-gray-400 hover:text-white" title="Zoom Out">
        <MagnifyingGlassMinusIcon class="w-4 h-4" />
      </button>
      <button onClick={increase} class="text-gray-400 hover:text-white" title="Zoom In">
        <MagnifyingGlassPlusIcon class="w-4 h-4" />
      </button>
    </div>
  );
}