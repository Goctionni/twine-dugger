import type { JSX } from '@solidjs/web';
import clsx from 'clsx';
import { Show } from 'solid-js';

import { getDefaultSetting, isSettingDefault, setSetting } from '@/devtools-panel/store/store';
import type { Settings } from '@/devtools-panel/store/store-types';
import { InfoBubble } from '@/devtools-panel/ui/display/InfoBubble';

interface Props<K extends keyof Settings> {
  label: string;
  description: string;
  /** The setting that the control changes: while it is not the default, there is a button to restore it */
  setting?: K;
  /** The default as the tooltip of that button says it. A number or true / false is written as it is */
  formatDefault?: (value: Settings[K]) => string;
  /** Under the control, for a number */
  unit?: string;
  /** A longer explanation, behind an "i" button next to the label */
  info?: { title: string; children: JSX.Element };
  /** The control is under the text, for a control that is wide */
  stacked?: boolean;
  children: JSX.Element;
}

/** A setting: what it is called and what it does, the control, and what goes with it */
export function SettingRow<K extends keyof Settings>(props: Props<K>) {
  const getDefaultText = () => {
    const value = getDefaultSetting(props.setting!);
    if (props.formatDefault) return props.formatDefault(value);
    return typeof value === 'boolean'
      ? value
        ? 'True'
        : 'False'
      : String(value as string | number);
  };

  return (
    <div
      class={clsx(
        'flex gap-5 border-b border-slate-800 py-3.5 last:border-b-0',
        props.stacked ? 'flex-col' : 'items-center',
      )}
    >
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-2">
          <span class="font-medium">{props.label}</span>
          <Show when={props.setting !== undefined && !isSettingDefault(props.setting)}>
            <button
              type="button"
              title={`Default: ${getDefaultText()}${props.unit ? ` ${props.unit}` : ''}`}
              class="inline-flex cursor-pointer items-center gap-1 rounded-full border border-sky-500/50 bg-sky-950 px-2 text-[11px] leading-4.5 text-sky-300 hover:border-sky-400 hover:bg-sky-900"
              onClick={() => setSetting(props.setting!, getDefaultSetting(props.setting!))}
            >
              <span aria-hidden="true">↺</span> Restore default
            </button>
          </Show>
          <Show when={props.info}>
            {(info) => <InfoBubble title={info().title}>{info().children}</InfoBubble>}
          </Show>
        </div>
        <p class="text-[13px] text-gray-400">{props.description}</p>
      </div>
      <div class={clsx('flex flex-col items-center gap-0.5', props.stacked && 'items-stretch')}>
        {props.children}
        <Show when={props.unit}>
          <span class="text-xs text-gray-400">{props.unit}</span>
        </Show>
      </div>
    </div>
  );
}
