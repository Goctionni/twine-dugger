import type { ValueType } from '@/shared/shared-types';

interface Props {
  type: ValueType;
}

const baseIconClasses =
  'inline-flex items-center justify-center w-5 h-4.5 px-1 rounded-xs text-[10px] font-bold font-mono leading-none align-middle';

const colored = (colors: string) => `${baseIconClasses} ${colors}`;

// The letters are drawn by CSS from data-letters, not written as text: an icon in an option of a
// select would otherwise be part of the label of the option in browsers that show only text
const icons: Record<ValueType, { letters: string; classes: string }> = {
  function: { letters: 'ƒ', classes: colored('bg-purple-500 text-white') },
  array: { letters: '[]', classes: colored('bg-sky-500 text-white') },
  set: { letters: 'S', classes: colored('bg-green-500 text-white') },
  map: { letters: 'M', classes: colored('bg-teal-500 text-white') },
  object: { letters: '{}', classes: colored('bg-blue-500 text-white') },
  date: { letters: 'D', classes: colored('bg-orange-500 text-white') },
  string: { letters: 'az', classes: colored('bg-yellow-400 text-yellow-900') },
  number: { letters: '#', classes: colored('bg-red-500 text-white') },
  NaN: { letters: '#?', classes: colored('bg-red-900 text-white') },
  infinity: { letters: '∞', classes: colored('bg-red-900 text-white') },
  boolean: { letters: '01', classes: colored('bg-black text-white') },
  null: { letters: 'ø', classes: colored('bg-slate-500 text-white') },
  undefined: { letters: '?', classes: colored('bg-gray-400 text-gray-800') },
  // A symbol of the icon font: its name is turned into the symbol
  other: {
    letters: 'asterisk',
    classes:
      'material-symbols-outlined inline-flex h-4.5 w-5 items-center justify-center rounded-xs bg-fuchsia-900 text-xs leading-none text-white',
  },
};

export function TypeIcon(props: Props) {
  return (
    <span
      title={props.type}
      data-letters={icons[props.type].letters}
      class={[icons[props.type].classes, 'before:content-[attr(data-letters)]']}
    />
  );
}
