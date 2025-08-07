import { Accessor, For, Show, createSignal } from 'solid-js';
import { PathChunk } from './types';
import { TypeIcon } from './TypeIcon';
import clsx from 'clsx';

interface Props {
  chunk: PathChunk;
  selectedProperty?: string | number;
  dataPropertyPath: (string | number)[];
  duplicatingProperty: string | null;
  duplicateName: string;
  setDuplicateName: (value: string) => void;
  onDuplicateSave: () => void;
  lockedProperties: Accessor<Map<string, unknown>>;
  onClick: (childKey: string | number) => void;
  onAddProperty: (key: string, value: unknown) => void;
}

const buttonClasses =
  'py-1 cursor-pointer border border-transparent shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:bg-gray-500 disabled:text-gray-300 disabled:cursor-not-allowed disabled:hover:bg-gray-500';

export function ObjectNav(props: Props) {
  const [adding, setAdding] = createSignal(false);
  const [newKey, setNewKey] = createSignal('');
  const [newType, setNewType] = createSignal<'string' | 'number' | 'boolean' | 'object' | 'array'>('string');
  const [newPrimitiveValue, setNewPrimitiveValue] = createSignal<string>('');
  
  return (
    <div class="min-w-[200px] flex flex-col h-full px-2 border-r border-r-gray-700">
      <p class="text-lg">{props.chunk.name}</p>
      <ul class="flex flex-1 flex-col overflow-auto">
        <For each={props.chunk.childKeys}>
          {(child) => (
            <>
              <li>
                <a
                  data-property={child.text}
                  on:click={() => props.onClick(child.text)}
                  class={clsx(
                    'flex items-center gap-1 p-1 cursor-pointer rounded-md',
                    child.text === props.selectedProperty
                      ? 'outline-gray-300 outline-2 -outline-offset-2'
                      : 'outline-transparent hover:bg-gray-700',
                  )}
                >
                  <TypeIcon type={child.type} />
                  <span class="flex-1 overflow-hidden overflow-ellipsis">
                    {child.text}
                    <Show when={props.lockedProperties().has(String(child.text))}>
                      {' 🔒'}
                    </Show>
                  </span>
                </a>
              </li>
              <Show when={props.duplicatingProperty === child.text}>
                <li class="flex items-center gap-2 px-2 py-1">
                  <input
                    class="border rounded px-2 py-1 text-sm bg-gray-800 text-white flex-1"
                    value={props.duplicateName}
                    onInput={(e) => props.setDuplicateName(e.currentTarget.value)}
                  />
                  <button
                    type="button"
                    onClick={props.onDuplicateSave}
                    class={clsx(
                      buttonClasses,
                      'text-white px-4 rounded-md bg-sky-600 hover:bg-sky-700 focus:ring-sky-500 whitespace-nowrap',
                    )}
                  >
                    Save
                  </button>
                </li>
              </Show>
            </>
          )}
        </For>
          <li class="px-1 py-2">
            <Show when={!adding()}>
              <button
                class="text-xs text-sky-300 hover:text-sky-100 underline"
                onClick={() => setAdding(true)}
              >
                ➕ Add property
              </button>
            </Show>

            <Show when={adding()}>
              <div class="flex flex-col gap-1 text-sm mt-1">
                <input
                  class="bg-gray-800 border rounded px-2 py-1 text-white"
                  placeholder="Property name"
                  value={newKey()}
                  onInput={(e) => setNewKey(e.currentTarget.value)}
                />

                <select
                  class="bg-gray-800 border rounded px-2 py-1 text-white"
                  value={newType()}
                  onChange={(e) =>
                    setNewType(e.currentTarget.value as 'string' | 'number' | 'boolean' | 'object' | 'array')
                  }
                >
                  <option value="string">String</option>
                  <option value="number">Number</option>
                  <option value="boolean">Boolean</option>
                  <option value="object">Object</option>
                  <option value="array">Array</option>
                </select>

                <Show when={['string', 'number', 'boolean'].includes(newType())}>
                  <input
                    class="bg-gray-800 border rounded px-2 py-1 text-white"
                    placeholder="Value"
                    value={newPrimitiveValue()}
                    onInput={(e) => setNewPrimitiveValue(e.currentTarget.value)}
                  />
                </Show>

                <div class="flex gap-2 mt-1">
                  <button
                    onClick={() => {
                      const key = newKey();
                      if (!key) return;

                      let value: unknown;

                      switch (newType()) {
                        case 'string':
                          value = newPrimitiveValue();
                          break;
                        case 'number':
                          value = Number(newPrimitiveValue());
                          break;
                        case 'boolean':
                          value = newPrimitiveValue().toLowerCase() === 'true';
                          break;
                        case 'object':
                          value = {};
                          break;
                        case 'array':
                          value = [];
                          break;
                      }

                      props.onAddProperty(key, value);

                      // reset form
                      setNewKey('');
                      setNewPrimitiveValue('');
                      setNewType('string');
                      setAdding(false);
                    }}
                    class={clsx(
                      buttonClasses,
                      'text-white px-3 rounded-md bg-green-600 hover:bg-green-700 focus:ring-green-500'
                    )}
                  >
                    Add
                  </button>
                  <button
                    onClick={() => setAdding(false)}
                    class="text-sm text-red-300 hover:text-red-100"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </Show>
          </li>
      </ul>
    </div>
  );
}
