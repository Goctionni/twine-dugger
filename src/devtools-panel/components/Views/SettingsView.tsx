import { JSX, Match, Switch } from 'solid-js';

import { createGetSetting, setSetting } from '../../store/store';
import { BooleanInput } from '../Common/Inputs/BooleanInput';
import { NumberInput } from '../Common/Inputs/NumberInput';

function setterWithValidation<T>(setter: (v: T) => void, validator: (v: T) => boolean) {
  return (value: T) => (validator(value) ? setter(value) : undefined);
}

export function SettingsView() {
  const getDiffLogFontSize = createGetSetting('diffLog.fontSize');
  const getDiffLogPollingInterval = createGetSetting('diffLog.pollingInterval');
  const getDiffLogHeadingStyle = createGetSetting('diffLog.headingStyle');

  return (
    <div class="bg-gray-700 flex-1 flex">
      <div class="mx-auto max-w-6xl w-full bg-slate-900 flex-1 py-3 px-6">
        <h2 class="text-2xl font-bold pb-4">Settings</h2>
        <fieldset class="text-base">
          <legend class="text-lg font-bold">Diff Log</legend>
          <div class="grid grid-cols-[auto_1fr] gap-4">
            <SettingControl label="Font size">
              {(id) => (
                <NumberInput
                  value={getDiffLogFontSize()}
                  onChange={setterWithValidation(
                    (size) => setSetting('diffLog.fontSize', size),
                    (size) => size > 10 && size < 40,
                  )}
                />
              )}
            </SettingControl>
            <SettingControl label="Polling interval">
              {(id) => (
                <NumberInput
                  value={getDiffLogPollingInterval()}
                  onChange={setterWithValidation(
                    (interval) => setSetting('diffLog.pollingInterval', interval),
                    (interval) => interval > 100 && interval < 5000,
                  )}
                />
              )}
            </SettingControl>
            <SettingControl label="Heading Emphasis" noLabel>
              {(id) => (
                <BooleanInput
                  value={getDiffLogHeadingStyle() === 'distinct'}
                  onChange={(value) =>
                    setSetting('diffLog.headingStyle', value ? 'distinct' : 'default')
                  }
                  id={id}
                />
              )}
            </SettingControl>
          </div>
        </fieldset>
      </div>
    </div>
  );
}

interface SettingControlProps {
  label: string;
  noLabel?: boolean;
  children: (id: string) => JSX.Element;
}

function SettingControl(props: SettingControlProps) {
  const id = () =>
    `${props.label.toLowerCase().replace(/[^a-z0-9]/, '')}-${Math.random().toString(36).slice(2)}`;

  const className = 'col-span-full grid grid-cols-subgrid items-center py-1';

  return (
    <Switch>
      <Match when={props.noLabel}>
        <div class={className}>
          <span class="inline-block w-50">{props.label}</span>
          {props.children(id())}
        </div>
      </Match>
      <Match when={!props.noLabel}>
        <label class={className} for={id()}>
          <span>{props.label}</span>
          {props.children(id())}
        </label>
      </Match>
    </Switch>
  );
}
