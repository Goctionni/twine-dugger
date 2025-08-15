import { createSignal, Show } from 'solid-js';
import clsx from 'clsx';
import { PathChunk } from './types';

const inputClasses =
  'block px-2 py-1 bg-gray-700 border border-gray-600 text-sm shadow-sm placeholder-gray-400 text-gray-100 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500';

const buttonClasses =
  'py-1 cursor-pointer border border-transparent shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:bg-gray-500 disabled:text-gray-300 disabled:cursor-not-allowed disabled:hover:bg-gray-500';

type NewValueType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'map' | 'set';

export function AddPropertyDialog(props: {
  onConfirm: (name: string, value: unknown) => void;
  chunk: PathChunk;
}) {
  const [name, setName] = createSignal('');
  const [type, setType] = createSignal<NewValueType>('string');
  const [primitiveValue, setPrimitiveValue] = createSignal<string | number | boolean>('');
  
  function getValueFromType(type: NewValueType, primitiveValue: string | number | boolean): unknown {
    switch (type) {
      case 'string':
        return String(primitiveValue ?? '');
      case 'number':
        return Number(primitiveValue ?? 0);
      case 'boolean':
        return Boolean(primitiveValue);
      case 'object':
        return {};
      case 'array':
        return [];
      case 'map':
        return new Map();
      case 'set':
        return new Set();
    }
  }

  const getParentType = (): 'object' | 'array' | 'map' | 'set' | 'primitive' => {
    const value = props.chunk.getValue();

    if (Array.isArray(value)) return 'array';
    if (value instanceof Map) return 'map';
    if (value instanceof Set) return 'set';
    if (value !== null && typeof value === 'object') return 'object';

    return 'primitive';
  };

  function handleSubmit(e: Event) {
    e.preventDefault();
    const value = getValueFromType(type(), primitiveValue());
    const childKeys = props.chunk.childKeys.length
    
    let key: string;
    if (getParentType() === 'array') {
      key = String(childKeys ?? 0)
    } else if (getParentType() === 'set' || getParentType() === 'map') {
      key = '';
    } else {
      key = name();
    }

    props.onConfirm(key, value);
  }

  return (
    <form onSubmit={handleSubmit} class="flex flex-col gap-2">
      <Show when={getParentType() !== 'set' && getParentType() !== 'map' && getParentType() !== 'array'}>
        <input
          autofocus
          type="text"
          placeholder="Property name"
          value={name()}
          onInput={(e) => setName(e.currentTarget.value)}
          class={clsx(inputClasses, 'rounded-md')}
        />
      </Show>

      <select
        value={type()}
        onInput={(e) => setType(e.currentTarget.value as NewValueType)}
        class={clsx(inputClasses, 'rounded-md')}
      >
        <option value="string">String</option>
        <option value="number">Number</option>
        <option value="boolean">Boolean</option>
        <option value="object">Object</option>
        <option value="array">Array</option>
        <option value="map">Map</option>
        <option value="set">Set</option>
      </select>

      <Show when={['string', 'number', 'boolean'].includes(type())}>
        {type() === 'boolean' ? (
          <select
            value={String(primitiveValue())}
            onInput={(e) => setPrimitiveValue(e.currentTarget.value === 'true')}
            class={clsx(inputClasses, 'rounded-md')}
          >
            <option value="true">true</option>
            <option value="false">false</option>
          </select>
        ) : (
          <input
            type={type() === 'number' ? 'number' : 'text'}
            placeholder="Value"
            value={String(primitiveValue())}
            onInput={(e) =>
              setPrimitiveValue(
                type() === 'number' 
                  ? (isNaN(e.currentTarget.valueAsNumber) ? 0 : e.currentTarget.valueAsNumber) 
                  : e.currentTarget.value
              )
            }
            class={clsx(inputClasses, 'rounded-md')}
          />
        )}
      </Show>

      <button
        type="submit"
        class={clsx(
          buttonClasses,
          'text-white px-4 rounded-md bg-green-600 hover:bg-green-700 focus:ring-green-500',
        )}
      >
        Add {
          (getParentType() !== 'set' && getParentType() !== 'map' && getParentType() !== 'array') 
          ? 
          'Item' : 'Property'
        }
      </button>
    </form>
  );
}


