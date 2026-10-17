import { toolbarControl } from './toolbarControl';

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export function SearchInput(props: Props) {
  return (
    <input
      type="text"
      aria-label="Filter"
      placeholder="Filter…"
      class={[toolbarControl, 'min-w-15 flex-1 bg-gray-700 px-2 outline-none focus:border-sky-500']}
      value={props.value}
      onInput={(e) => props.onChange(e.currentTarget.value)}
    />
  );
}
