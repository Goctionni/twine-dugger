import { For, Match, Show, Switch, createSignal } from 'solid-js';

import { TypeIcon } from '@/devtools-panel/ui/display/TypeIcon';
import { BooleanInput } from '@/devtools-panel/ui/inputs/BooleanInput';
import { NumberInput } from '@/devtools-panel/ui/inputs/NumberInput';
import { StringInput } from '@/devtools-panel/ui/inputs/StringInput';
import { btnClass } from '@/devtools-panel/ui/util/btnClass';
import { baseInputClasses } from '@/devtools-panel/ui/util/common-classes';
import { showPromptDialog } from '@/devtools-panel/ui/util/Prompt';
import type { JSONSafeValue } from '@/shared/shared-types';

import {
  NEW_TYPES,
  checkName,
  getEmptyValue,
  isContainerType,
  parseJsonValue,
  toJsonText,
  type AddTarget,
  type NewProperty,
  type NewType,
} from './add-property';

interface Options {
  target: AddTarget;
  /** The names that are taken */
  existingKeys: readonly (string | number)[];
  /** When everything in the container is of one type: the first step is skipped */
  defaultType?: NewType;
}

/** Resolves with the new property, or with nothing when the dialog was closed */
export async function showAddDialog(options: Options): Promise<NewProperty | undefined> {
  try {
    return await showPromptDialog<NewProperty | undefined>(
      options.target === 'array' ? 'Add item' : 'Add property',
      (done) => (
        <AddForm
          target={options.target}
          existingKeys={options.existingKeys}
          defaultType={options.defaultType}
          onDone={done}
        />
      ),
    );
  } catch {
    return undefined;
  }
}

interface FormProps extends Options {
  onDone: (result: NewProperty | undefined) => void;
}

// The containers on the first line, the primitives under them: every button as wide as the others
const FIRST_STEP_TYPES: readonly NewType[] = [
  'object',
  'map',
  'array',
  'set',
  'string',
  'number',
  'boolean',
];

const selectClass =
  'h-7.5 rounded-md border border-gray-600 bg-gray-700 px-2 text-sm text-gray-100 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none';
const fieldClass = 'flex flex-col gap-1 text-sm text-gray-300';

function AddForm(props: FormProps) {
  const [getType, setType] = createSignal<NewType | undefined>(props.defaultType);
  const [getName, setName] = createSignal('');
  const [isNameTouched, setNameTouched] = createSignal(false);
  const [getText, setText] = createSignal('');
  const [getNumber, setNumber] = createSignal(0);
  const [getBoolean, setBoolean] = createSignal(false);
  const [isMultiline, setMultiline] = createSignal(false);
  const [isJson, setJson] = createSignal(false);
  const [getJsonText, setJsonText] = createSignal('');

  const hasName = () => props.target !== 'array';
  const getTypedValue = (type: NewType): JSONSafeValue => {
    if (type === 'string') return getText();
    if (type === 'number') return getNumber();
    if (type === 'boolean') return getBoolean();
    return getEmptyValue(type);
  };

  // Another type starts from its own value; the name stays
  const changeType = (type: NewType) => {
    setType(type);
    setText('');
    setNumber(0);
    setBoolean(false);
    if (isJson()) setJsonText(toJsonText(getEmptyValue(type)));
  };

  const toggleJson = (type: NewType, on: boolean) => {
    if (on) {
      setJsonText(toJsonText(getTypedValue(type)));
    } else if (!isContainerType(type)) {
      // What was typed in the JSON stays when it still is a value of the type
      const parsed = parseJsonValue(type, getJsonText());
      if ('value' in parsed) {
        if (type === 'string') setText(parsed.value as string);
        if (type === 'number') setNumber(parsed.value as number);
        if (type === 'boolean') setBoolean(parsed.value as boolean);
      }
    }
    setJson(on);
  };

  const getParsed = (type: NewType) => (isJson() ? parseJsonValue(type, getJsonText()) : undefined);
  const getJsonProblem = (type: NewType) => {
    const parsed = getParsed(type);
    return parsed && 'error' in parsed ? parsed.error : undefined;
  };
  const getNameProblem = () => (hasName() ? checkName(getName(), props.existingKeys) : undefined);
  const canAdd = (type: NewType) => !getNameProblem() && !getJsonProblem(type);

  const submit = (type: NewType) => {
    if (!canAdd(type)) return;
    const parsed = getParsed(type);
    props.onDone({
      name: hasName() ? getName() : undefined,
      value: parsed && 'value' in parsed ? parsed.value : getTypedValue(type),
    });
  };

  const cancel = () => props.onDone(undefined);
  const cancelButton = () => (
    <button type="button" class={btnClass('outline', 'clr-gray')} onClick={cancel}>
      Cancel
    </button>
  );

  return (
    <Switch>
      <Match when={getType() === undefined}>
        <div class="flex w-full flex-col gap-3 py-2">
          <p class="text-sm text-gray-300">
            What type is the new {props.target === 'array' ? 'item' : 'property'}?
          </p>
          <div class="grid grid-cols-4 gap-2">
            <For each={FIRST_STEP_TYPES}>
              {(type) => (
                <button
                  type="button"
                  class="flex min-w-0 cursor-pointer items-center gap-2 rounded-md border border-gray-600 px-2 py-1.5 text-left text-sm capitalize hover:border-sky-500 hover:bg-sky-950"
                  onClick={() => changeType(type)}
                >
                  <TypeIcon type={type} />
                  <span class="truncate">{type}</span>
                </button>
              )}
            </For>
          </div>
        </div>
      </Match>
      <Match when={getType() !== undefined}>
        <form
          class="flex w-full flex-col gap-3 py-2"
          onSubmit={(event) => {
            event.preventDefault();
            submit(getType()!);
          }}
        >
          <label class={fieldClass}>
            Type
            <select
              class={['base-select', selectClass]}
              value={getType()}
              onChange={(event) => changeType(event.currentTarget.value as NewType)}
            >
              <button type="button">
                <selectedcontent />
              </button>
              <For each={NEW_TYPES}>
                {(type) => (
                  <option value={type}>
                    <TypeIcon type={type} />
                    {type}
                  </option>
                )}
              </For>
            </select>
          </label>

          <Show when={hasName()}>
            <label class={fieldClass}>
              Name
              <StringInput
                autoFocus
                value={getName()}
                onChange={(name) => {
                  setName(name);
                  setNameTouched(true);
                }}
                inputProps={{ spellcheck: false, autocomplete: 'off' }}
              />
            </label>
            <Show when={isNameTouched() && getNameProblem()}>
              <p class="-mt-2 text-xs text-red-400">{getNameProblem()}</p>
            </Show>
          </Show>

          <Switch>
            <Match when={isJson()}>
              <label class={fieldClass}>
                JSON
                <textarea
                  rows="6"
                  spellcheck="false"
                  value={getJsonText()}
                  onInput={(event) => setJsonText(event.currentTarget.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && event.ctrlKey) {
                      event.preventDefault();
                      submit(getType()!);
                    }
                  }}
                  class={[baseInputClasses, 'resize-y rounded-md font-mono']}
                />
              </label>
              <Show when={getJsonProblem(getType()!)}>
                <p class="-mt-2 text-xs text-red-400">{getJsonProblem(getType()!)}</p>
              </Show>
            </Match>
            <Match when={getType() === 'string'}>
              <label class={fieldClass}>
                Value
                <Show
                  when={isMultiline()}
                  fallback={<StringInput value={getText()} onChange={setText} />}
                >
                  <textarea
                    rows="3"
                    spellcheck="false"
                    value={getText()}
                    onInput={(event) => setText(event.currentTarget.value)}
                    class={[baseInputClasses, 'resize-y rounded-md font-mono']}
                  />
                </Show>
              </label>
              <label class="flex w-fit items-center gap-2 text-sm text-gray-300 select-none">
                <input
                  type="checkbox"
                  class="h-4 w-4 check-box"
                  checked={isMultiline() || getText().includes('\n')}
                  disabled={getText().includes('\n')}
                  onChange={(event) => setMultiline(event.currentTarget.checked)}
                />
                Multiline
              </label>
            </Match>
            <Match when={getType() === 'number'}>
              <label class={fieldClass}>
                Value
                <NumberInput fill value={getNumber()} onChange={setNumber} />
              </label>
            </Match>
            <Match when={getType() === 'boolean'}>
              <div class={fieldClass}>
                Value
                <BooleanInput label="Value" value={getBoolean()} onChange={setBoolean} />
              </div>
            </Match>
            <Match when={isContainerType(getType()!)}>
              <p class="text-xs text-gray-400">
                It is added empty. Edit as JSON to give it contents.
              </p>
            </Match>
          </Switch>

          <label class="flex w-fit items-center gap-2 text-sm text-gray-300 select-none">
            <input
              type="checkbox"
              class="h-4 w-4 check-box"
              checked={isJson()}
              onChange={(event) => toggleJson(getType()!, event.currentTarget.checked)}
            />
            Edit as JSON
          </label>

          <div class="flex justify-end gap-2">
            {cancelButton()}
            <button type="submit" class={btnClass('contained')} disabled={!canAdd(getType()!)}>
              Add
            </button>
          </div>
        </form>
      </Match>
    </Switch>
  );
}
