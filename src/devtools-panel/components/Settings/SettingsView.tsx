import { BooleanInput, NumberInput } from '../StateView/ValueView/PrimitiveInputs';
import {
  getDiffLogFontSize,
  setDiffLogFontSize,
  getDiffLogPollingInterval,
  setDiffLogPollingInterval,
  getDiffLogHeadingStyle,
  setDiffLogHeadingStyle,
} from '../../stores/settingsStore';
import { JSX } from 'solid-js';

function setterWithValidation<T>(setter: (v: T) => void, validator: (v: T) => boolean) {
  return (value: T) => (validator(value) ? setter(value) : undefined);
}

export function SettingsView() {
  return (
    <>
      <fieldset class="text-base">
        <legend class="text-lg font-bold">Diff Log</legend>
        <div class="grid grid-cols-[auto_1fr] gap-4">
          <SettingControl label="Font size">
            {(id) => (
              <NumberInput
                value={getDiffLogFontSize()}
                onChange={setterWithValidation(
                  setDiffLogFontSize,
                  (size) => size > 10 && size < 40,
                )}
                id={id}
                editable
              />
            )}
          </SettingControl>
          <SettingControl label="Polling interval">
            {(id) => (
              <NumberInput
                value={getDiffLogPollingInterval()}
                onChange={setterWithValidation(
                  setDiffLogPollingInterval,
                  (interval) => interval > 100 && interval < 5000,
                )}
                id={id}
                editable
              />
            )}
          </SettingControl>
          <SettingControl label="Heading Emphasis" noLabel>
            {(id) => (
              <BooleanInput
                value={getDiffLogHeadingStyle() === 'distinct'}
                onChange={(value) => setDiffLogHeadingStyle(value ? 'distinct' : 'default')}
                id={id}
                editable
              />
            )}
          </SettingControl>
        </div>
      </fieldset>
    </>
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

  if (props.noLabel) {
    return (
      <div class={className}>
        <span>{props.label}</span>
        {props.children(id())}
      </div>
    );
  }

  return (
    <label class={className} for={id()}>
      <span>{props.label}</span>
      {props.children(id())}
    </label>
  );
}
