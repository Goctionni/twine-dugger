import { createSignal, Show } from 'solid-js';
import clsx from 'clsx';

const inputClasses =
  'block px-2 py-1 bg-gray-700 border border-gray-600 text-sm shadow-sm placeholder-gray-400 text-gray-100 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500';

const buttonClasses =
  'py-1 cursor-pointer border border-transparent shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:bg-gray-500 disabled:text-gray-300 disabled:cursor-not-allowed disabled:hover:bg-gray-500';

type NewValueType = 'string' | 'number' | 'boolean' | 'object' | 'array';

export function AddPropertyDialog(props: { onConfirm: (name: string, value: unknown) => void }) {
  const [name, setName] = createSignal('');
  const [type, setType] = createSignal<NewValueType>('string');
  const [primitiveValue, setPrimitiveValue] = createSignal<string | number | boolean>('');

  function handleSubmit(e: Event) {
    e.preventDefault();
    let value: unknown;
    switch (type()) {
      case 'string':
        value = String(primitiveValue() ?? '');
        break;
      case 'number':
        value = Number(primitiveValue() ?? 0);
        break;
      case 'boolean':
        value = Boolean(primitiveValue());
        break;
      case 'object':
        value = {};
        break;
      case 'array':
        value = [];
        break;
    }
    props.onConfirm(name(), value);
  }

  return (
    <form onSubmit={handleSubmit} class="flex flex-col gap-2">
      <input
        autofocus
        type="text"
        placeholder="Property name"
        value={name()}
        onInput={(e) => setName(e.currentTarget.value)}
        class={clsx(inputClasses, 'rounded-md')}
      />

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
                type() === 'number' ? Number(e.currentTarget.value) : e.currentTarget.value,
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
        Add Property
      </button>
    </form>
  );
}
